/**
 * BuildExchange - AI Image Authenticity Verification Benchmark
 * 
 * Evaluates the multi-signal image verification system across:
 * 1. Authentic camera-captured images (with camera EXIF hardware tags)
 * 2. Web-downloaded images (stripped metadata, standard web dimensions, external matches)
 * 3. Exact duplicate images (100% SHA-256 byte match)
 * 4. Near-duplicate images (2D DCT pHash, recompressed/scaled, Hamming distance <= 5)
 * 5. AI-generated / synthetic images (spectral anomalies, ELA artifacts, smoothed texture, tool tags)
 * 6. Recompressed AI images (stripped metadata, frequency domain spectral analysis)
 * 
 * Computes:
 * - Confusion Matrix (TP, FP, TN, FN)
 * - Precision, Recall, F1-Score, Accuracy
 * - False Positive Rate (FPR) and False Negative Rate (FNR)
 * Separately evaluates AI-generated detection and Duplicate detection.
 */

const path = require('path');
const dotenv = require('dotenv');
const sharp = require('sharp');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Material = require('../models/Material');
const ImageAnalysis = require('../models/ImageAnalysis');
const { verifyImageAuthenticity } = require('../services/aiImageVerificationService');
const { calculateSHA256 } = require('../utils/aiMetadataService');
const { registerMockExternalMatch } = require('../services/reverseImageSearchService');

/**
 * Metric calculator for binary classification
 */
function calculateMetrics({ tp, fp, tn, fn }) {
  const total = tp + fp + tn + fn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;
  const fnr = tp + fn > 0 ? fn / (tp + fn) : 0;

  return {
    tp,
    fp,
    tn,
    fn,
    total,
    accuracy: (accuracy * 100).toFixed(2) + '%',
    precision: (precision * 100).toFixed(2) + '%',
    recall: (recall * 100).toFixed(2) + '%',
    f1Score: (f1 * 100).toFixed(2) + '%',
    fpr: (fpr * 100).toFixed(2) + '%',
    fnr: (fnr * 100).toFixed(2) + '%',
    rawAccuracy: accuracy,
    rawPrecision: precision,
    rawRecall: recall,
    rawF1: f1,
    rawFpr: fpr,
    rawFnr: fnr,
  };
}

/**
 * Print formatted confusion matrix and statistics
 */
function printEvaluationBlock(title, metrics, positiveLabel, negativeLabel) {
  console.log(`\n===============================================================`);
  console.log(`   EVALUATION: ${title}`);
  console.log(`===============================================================`);
  console.log(`\n  Confusion Matrix:`);
  console.log(`  -------------------------------------------------------------`);
  console.log(`                             Predicted ${positiveLabel.padEnd(14)} | Predicted ${negativeLabel}`);
  console.log(`  Actual ${positiveLabel.padEnd(18)} : TP = ${String(metrics.tp).padEnd(6)} | FN = ${metrics.fn}`);
  console.log(`  Actual ${negativeLabel.padEnd(18)} : FP = ${String(metrics.fp).padEnd(6)} | TN = ${metrics.tn}`);
  console.log(`  -------------------------------------------------------------`);
  console.log(`  Performance Metrics:`);
  console.log(`  - Total Samples Evaluated : ${metrics.total}`);
  console.log(`  - Accuracy                : ${metrics.accuracy}`);
  console.log(`  - Precision               : ${metrics.precision}`);
  console.log(`  - Recall (Sensitivity)    : ${metrics.recall}`);
  console.log(`  - F1-Score                : ${metrics.f1Score}`);
  console.log(`  - False Positive Rate(FPR): ${metrics.fpr}`);
  console.log(`  - False Negative Rate(FNR): ${metrics.fnr}`);
  console.log(`===============================================================\n`);
}

/**
 * Helper to generate synthetic natural material texture with camera noise
 */
async function generateNaturalTextureBuffer(width, height, baseColor, cameraMeta = null) {
  const pixelCount = width * height;
  const rawData = Buffer.alloc(pixelCount * 3);

  for (let i = 0; i < pixelCount; i++) {
    const x = i % width;
    const y = Math.floor(i / width);

    // Natural structural patterns (strata, aggregates)
    const pattern = Math.sin(x / 25) * 15 + Math.cos(y / 20) * 12 + Math.sin((x + y) / 35) * 10;
    // Sensor noise & physical surface roughness
    const sensorGrain = (Math.random() - 0.5) * 45;

    rawData[i * 3] = Math.min(255, Math.max(0, Math.round(baseColor.r + pattern + sensorGrain)));
    rawData[i * 3 + 1] = Math.min(255, Math.max(0, Math.round(baseColor.g + pattern + sensorGrain)));
    rawData[i * 3 + 2] = Math.min(255, Math.max(0, Math.round(baseColor.b + pattern + sensorGrain)));
  }

  let pipeline = sharp(rawData, { raw: { width, height, channels: 3 } });

  if (cameraMeta) {
    pipeline = pipeline.withMetadata({
      exif: {
        IFD0: {
          Make: cameraMeta.make || 'Apple',
          Model: cameraMeta.model || 'iPhone 14 Pro',
          DateTime: cameraMeta.dateTime || '2025:05:12 11:30:45',
          Software: 'Camera App iOS 17.4',
        },
      },
    });
  }

  return pipeline.jpeg({ quality: 92 }).toBuffer();
}

/**
 * Helper to generate synthetic / AI-like smooth gradient texture
 */
async function generateAiTextureBuffer(width, height, options = {}) {
  const pixelCount = width * height;
  const rawData = Buffer.alloc(pixelCount * 3);

  for (let i = 0; i < pixelCount; i++) {
    const x = i % width;
    const y = Math.floor(i / width);

    // Ultra-smooth mathematical gradient without sensor noise
    const r = 135 + 115 * Math.sin(x / 40);
    const g = 125 + 115 * Math.cos(y / 40);
    const b = 145 + 105 * Math.sin((x + y) / 60);

    rawData[i * 3] = Math.min(255, Math.max(0, Math.round(r)));
    rawData[i * 3 + 1] = Math.min(255, Math.max(0, Math.round(g)));
    rawData[i * 3 + 2] = Math.min(255, Math.max(0, Math.round(b)));
  }

  let pipeline = sharp(rawData, { raw: { width, height, channels: 3 } });

  if (options.aiSoftwareTag) {
    pipeline = pipeline.withMetadata({
      exif: {
        IFD0: {
          Software: options.aiSoftwareTag,
        },
      },
    });
  }

  const quality = options.recompressed ? 75 : 95;
  return pipeline.jpeg({ quality }).toBuffer();
}

async function runBenchmark() {
  console.log('===============================================================');
  console.log('   BuildExchange AI Image Authenticity Benchmark Suite');
  console.log('===============================================================\n');

  await connectDB();

  // Create or retrieve benchmark user
  const benchmarkSeller = await User.findOneAndUpdate(
    { email: 'benchmark.seller@buildexchange.com' },
    {
      name: 'Benchmark Seller',
      email: 'benchmark.seller@buildexchange.com',
      phone: '9988112233',
      password: 'Password@123',
      role: 'seller',
    },
    { upsert: true, new: true }
  );

  // Clear previous benchmark analyses
  await ImageAnalysis.deleteMany({ sellerId: benchmarkSeller._id });

  console.log('Phase 1: Synthesizing Dataset Partitions (40 Samples)...\n');

  // -----------------------------------------------------------------
  // PARTITION 3: Platform Catalog Baseline Images (6 base samples)
  // Indexed first so that duplicate detection has a reference catalog
  // -----------------------------------------------------------------
  console.log('  [Setup] Indexing 6 Base Catalog Reference Images...');
  const baseCatalogMaterials = [];
  const baseCatalogBuffers = [];

  const baseConfigs = [
    { name: 'Red Clay Bricks Batch A', color: { r: 180, g: 75, b: 50 }, category: 'Bricks' },
    { name: 'Portland Cement Bags 50kg', color: { r: 140, g: 140, b: 140 }, category: 'Cement' },
    { name: 'River Sand Fine Grade', color: { r: 195, g: 165, b: 110 }, category: 'Sand' },
    { name: 'TMT Steel Rebar 12mm', color: { r: 90, g: 95, b: 105 }, category: 'Steel' },
    { name: 'Crushed Granite Aggregate', color: { r: 120, g: 115, b: 125 }, category: 'Aggregate' },
    { name: 'Teak Wood Planks Lot', color: { r: 160, g: 105, b: 65 }, category: 'Wood' },
  ];

  for (let i = 0; i < baseConfigs.length; i++) {
    const cfg = baseConfigs[i];
    const buf = await generateNaturalTextureBuffer(640, 480, cfg.color, {
      make: 'Apple',
      model: 'iPhone 13',
    });
    baseCatalogBuffers.push(buf);

    // Save as catalog material
    const mat = await Material.create({
      name: cfg.name,
      description: `Baseline benchmark catalog item for ${cfg.category}`,
      category: cfg.category,
      quantity: 100,
      unit: 'units',
      price: 500 + i * 100,
      condition: 'New',
      sellerId: benchmarkSeller._id,
      address: 'Plot 10, Industrial Estate',
      city: 'Mumbai',
      district: 'Mumbai City',
      state: 'Maharashtra',
      pincode: '400001',
      images: [{ url: `https://res.cloudinary.com/demo/image/upload/sample_base_${i}.jpg`, public_id: `sample_base_${i}` }],
    });
    baseCatalogMaterials.push(mat);

    // Index verification record into catalog
    await verifyImageAuthenticity({
      imageSource: buf,
      imageUrl: mat.images[0].url,
      public_id: mat.images[0].public_id,
      materialId: mat._id,
      sellerId: benchmarkSeller._id,
      saveRecord: true,
    });
  }
  console.log('  -> Base Catalog successfully indexed.\n');

  // -----------------------------------------------------------------
  // PARTITION 1: Authentic Camera-Captured Images (8 samples)
  // High-res, sensor noise, real camera hardware EXIF tags
  // -----------------------------------------------------------------
  console.log('  [Partition 1] Generating 8 Authentic Camera Images (EXIF + Sensor Noise)...');
  const cameraSamples = [];
  const cameraConfigs = [
    { name: 'Sony Alpha Bricks', color: { r: 175, g: 80, b: 55 }, make: 'Sony', model: 'ILCE-7M4' },
    { name: 'Samsung S23 Concrete', color: { r: 135, g: 135, b: 138 }, make: 'Samsung', model: 'Galaxy S23' },
    { name: 'Canon EOS Timber', color: { r: 155, g: 100, b: 60 }, make: 'Canon', model: 'EOS R5' },
    { name: 'Nikon Z7 Sand', color: { r: 190, g: 160, b: 115 }, make: 'Nikon', model: 'Z 7 II' },
    { name: 'iPhone 14 Gravel', color: { r: 115, g: 120, b: 125 }, make: 'Apple', model: 'iPhone 14 Pro' },
    { name: 'Google Pixel Marble', color: { r: 215, g: 210, b: 205 }, make: 'Google', model: 'Pixel 8 Pro' },
    { name: 'OnePlus 11 Rebar', color: { r: 85, g: 90, b: 100 }, make: 'OnePlus', model: 'OnePlus 11' },
    { name: 'Fujifilm Tiles', color: { r: 170, g: 145, b: 130 }, make: 'FUJIFILM', model: 'X-T5' },
  ];

  for (const cfg of cameraConfigs) {
    const buf = await generateNaturalTextureBuffer(800, 600, cfg.color, {
      make: cfg.make,
      model: cfg.model,
      dateTime: '2025:06:14 09:15:30',
    });
    cameraSamples.push({
      name: cfg.name,
      buffer: buf,
      expected: {
        isAiGenerated: false,
        isDuplicate: false,
        isWebDownloaded: false,
        origin: 'camera_captured',
      },
    });
  }

  // -----------------------------------------------------------------
  // PARTITION 2: Web-Downloaded External Images (6 samples)
  // Stripped metadata, web dimensions, external reverse matches
  // -----------------------------------------------------------------
  console.log('  [Partition 2] Generating 6 Web-Downloaded Images (Stripped Metadata + Web Match)...');
  const webSamples = [];
  const webConfigs = [
    { name: 'Stock Photo Cement', color: { r: 130, g: 130, b: 135 }, domain: 'istockphoto.com' },
    { name: 'IndiaMart Brick Pile', color: { r: 185, g: 70, b: 45 }, domain: 'indiamart.com' },
    { name: 'Shutterstock Rebar', color: { r: 80, g: 85, b: 95 }, domain: 'shutterstock.com' },
    { name: 'Alibaba Tiles', color: { r: 200, g: 180, b: 170 }, domain: 'alibaba.com' },
    { name: 'Pinterest Timber Pile', color: { r: 150, g: 95, b: 55 }, domain: 'pinterest.com' },
    { name: 'Catalog Sand Texture', color: { r: 200, g: 170, b: 120 }, domain: 'gettyimages.com' },
  ];

  for (let i = 0; i < webConfigs.length; i++) {
    const cfg = webConfigs[i];
    // Stripped metadata (no EXIF camera block), 600x450 web dimensions
    const buf = await generateNaturalTextureBuffer(600, 450, cfg.color, null);
    const hash = calculateSHA256(buf);

    // Register simulated web source match in reverse search mock registry
    registerMockExternalMatch(hash, [
      {
        title: `${cfg.name} - Construction Stock Catalog`,
        link: `https://www.${cfg.domain}/items/${1000 + i}`,
        domain: cfg.domain,
        matchType: 'exact_source',
      },
    ]);

    webSamples.push({
      name: cfg.name,
      buffer: buf,
      expected: {
        isAiGenerated: false,
        isDuplicate: false,
        isWebDownloaded: true,
        origin: 'web_downloaded',
      },
    });
  }

  // -----------------------------------------------------------------
  // PARTITION 4: Exact Duplicate Uploads (6 samples)
  // Exact identical byte stream matching 100% SHA-256 against base catalog
  // -----------------------------------------------------------------
  console.log('  [Partition 4] Generating 6 Exact Duplicate Uploads (100% SHA-256 Byte Match)...');
  const exactDuplicateSamples = [];
  for (let i = 0; i < baseCatalogBuffers.length; i++) {
    exactDuplicateSamples.push({
      name: `Exact Duplicate of Base ${i + 1} (${baseConfigs[i].name})`,
      buffer: Buffer.from(baseCatalogBuffers[i]), // exact identical clone
      expected: {
        isAiGenerated: false,
        isDuplicate: true,
        isWebDownloaded: false,
        origin: 'duplicate',
      },
    });
  }

  // -----------------------------------------------------------------
  // PARTITION 5: Near-Duplicate Uploads (6 samples)
  // Recompressed (quality 60), scaled/resized, pHash Hamming <= 5
  // -----------------------------------------------------------------
  console.log('  [Partition 5] Generating 6 Near-Duplicate Uploads (Recompressed/Scaled, Hamming <= 5)...');
  const nearDuplicateSamples = [];
  for (let i = 0; i < baseCatalogBuffers.length; i++) {
    // Recompress and downscale 15%
    const recompressed = await sharp(baseCatalogBuffers[i])
      .resize(544, 408)
      .jpeg({ quality: 62 })
      .toBuffer();

    nearDuplicateSamples.push({
      name: `Near-Duplicate of Base ${i + 1} (${baseConfigs[i].name})`,
      buffer: recompressed,
      expected: {
        isAiGenerated: false,
        isDuplicate: true,
        isWebDownloaded: false,
        origin: 'duplicate',
      },
    });
  }

  // -----------------------------------------------------------------
  // PARTITION 6: AI-Generated / Synthetic Images (8 samples)
  // 4 with AI tool metadata signatures, 4 recompressed synthetic images
  // -----------------------------------------------------------------
  console.log('  [Partition 6] Generating 8 AI-Generated / Synthetic Images (Spectral/ELA/Tool Signatures)...');
  const aiSamples = [];
  const aiConfigs = [
    { name: 'Midjourney Synthetic Bricks', tool: 'Midjourney v6.0', recompressed: false },
    { name: 'Stable Diffusion Rebar', tool: 'Stable Diffusion webui', recompressed: false },
    { name: 'DALL-E 3 Concrete Block', tool: 'DALL-E 3', recompressed: false },
    { name: 'Adobe Firefly Timber', tool: 'Adobe Firefly', recompressed: false },
    { name: 'Recompressed AI Smooth 1', tool: null, recompressed: true },
    { name: 'Recompressed AI Smooth 2', tool: null, recompressed: true },
    { name: 'Recompressed AI Smooth 3', tool: null, recompressed: true },
    { name: 'Recompressed AI Smooth 4', tool: null, recompressed: true },
  ];

  for (const cfg of aiConfigs) {
    const buf = await generateAiTextureBuffer(600, 450, {
      aiSoftwareTag: cfg.tool,
      recompressed: cfg.recompressed,
    });

    aiSamples.push({
      name: cfg.name,
      buffer: buf,
      expected: {
        isAiGenerated: true,
        isDuplicate: false,
        isWebDownloaded: false,
        origin: 'ai_generated',
      },
    });
  }

  // Assemble full evaluation benchmark dataset (8 + 6 + 6 + 6 + 8 = 34 query samples)
  const allEvaluationSamples = [
    ...cameraSamples,
    ...webSamples,
    ...exactDuplicateSamples,
    ...nearDuplicateSamples,
    ...aiSamples,
  ];

  console.log(`\nPhase 2: Executing Multi-Signal Verification on All ${allEvaluationSamples.length} Samples...\n`);

  // Metric tracking accumulators
  const aiStats = { tp: 0, fp: 0, tn: 0, fn: 0 };
  const duplicateStats = { tp: 0, fp: 0, tn: 0, fn: 0 };
  const webStats = { tp: 0, fp: 0, tn: 0, fn: 0 };
  const originStats = { total: 0, correct: 0 };

  const sampleResults = [];
  const startTime = Date.now();

  for (let i = 0; i < allEvaluationSamples.length; i++) {
    const sample = allEvaluationSamples[i];
    const result = await verifyImageAuthenticity({
      imageSource: sample.buffer,
      imageUrl: `https://res.cloudinary.com/demo/image/upload/bench_eval_${i}.jpg`,
      sellerId: benchmarkSeller._id,
      saveRecord: false, // evaluate in-memory without polluting catalog
    });

    // 1. AI-Generated Evaluation (Binary: AI vs Non-AI)
    const predictedAi =
      result.verificationStatus === 'POSSIBLY_AI_GENERATED' ||
      result.imageOriginPrediction === 'ai_generated' ||
      (result.aiGeneratedScore !== null && result.aiGeneratedScore >= 0.65) ||
      result.metadataFindings?.isAiSoftwareDetected === true;

    const actualAi = sample.expected.isAiGenerated;

    if (actualAi && predictedAi) aiStats.tp++;
    else if (!actualAi && predictedAi) aiStats.fp++;
    else if (!actualAi && !predictedAi) aiStats.tn++;
    else if (actualAi && !predictedAi) aiStats.fn++;

    // 2. Duplicate Detection Evaluation (Binary: Duplicate vs Distinct)
    const predictedDuplicate =
      result.duplicateMatch === true ||
      result.verificationStatus === 'DUPLICATE_DETECTED' ||
      result.imageOriginPrediction === 'duplicate';

    const actualDuplicate = sample.expected.isDuplicate;

    if (actualDuplicate && predictedDuplicate) duplicateStats.tp++;
    else if (!actualDuplicate && predictedDuplicate) duplicateStats.fp++;
    else if (!actualDuplicate && !predictedDuplicate) duplicateStats.tn++;
    else if (actualDuplicate && !predictedDuplicate) duplicateStats.fn++;

    // 3. Web-Downloaded Evaluation (Binary: Downloaded vs Other)
    const predictedWeb =
      result.verificationStatus === 'POSSIBLY_DOWNLOADED' ||
      result.imageOriginPrediction === 'web_downloaded' ||
      (result.sourceMatches && result.sourceMatches.length > 0);

    const actualWeb = sample.expected.isWebDownloaded;

    if (actualWeb && predictedWeb) webStats.tp++;
    else if (!actualWeb && predictedWeb) webStats.fp++;
    else if (!actualWeb && !predictedWeb) webStats.tn++;
    else if (actualWeb && !predictedWeb) webStats.fn++;

    // 4. Multi-class Origin Prediction Evaluation
    originStats.total++;
    const isOriginCorrect = result.imageOriginPrediction === sample.expected.origin;
    if (isOriginCorrect) {
      originStats.correct++;
    }

    sampleResults.push({
      sampleName: sample.name,
      expectedOrigin: sample.expected.origin,
      predictedOrigin: result.imageOriginPrediction,
      status: result.verificationStatus,
      aiScore: result.aiGeneratedScore,
      duplicateMatch: result.duplicateMatch,
      similarity: result.duplicateSimilarity,
      riskScore: result.riskScore,
      reasonsCount: result.reasons?.length || 0,
      isOriginCorrect,
    });
  }

  const durationMs = Date.now() - startTime;

  // Print sample diagnostic table
  console.log('--------------------------------------------------------------------------------------------------------');
  console.log(' # | Sample Name                       | Expected  | Predicted | Status               | Risk | AI Scr | Match');
  console.log('--------------------------------------------------------------------------------------------------------');
  sampleResults.forEach((s, idx) => {
    const num = String(idx + 1).padStart(2);
    const name = s.sampleName.padEnd(33).slice(0, 33);
    const exp = s.expectedOrigin.padEnd(9).slice(0, 9);
    const pred = s.predictedOrigin.padEnd(9).slice(0, 9);
    const stat = s.status.padEnd(20).slice(0, 20);
    const risk = String(s.riskScore).padStart(4);
    const ai = s.aiScore !== null ? s.aiScore.toFixed(2).padStart(6) : '  null';
    const match = s.duplicateMatch ? ' YES' : '  NO';
    console.log(`${num} | ${name} | ${exp} | ${pred} | ${stat} | ${risk} | ${ai} | ${match}`);
  });
  console.log('--------------------------------------------------------------------------------------------------------\n');

  // Compute final metric summaries
  const aiMetrics = calculateMetrics(aiStats);
  const duplicateMetrics = calculateMetrics(duplicateStats);
  const webMetrics = calculateMetrics(webStats);
  const originAccuracy = ((originStats.correct / originStats.total) * 100).toFixed(2);

  // Print detailed blocks
  printEvaluationBlock('AI-GENERATED IMAGE DETECTION', aiMetrics, 'AI-Generated', 'Authentic / Real');
  printEvaluationBlock('DUPLICATE IMAGE DETECTION (Exact + Near-Duplicate)', duplicateMetrics, 'Duplicate', 'Distinct / New');
  printEvaluationBlock('EXTERNAL / WEB-DOWNLOADED IMAGE DETECTION', webMetrics, 'Web-Downloaded', 'Original / Other');

  console.log(`===============================================================`);
  console.log(`   OVERALL BENCHMARK SUMMARY`);
  console.log(`===============================================================`);
  console.log(`  - Total Benchmark Queries  : ${originStats.total} images`);
  console.log(`  - Execution Time           : ${durationMs} ms (~${(durationMs / originStats.total).toFixed(1)} ms/image)`);
  console.log(`  - Overall Origin Accuracy  : ${originAccuracy}% (${originStats.correct}/${originStats.total})`);
  console.log(`  - AI Detection F1-Score    : ${aiMetrics.f1Score} (Precision: ${aiMetrics.precision}, Recall: ${aiMetrics.recall})`);
  console.log(`  - AI False Positive Rate   : ${aiMetrics.fpr}`);
  console.log(`  - AI False Negative Rate   : ${aiMetrics.fnr}`);
  console.log(`  - Duplicate F1-Score       : ${duplicateMetrics.f1Score} (Precision: ${duplicateMetrics.precision}, Recall: ${duplicateMetrics.recall})`);
  console.log(`  - Duplicate False Pos Rate : ${duplicateMetrics.fpr}`);
  console.log(`  - Duplicate False Neg Rate : ${duplicateMetrics.fnr}`);
  console.log(`===============================================================\n`);

  // Clean up benchmark data
  await Material.deleteMany({ sellerId: benchmarkSeller._id });
  await ImageAnalysis.deleteMany({ sellerId: benchmarkSeller._id });

  await mongoose.connection.close();
  return {
    aiMetrics,
    duplicateMetrics,
    webMetrics,
    originAccuracy,
    totalSamples: originStats.total,
  };
}

if (require.main === module) {
  runBenchmark()
    .then(() => {
      console.log('Benchmark run completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Benchmark execution failed:', err);
      process.exit(1);
    });
}

module.exports = { runBenchmark };
