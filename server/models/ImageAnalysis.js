const mongoose = require('mongoose');

const matchDetailSchema = new mongoose.Schema(
  {
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImageAnalysis',
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    hammingDistance: {
      type: Number,
      required: true,
    },
    similarityScore: {
      type: Number,
      default: 0,
    },
    isExactByteMatch: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const sourceMatchSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    link: { type: String, default: '' },
    source: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    similarityScore: { type: Number, default: 0 },
  },
  { _id: false }
);

const imageAnalysisSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      index: true,
      default: null,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required for analysis'],
      trim: true,
    },
    public_id: {
      type: String,
      default: '',
      trim: true,
    },

    // Module A: Exact and Near-Duplicate Signatures
    exactFileHash: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    imageHash: {
      type: String,
      required: [true, 'Perceptual hash is required'],
      trim: true,
      index: true,
    },
    hammingDistance: {
      type: Number,
      default: null,
    },
    similarityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    duplicateMatch: {
      type: Boolean,
      default: false,
    },
    duplicateSimilarity: {
      type: Number,
      default: 0,
    },
    closestMatch: {
      type: matchDetailSchema,
      default: null,
    },
    similarMatches: {
      type: [matchDetailSchema],
      default: [],
    },

    // Module B & D: Metadata, Provenance & Origins
    metadataFindings: {
      hasExif: { type: Boolean, default: false },
      isStripped: { type: Boolean, default: true },
      evidenceType: { type: String, default: 'INCONCLUSIVE' },
      cameraMake: { type: String, default: null },
      cameraModel: { type: String, default: null },
      lensModel: { type: String, default: null },
      software: { type: String, default: null },
      isAiSoftwareDetected: { type: Boolean, default: false },
      detectedAiTool: { type: String, default: null },
      dateTimeOriginal: { type: String, default: null },
      iso: { type: Number, default: null },
      focalLength: { type: Number, default: null },
      fNumber: { type: Number, default: null },
      exposureTime: { type: Number, default: null },
      hasGps: { type: Boolean, default: false },
      dimensions: { type: String, default: null },
      format: { type: String, default: null },
      colorSpace: { type: String, default: 'srgb' },
      density: { type: Number, default: null },
      warnings: { type: [String], default: [] },
    },
    provenanceFindings: {
      c2paManifestFound: { type: Boolean, default: false },
      hasDigitalSignature: { type: Boolean, default: false },
      issuer: { type: String, default: null },
      claimGenerator: { type: String, default: null },
      details: { type: String, default: '' },
    },
    sourceMatches: {
      type: [sourceMatchSchema],
      default: [],
    },

    // Module C: AI-Generated Synthetic Detection
    aiGeneratedScore: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },

    // Multi-Signal Risk & Classification Decisions
    verificationStatus: {
      type: String,
      enum: [
        'LIKELY_ORIGINAL',
        'POSSIBLY_DOWNLOADED',
        'POSSIBLY_AI_GENERATED',
        'DUPLICATE_DETECTED',
        'MANUAL_REVIEW_REQUIRED',
        'VERIFICATION_UNAVAILABLE',
      ],
      default: 'LIKELY_ORIGINAL',
      index: true,
    },
    imageOriginPrediction: {
      type: String,
      enum: ['camera_captured', 'web_downloaded', 'ai_generated', 'duplicate', 'unknown'],
      default: 'camera_captured',
      index: true,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    confidenceLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    reasons: {
      type: [String],
      default: [],
    },

    // Legacy compatibility with previous pHash queries
    result: {
      type: String,
      enum: ['no_match', 'possible_duplicate', 'likely_duplicate', 'suspicious'],
      default: 'no_match',
      index: true,
    },
    analysisStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
      index: true,
    },
    failureReason: {
      type: String,
      default: '',
    },
    modelName: {
      type: String,
      default: 'MultiSignal-Forensics-v2.1',
    },
    modelVersion: {
      type: String,
      default: 'BuildExchange-v2.1',
    },
    checkedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },

    // Admin Review Lifecycle
    reviewStatus: {
      type: String,
      enum: ['not_reviewed', 'reviewed', 'dismissed', 'confirmed'],
      default: 'not_reviewed',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
      maxlength: [1000, 'Review notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient admin querying and dashboard filtering
imageAnalysisSchema.index({ verificationStatus: 1, reviewStatus: 1, createdAt: -1 });
imageAnalysisSchema.index({ result: 1, reviewStatus: 1, createdAt: -1 });
imageAnalysisSchema.index({ materialId: 1, createdAt: -1 });

module.exports = mongoose.model('ImageAnalysis', imageAnalysisSchema);
