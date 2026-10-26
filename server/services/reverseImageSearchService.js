/**
 * Reverse Image Search Interface
 * Connects to legitimate reverse image search providers (e.g. SerpApi Google Lens,
 * Google Custom Search, or local evaluation test registry).
 */

// In-memory registry for reproducible evaluation and mock testing
const mockReverseSearchRegistry = new Map();

/**
 * Registers a mock URL / hash for evaluation benchmark testing
 * @param {string} hashOrUrl
 * @param {Array<object>} matches
 */
function registerMockExternalMatch(hashOrUrl, matches) {
  mockReverseSearchRegistry.set(hashOrUrl, matches);
}

/**
 * Searches for externally published source matches for an image buffer or public URL
 * @param {object} params
 * @param {Buffer} params.buffer
 * @param {string} [params.imageUrl]
 * @param {string} [params.sha256]
 * @returns {Promise<object>} { available: boolean, sourceMatches: Array<object>, provider: string }
 */
async function searchExternalSources({ buffer, imageUrl = '', sha256 = '' }) {
  // 1. Check evaluation mock registry first
  if (sha256 && mockReverseSearchRegistry.has(sha256)) {
    return {
      available: true,
      provider: 'Evaluation-Mock-Registry',
      sourceMatches: mockReverseSearchRegistry.get(sha256),
    };
  }

  if (imageUrl && mockReverseSearchRegistry.has(imageUrl)) {
    return {
      available: true,
      provider: 'Evaluation-Mock-Registry',
      sourceMatches: mockReverseSearchRegistry.get(imageUrl),
    };
  }

  // 2. Check if a production reverse search API key is configured
  const serpApiKey = process.env.SERPAPI_API_KEY || process.env.REVERSE_IMAGE_SEARCH_API_KEY;

  if (!serpApiKey) {
    return {
      available: false,
      provider: 'none',
      sourceMatches: [],
      message: 'Reverse image search provider not configured (REVERSE_IMAGE_SEARCH_API_KEY unset). Internal catalog deduplication active.',
    };
  }

  // 3. If SerpApi is configured and public URL is accessible
  if (serpApiKey && imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    try {
      const endpoint = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(imageUrl)}&api_key=${serpApiKey}`;
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        const data = await response.json();
        const visualMatches = data.visual_matches || [];
        const matches = visualMatches.slice(0, 3).map((item) => ({
          title: item.title || 'Web Image Match',
          link: item.link || item.source || '',
          source: item.source || 'External Web Source',
          thumbnail: item.thumbnail || '',
          similarityScore: item.rating ? Number(item.rating) * 20 : 85,
        }));

        return {
          available: true,
          provider: 'SerpApi-Google-Lens',
          sourceMatches: matches,
        };
      }
    } catch (err) {
      console.warn('[Reverse Search Warning]: Provider request failed or timed out:', err.message);
    }
  }

  return {
    available: false,
    provider: 'unreachable',
    sourceMatches: [],
    message: 'No external matches found or provider unavailable.',
  };
}

module.exports = {
  searchExternalSources,
  registerMockExternalMatch,
};
