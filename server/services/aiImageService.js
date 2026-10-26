const fs = require('fs');
const path = require('path');
const ImageAnalysis = require('../models/ImageAnalysis');
const Material = require('../models/Material');
const {
  generatePHash,
  calculateHammingDistance,
  calculateSimilarityScore,
  classifyHammingResult,
} = require('../utils/aiHashService');

/**
 * Resolves an image buffer from either a Buffer, local path, or remote URL
 * @param {Buffer|string} input - Buffer, local path, or remote URL
 * @returns {Promise<Buffer>}
 */
async function resolveImageBuffer(input) {
  if (Buffer.isBuffer(input)) {
    return input;
  }

  if (typeof input !== 'string' || !input.trim()) {
    throw new Error('Invalid image input: expected Buffer or URL/filepath string');
  }

  const trimmed = input.trim();

  // Local filesystem path (e.g., /uploads/123.jpg or full path)
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const filename = path.basename(trimmed);
    const localPath = path.join(__dirname, '..', 'public', 'uploads', filename);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
  }

  if (fs.existsSync(trimmed)) {
    return fs.readFileSync(trimmed);
  }

  // Remote HTTP / HTTPS URL (e.g., Cloudinary)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const response = await fetch(trimmed, {
      signal: AbortSignal.timeout(10000), // 10s safety timeout
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error(`Unable to resolve image source: ${trimmed}`);
}

/**
 * Analyses an image, calculates its pHash, and compares against all indexed images in MongoDB
 * @param {object} params
 * @param {Buffer|string} params.imageSource - Buffer, URL, or local path
 * @param {string} params.imageUrl - Public URL of the image
 * @param {string} [params.public_id] - Cloudinary public id
 * @param {string} [params.materialId] - Material ID if already created
 * @param {string} [params.sellerId] - Seller User ID
 * @param {boolean} [params.saveRecord=true] - Whether to persist result in MongoDB
 * @returns {Promise<object>} Analysis summary with results and closest matches
 */
async function analyzeImage({
  imageSource,
  imageUrl,
  public_id = '',
  materialId = null,
  sellerId = null,
  saveRecord = true,
}) {
  try {
    const buffer = await resolveImageBuffer(imageSource || imageUrl);
    const hash = await generatePHash(buffer);

    // Fetch existing image analyses for comparison
    // Exclude images belonging to the same material to prevent self-comparison
    const query = {
      imageHash: { $exists: true, $ne: '' },
      analysisStatus: 'completed',
    };

    if (materialId) {
      query.materialId = { $ne: materialId };
    }

    const existingAnalyses = await ImageAnalysis.find(query)
      .select('imageHash imageUrl materialId sellerId result reviewStatus')
      .populate('materialId', 'name category price sellerId status')
      .lean();

    let minDistance = 64;
    let closestMatch = null;
    const similarMatches = [];

    const likelyThreshold = Number(process.env.PHASH_LIKELY_THRESHOLD || 5);
    const possibleThreshold = Number(process.env.PHASH_POSSIBLE_THRESHOLD || 10);

    for (const record of existingAnalyses) {
      try {
        const distance = calculateHammingDistance(hash, record.imageHash);
        const score = calculateSimilarityScore(distance);

        // Record any match within the possible threshold (distance <= 10)
        if (distance <= possibleThreshold) {
          const matchDetail = {
            analysisId: record._id,
            materialId: record.materialId?._id || record.materialId || null,
            materialName: record.materialId?.name || 'Existing Listing',
            materialCategory: record.materialId?.category || '',
            imageUrl: record.imageUrl,
            hammingDistance: distance,
            similarityScore: score,
          };
          similarMatches.push(matchDetail);

          if (distance < minDistance) {
            minDistance = distance;
            closestMatch = matchDetail;
          }
        }
      } catch (distErr) {
        // Skip any corrupt hash record without breaking loop
      }
    }

    // Sort similar matches by distance ascending (closest first)
    similarMatches.sort((a, b) => a.hammingDistance - b.hammingDistance);

    const result = closestMatch
      ? classifyHammingResult(minDistance, { likely: likelyThreshold, possible: possibleThreshold })
      : 'no_match';

    const finalDistance = closestMatch ? minDistance : null;
    const finalScore = closestMatch ? calculateSimilarityScore(minDistance) : 0;

    const analysisData = {
      materialId: materialId || null,
      sellerId: sellerId || null,
      imageUrl: imageUrl || '',
      public_id: public_id || '',
      imageHash: hash,
      hammingDistance: finalDistance,
      similarityScore: finalScore,
      result,
      closestMatch: closestMatch || null,
      similarMatches: similarMatches.slice(0, 5), // Keep top 5 matches
      analysisStatus: 'completed',
      modelName: 'pHash-DCT-64',
      reviewStatus: result === 'no_match' ? 'not_reviewed' : 'not_reviewed',
    };

    let savedRecord = null;
    if (saveRecord && imageUrl) {
      // Check if this exact image under this material is already indexed
      const existing = await ImageAnalysis.findOne({
        imageUrl,
        ...(materialId ? { materialId } : {}),
      });

      if (existing) {
        Object.assign(existing, analysisData);
        savedRecord = await existing.save();
      } else {
        savedRecord = await ImageAnalysis.create(analysisData);
      }
    }

    return {
      success: true,
      analysisId: savedRecord?._id || null,
      imageHash: hash,
      result,
      hammingDistance: finalDistance,
      similarityScore: finalScore,
      closestMatch,
      similarMatches: similarMatches.slice(0, 5),
      thresholds: {
        likely: likelyThreshold,
        possible: possibleThreshold,
      },
      message:
        result === 'likely_duplicate'
          ? 'Likely duplicate or visually identical image detected.'
          : result === 'possible_duplicate'
          ? 'Visually similar image detected. Advisory warning.'
          : 'No duplicate image matches detected.',
    };
  } catch (error) {
    console.error('[AI Image Analysis Error]:', error.message);

    // If configured to save, record failed state
    if (saveRecord && imageUrl) {
      try {
        await ImageAnalysis.create({
          materialId: materialId || null,
          sellerId: sellerId || null,
          imageUrl: imageUrl || '',
          public_id: public_id || '',
          imageHash: '0000000000000000',
          analysisStatus: 'failed',
          failureReason: error.message,
          result: 'no_match',
        });
      } catch (persistErr) {
        // Suppress failure persistence error
      }
    }

    return {
      success: false,
      result: 'no_match',
      analysisStatus: 'failed',
      error: error.message,
      message: 'Image analysis could not be completed at this time.',
    };
  }
}

/**
 * Idempotently indexes and verifies all images for a given material
 * Safe for background execution without breaking caller workflow
 * @param {object} material - Material document or object
 * @param {string} sellerId - Seller User ID
 */
async function indexMaterialImages(material, sellerId) {
  if (!material || !material.images || !material.images.length) return [];

  const { verifyImageAuthenticity } = require('./aiImageVerificationService');
  const results = [];

  for (const img of material.images) {
    try {
      if (!img.url) continue;

      // Check if already indexed
      const existing = await ImageAnalysis.findOne({
        materialId: material._id,
        imageUrl: img.url,
      });

      if (existing && existing.analysisStatus === 'completed') {
        results.push(existing);
        continue;
      }

      const res = await verifyImageAuthenticity({
        imageSource: img.url,
        imageUrl: img.url,
        public_id: img.public_id || '',
        materialId: material._id,
        sellerId: sellerId || material.sellerId,
        saveRecord: true,
      });
      results.push(res);
    } catch (err) {
      console.warn(`[AI Index Warning]: Failed to verify image for material ${material._id}:`, err.message);
    }
  }

  // Update material document verificationSummary & isApproved
  if (results.length > 0) {
    try {
      const highestRisk = results.reduce(
        (prev, curr) => ((curr.riskScore || 0) > (prev.riskScore || 0) ? curr : prev),
        results[0]
      );

      const isFlagged = [
        'DUPLICATE_DETECTED',
        'POSSIBLY_AI_GENERATED',
        'POSSIBLY_DOWNLOADED',
        'MANUAL_REVIEW_REQUIRED',
      ].includes(highestRisk.verificationStatus);

      await Material.findByIdAndUpdate(material._id, {
        ...(isFlagged ? { isApproved: false } : {}),
        verificationSummary: {
          status: highestRisk.verificationStatus || 'LIKELY_ORIGINAL',
          origin: highestRisk.imageOriginPrediction || 'camera_captured',
          riskScore: highestRisk.riskScore || 0,
          aiGeneratedScore: highestRisk.aiGeneratedScore || null,
          duplicateMatch: !!highestRisk.duplicateMatch,
          checkedAt: new Date(),
        },
      });
    } catch (summaryErr) {
      // Non-fatal summary update warning
    }
  }

  return results;
}

/**
 * Batch indexes any materials in MongoDB that lack an ImageAnalysis record
 * Useful for initializing or syncing seeded materials
 */
async function syncAllMaterials() {
  const { verifyImageAuthenticity } = require('./aiImageVerificationService');
  const materials = await Material.find().select('_id sellerId images name').lean();
  let indexedCount = 0;
  let skippedCount = 0;

  for (const mat of materials) {
    if (!mat.images || !mat.images.length) continue;

    for (const img of mat.images) {
      const existing = await ImageAnalysis.findOne({
        materialId: mat._id,
        imageUrl: img.url,
      });

      if (existing) {
        skippedCount++;
      } else {
        await verifyImageAuthenticity({
          imageSource: img.url,
          imageUrl: img.url,
          public_id: img.public_id || '',
          materialId: mat._id,
          sellerId: mat.sellerId,
          saveRecord: true,
        });
        indexedCount++;
      }
    }
  }

  return { indexedCount, skippedCount, totalMaterials: materials.length };
}

module.exports = {
  analyzeImage,
  indexMaterialImages,
  syncAllMaterials,
  resolveImageBuffer,
};
