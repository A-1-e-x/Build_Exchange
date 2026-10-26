const sharp = require('sharp');

/**
 * 2D Discrete Cosine Transform (DCT-II) based Perceptual Hashing (pHash)
 * Zauner (2010) canonical implementation for image deduplication.
 */

const N = 32; // Standard DCT input matrix dimension (32x32)
const M = 8;  // Low frequency sub-matrix dimension (8x8 = 64 bits)

// Precompute cosine coefficient lookup table for fast 1D DCT execution
const cosTable = new Float64Array(N * N);
for (let k = 0; k < N; k++) {
  for (let n = 0; n < N; n++) {
    cosTable[k * N + n] = Math.cos(((2 * n + 1) * k * Math.PI) / (2 * N));
  }
}

/**
 * Perform 1D DCT on a 32-element row
 */
function dct1D(input, offset, stride, output, outOffset, outStride) {
  const sqrt1_N = Math.sqrt(1 / N);
  const sqrt2_N = Math.sqrt(2 / N);

  for (let k = 0; k < N; k++) {
    let sum = 0;
    const tableOffset = k * N;
    for (let n = 0; n < N; n++) {
      sum += input[offset + n * stride] * cosTable[tableOffset + n];
    }
    const alpha = k === 0 ? sqrt1_N : sqrt2_N;
    output[outOffset + k * outStride] = alpha * sum;
  }
}

/**
 * Compute 2D DCT on a 32x32 matrix using separable 1D row-column decomposition
 */
function compute2DDCT(matrix) {
  const temp = new Float64Array(N * N);
  const dctResult = new Float64Array(N * N);

  // 1. Row-wise 1D DCT
  for (let row = 0; row < N; row++) {
    dct1D(matrix, row * N, 1, temp, row * N, 1);
  }

  // 2. Column-wise 1D DCT on intermediate matrix
  for (let col = 0; col < N; col++) {
    dct1D(temp, col, N, dctResult, col, N);
  }

  return dctResult;
}

/**
 * Generates a 64-bit hexadecimal Perceptual Hash (pHash) from an image buffer
 * @param {Buffer} imageBuffer - Raw image buffer (JPEG, PNG, WEBP, etc.)
 * @returns {Promise<string>} 16-character hexadecimal hash string
 */
async function generatePHash(imageBuffer) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    throw new Error('Valid image buffer is required to generate perceptual hash');
  }

  // 1. Resize to 32x32 grayscale image and get raw luminance byte values
  const rawPixelData = await sharp(imageBuffer)
    .resize(N, N, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();

  const floatMatrix = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) {
    floatMatrix[i] = rawPixelData[i];
  }

  // 2. Compute 2D DCT
  const dct = compute2DDCT(floatMatrix);

  // 3. Extract top-left 8x8 low-frequency coefficients (excluding DC term at [0,0])
  const lowFreq = [];
  for (let u = 0; u < M; u++) {
    for (let v = 0; v < M; v++) {
      // Exclude DC component (0,0) from median calculation
      if (u !== 0 || v !== 0) {
        lowFreq.push(dct[u * N + v]);
      }
    }
  }

  // 4. Calculate median value of the AC coefficients
  const sorted = [...lowFreq].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  // 5. Construct 64-bit binary representation (1 if coeff > median, else 0)
  let binaryString = '';
  for (let u = 0; u < M; u++) {
    for (let v = 0; v < M; v++) {
      const val = dct[u * N + v];
      binaryString += val > median ? '1' : '0';
    }
  }

  // 6. Convert 64-bit binary string into 16-char hexadecimal string
  let hexHash = '';
  for (let i = 0; i < 64; i += 4) {
    const nibble = binaryString.substring(i, i + 4);
    hexHash += parseInt(nibble, 2).toString(16);
  }

  return hexHash.padStart(16, '0');
}

/**
 * Calculates the Hamming distance between two 16-character hexadecimal pHashes
 * @param {string} hash1
 * @param {string} hash2
 * @returns {number} Hamming distance (0 to 64)
 */
function calculateHammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== 16 || hash2.length !== 16) {
    throw new Error('Both hashes must be 16-character hexadecimal strings');
  }

  const b1 = BigInt('0x' + hash1);
  const b2 = BigInt('0x' + hash2);
  const xor = b1 ^ b2;

  // Count set bits (popcount)
  const binaryXor = xor.toString(2);
  let distance = 0;
  for (let i = 0; i < binaryXor.length; i++) {
    if (binaryXor[i] === '1') distance++;
  }

  return distance;
}

/**
 * Computes a normalized similarity percentage from Hamming distance
 * @param {number} distance
 * @returns {number} 0 to 100 percentage
 */
function calculateSimilarityScore(distance) {
  if (distance < 0) return 0;
  if (distance > 64) return 0;
  return Math.round(((64 - distance) / 64) * 1000) / 10;
}

/**
 * Classifies match result based on configurable thresholds
 * @param {number} distance
 * @param {object} customThresholds - { exact, likely, possible }
 * @returns {string} 'no_match' | 'possible_duplicate' | 'likely_duplicate'
 */
function classifyHammingResult(distance, customThresholds = {}) {
  const exactThreshold = customThresholds.exact ?? Number(process.env.PHASH_EXACT_THRESHOLD || 0);
  const likelyThreshold = customThresholds.likely ?? Number(process.env.PHASH_LIKELY_THRESHOLD || 5);
  const possibleThreshold = customThresholds.possible ?? Number(process.env.PHASH_POSSIBLE_THRESHOLD || 10);

  if (distance <= likelyThreshold) {
    return 'likely_duplicate';
  } else if (distance <= possibleThreshold) {
    return 'possible_duplicate';
  } else {
    return 'no_match';
  }
}

module.exports = {
  generatePHash,
  calculateHammingDistance,
  calculateSimilarityScore,
  classifyHammingResult,
};
