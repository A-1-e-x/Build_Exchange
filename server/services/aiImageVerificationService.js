const ImageAnalysis = require('../models/ImageAnalysis');
const Material = require('../models/Material');
const {
  generatePHash,
  calculateHammingDistance,
  calculateSimilarityScore,
  classifyHammingResult,
} = require('../utils/aiHashService');
const {
  calculateSHA256,
  inspectC2PAProvenance,
  inspectImageMetadata,
} = require('../utils/aiMetadataService');
const { searchExternalSources } = require('./reverseImageSearchService');
const { predictAiGenerated } = require('./aiInferenceService');
const { resolveImageBuffer } = require('./aiImageService');

/**
 * Advanced Multi-Signal AI Image Authenticity Verification Engine
 * 
 * Fuses 5 distinct evidence layers:
 * 1. Exact byte matching (SHA-256)
 * 2. Visual near-duplicate perceptual hashing (2D DCT pHash + Hamming Distance)
 * 3. Camera hardware EXIF and metadata forensics
 * 4. Synthetic / Generative AI detection (Spectral + ELA + micro-texture)
 * 5. C2PA Content Credentials and reverse image search matches
 */

/**
 * Runs complete multi-signal verification on an image
 * @param {object} params
 * @param {Buffer|string} params.imageSource - Image buffer, local path, or URL
 * @param {string} params.imageUrl - Public URL
 * @param {string} [params.public_id] - Cloudinary public ID
 * @param {string} [params.materialId] - Material ID if already saved
 * @param {string} [params.sellerId] - Seller ID
 * @param {boolean} [params.saveRecord=true] - Whether to persist result in MongoDB
 * @returns {Promise<object>} Structured verification result
 */
async function verifyImageAuthenticity({
  imageSource,
  imageUrl = '',
  public_id = '',
  materialId = null,
  sellerId = null,
  saveRecord = true,
}) {
  const checkedAt = new Date().toISOString();

  try {
    const buffer = await resolveImageBuffer(imageSource || imageUrl);

    // -------------------------------------------------------------
    // SIGNAL 1: Exact Byte Matching (SHA-256)
    // -------------------------------------------------------------
    const exactFileHash = calculateSHA256(buffer);

    // -------------------------------------------------------------
    // SIGNAL 2: Perceptual Hashing (2D DCT pHash)
    // -------------------------------------------------------------
    const imageHash = await generatePHash(buffer);

    // Query catalog for duplicate candidates (exclude same material to prevent self-matching)
    const catalogQuery = {
      imageHash: { $exists: true, $ne: '' },
      analysisStatus: 'completed',
    };
    if (materialId) {
      catalogQuery.materialId = { $ne: materialId };
    }

    const existingAnalyses = await ImageAnalysis.find(catalogQuery)
      .select('exactFileHash imageHash imageUrl materialId sellerId result reviewStatus')
      .populate('materialId', 'name category price sellerId status')
      .lean();

    let exactMatchFound = false;
    let minDistance = 64;
    let closestMatch = null;
    const similarMatches = [];

    const exactThreshold = Number(process.env.PHASH_EXACT_THRESHOLD || 0);
    const likelyThreshold = Number(process.env.PHASH_LIKELY_THRESHOLD || 5);
    const possibleThreshold = Number(process.env.PHASH_POSSIBLE_THRESHOLD || 10);

    for (const record of existingAnalyses) {
      // Check exact SHA-256 byte match
      if (record.exactFileHash && record.exactFileHash === exactFileHash) {
        exactMatchFound = true;
      }

      // Check pHash Hamming distance
      try {
        const dist = calculateHammingDistance(imageHash, record.imageHash);
        const score = calculateSimilarityScore(dist);

        if (dist <= possibleThreshold) {
          const matchItem = {
            analysisId: record._id,
            materialId: record.materialId?._id || record.materialId || null,
            materialName: record.materialId?.name || 'Existing Listing',
            materialCategory: record.materialId?.category || '',
            imageUrl: record.imageUrl,
            hammingDistance: dist,
            similarityScore: score,
            isExactByteMatch: record.exactFileHash === exactFileHash,
          };
          similarMatches.push(matchItem);

          if (dist < minDistance) {
            minDistance = dist;
            closestMatch = matchItem;
          }
        }
      } catch (err) {}
    }

    similarMatches.sort((a, b) => a.hammingDistance - b.hammingDistance);

    const duplicateMatch = exactMatchFound || (closestMatch && minDistance <= likelyThreshold);
    const duplicateSimilarity = closestMatch ? calculateSimilarityScore(minDistance) : 0;

    // -------------------------------------------------------------
    // SIGNAL 3: Camera EXIF & Metadata Forensics
    // -------------------------------------------------------------
    const metadataFindings = await inspectImageMetadata(buffer);

    // -------------------------------------------------------------
    // SIGNAL 4: C2PA Content Credentials Provenance
    // -------------------------------------------------------------
    const provenanceFindings = inspectC2PAProvenance(buffer);

    // -------------------------------------------------------------
    // SIGNAL 5: AI-Generated Synthetic Image Forensics
    // -------------------------------------------------------------
    const aiInference = await predictAiGenerated(buffer, imageUrl);
    const aiGeneratedScore = aiInference.aiGeneratedScore;

    // -------------------------------------------------------------
    // SIGNAL 6: Reverse Image Search & External Source Matching
    // -------------------------------------------------------------
    const reverseSearch = await searchExternalSources({ buffer, imageUrl, sha256: exactFileHash });
    const sourceMatches = reverseSearch.sourceMatches || [];

    // -------------------------------------------------------------
    // MULTI-SIGNAL DECISION ENGINE & RISK SCORING
    // -------------------------------------------------------------
    let riskScore = 0;
    const reasons = [];

    // Duplicate scoring
    if (exactMatchFound) {
      riskScore += 95;
      reasons.push(`Exact byte-level duplicate (100% SHA-256 match) found in listing: ${closestMatch?.materialName || 'Existing Material'}`);
    } else if (closestMatch && minDistance <= likelyThreshold) {
      riskScore += 80;
      reasons.push(`High perceptual similarity (${duplicateSimilarity}%, Hamming dist: ${minDistance}) with existing listing`);
    } else if (closestMatch && minDistance <= possibleThreshold) {
      riskScore += 40;
      reasons.push(`Moderate visual resemblance (${duplicateSimilarity}%) with an existing listing`);
    } else {
      reasons.push('No visual duplicates found across platform listings');
    }

    // AI generated scoring
    if (metadataFindings.isAiSoftwareDetected) {
      riskScore += 85;
      reasons.push(`Metadata confirms generative AI software signature: ${metadataFindings.detectedAiTool}`);
    } else if (aiGeneratedScore !== null) {
      if (aiGeneratedScore >= 0.70) {
        riskScore += 70;
        reasons.push(`Spectral and texture analysis indicates high likelihood of AI generation (score: ${aiGeneratedScore})`);
      } else if (aiGeneratedScore >= 0.50) {
        riskScore += 35;
        reasons.push(`Moderate frequency anomaly detected (synthetic score: ${aiGeneratedScore})`);
      } else {
        reasons.push(`Natural sensor noise confirmed (synthetic score: ${aiGeneratedScore})`);
      }
    }

    // External source matches
    if (sourceMatches.length > 0) {
      riskScore += 65;
      reasons.push(`Matched ${sourceMatches.length} external web sources via reverse search`);
    }

    // Camera Hardware EXIF credit / penalty
    if (metadataFindings.cameraMake && metadataFindings.cameraModel) {
      riskScore = Math.max(0, riskScore - 30);
      reasons.push(`Camera hardware tags verified (${metadataFindings.cameraMake} ${metadataFindings.cameraModel})`);
    } else if (metadataFindings.isStripped) {
      riskScore += 15;
      reasons.push('Camera EXIF metadata is stripped (common for browser downloads and messaging apps)');
    }

    // C2PA provenance credit
    if (provenanceFindings.c2paManifestFound) {
      riskScore = Math.max(0, riskScore - 25);
      reasons.push('Cryptographically verifiable C2PA Content Credentials container present');
    }

    // Bound risk score between 0 and 100
    riskScore = Math.min(100, Math.max(0, riskScore));

    // Determine verificationStatus
    let verificationStatus = 'LIKELY_ORIGINAL';
    let imageOriginPrediction = 'camera_captured';

    if (duplicateMatch) {
      verificationStatus = 'DUPLICATE_DETECTED';
      imageOriginPrediction = 'duplicate';
    } else if (metadataFindings.isAiSoftwareDetected || (aiGeneratedScore !== null && aiGeneratedScore >= 0.65)) {
      verificationStatus = 'POSSIBLY_AI_GENERATED';
      imageOriginPrediction = 'ai_generated';
    } else if (sourceMatches.length > 0 || (metadataFindings.isStripped && riskScore >= 45)) {
      verificationStatus = 'POSSIBLY_DOWNLOADED';
      imageOriginPrediction = 'web_downloaded';
    } else if (riskScore >= 40) {
      verificationStatus = 'MANUAL_REVIEW_REQUIRED';
      imageOriginPrediction = 'unknown';
    } else if (metadataFindings.cameraMake) {
      verificationStatus = 'LIKELY_ORIGINAL';
      imageOriginPrediction = 'camera_captured';
    } else {
      // Stripped metadata but normal texture and no duplicates -> low risk inconclusive
      verificationStatus = 'LIKELY_ORIGINAL';
      imageOriginPrediction = 'unknown';
    }

    // Determine confidence level
    let confidenceLevel = 'MEDIUM';
    if (exactMatchFound || (metadataFindings.cameraMake && metadataFindings.dateTimeOriginal) || metadataFindings.isAiSoftwareDetected) {
      confidenceLevel = 'HIGH';
    } else if (metadataFindings.isStripped && aiGeneratedScore === null) {
      confidenceLevel = 'LOW';
    }

    // Format legacy compatible 'result' field for existing UI & Admin queries
    let legacyResult = 'no_match';
    if (verificationStatus === 'DUPLICATE_DETECTED') {
      legacyResult = exactMatchFound || minDistance <= likelyThreshold ? 'likely_duplicate' : 'possible_duplicate';
    } else if (verificationStatus === 'POSSIBLY_AI_GENERATED' || verificationStatus === 'POSSIBLY_DOWNLOADED' || verificationStatus === 'MANUAL_REVIEW_REQUIRED') {
      legacyResult = 'suspicious';
    }

    const verificationPayload = {
      materialId: materialId || null,
      sellerId: sellerId || null,
      imageUrl: imageUrl || '',
      public_id: public_id || '',
      exactFileHash,
      imageHash,
      hammingDistance: closestMatch ? minDistance : null,
      similarityScore: duplicateSimilarity,
      verificationStatus,
      imageOriginPrediction,
      aiGeneratedScore,
      duplicateMatch,
      duplicateSimilarity,
      metadataFindings,
      provenanceFindings,
      sourceMatches,
      riskScore,
      confidenceLevel,
      reasons,
      closestMatch: closestMatch || null,
      similarMatches: similarMatches.slice(0, 5),
      result: legacyResult,
      analysisStatus: 'completed',
      modelName: 'MultiSignal-Forensics-v2.1',
      modelVersion: 'BuildExchange-v2.1',
      checkedAt,
      reviewStatus: verificationStatus === 'LIKELY_ORIGINAL' ? 'not_reviewed' : 'not_reviewed',
    };

    let savedRecord = null;
    if (saveRecord && imageUrl) {
      const existing = await ImageAnalysis.findOne({
        imageUrl,
        ...(materialId ? { materialId } : {}),
      });

      if (existing) {
        Object.assign(existing, verificationPayload);
        savedRecord = await existing.save();
      } else {
        savedRecord = await ImageAnalysis.create(verificationPayload);
      }
    }

    return {
      success: true,
      analysisId: savedRecord?._id || null,
      ...verificationPayload,
    };
  } catch (err) {
    console.error('[AI Verification Error]:', err.message);

    const fallbackResult = {
      success: false,
      verificationStatus: 'VERIFICATION_UNAVAILABLE',
      imageOriginPrediction: 'unknown',
      aiGeneratedScore: null,
      duplicateMatch: false,
      duplicateSimilarity: 0,
      metadataFindings: { hasExif: false, isStripped: true, warnings: [err.message] },
      provenanceFindings: { c2paManifestFound: false, hasDigitalSignature: false },
      sourceMatches: [],
      riskScore: 50,
      confidenceLevel: 'LOW',
      reasons: [`Verification unavailable: ${err.message}`],
      result: 'no_match',
      analysisStatus: 'failed',
      failureReason: err.message,
      modelVersion: 'BuildExchange-v2.1',
      checkedAt,
    };

    if (saveRecord && imageUrl) {
      try {
        await ImageAnalysis.create({
          materialId: materialId || null,
          sellerId: sellerId || null,
          imageUrl: imageUrl || '',
          public_id: public_id || '',
          exactFileHash: '0000000000000000000000000000000000000000000000000000000000000000',
          imageHash: '0000000000000000',
          ...fallbackResult,
        });
      } catch (e) {}
    }

    return fallbackResult;
  }
}

module.exports = {
  verifyImageAuthenticity,
};
