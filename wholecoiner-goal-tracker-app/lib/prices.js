import { convertUsdToInr } from './fx.js';

// Mock USDC prices (Jupiter will return these tomorrow)
const MOCK_PRICES_USDC = {
  BTC: 60000,  // $60k per BTC
  ETH: 3000,   // $3k per ETH
  SOL: 145     // $145 per SOL
};

const TOKENS = {
  BTC: { 
    symbol: 'BTC', 
    mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
    decimals: 8,
    maxTarget: 10
  },
  ETH: { 
    symbol: 'ETH', 
    mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    decimals: 8,
    maxTarget: 100
  },
  SOL: { 
    symbol: 'SOL', 
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    maxTarget: 10000
  }
};

// Cache layer
const priceCache = new Map(); // { cacheKey: { prices, fetchedAt } }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get multiple prices with caching
 * @param {string[]} coinSymbols - Array of coin symbols (e.g., ['BTC', 'ETH'])
 * @returns {Promise<{prices: Object, fetchedAt: string, stale: boolean}>}
 */
export async function getPricesInINR(coinSymbols) {
  // Normalize and dedupe
  const normalized = [...new Set(coinSymbols.map(c => c.toUpperCase()))];
  
  // Validate all coins
  for (const coin of normalized) {
    if (!isValidCoin(coin)) {
      throw new Error(`Unknown token: ${coin}`);
    }
  }
  
  const cacheKey = normalized.sort().join(',');
  const now = Date.now();
  
  // Check cache
  const cached = priceCache.get(cacheKey);
  if (cached && (now - cached.fetchedAt < CACHE_TTL_MS)) {
    return {
      prices: cached.prices,
      fetchedAt: new Date(cached.fetchedAt).toISOString(),
      stale: false
    };
  }
  
  // Fetch fresh prices
  try {
    const prices = {};
    for (const coin of normalized) {
      prices[coin] = await getPriceInINR(coin);
    }
    
    const fetchedAt = now;
    priceCache.set(cacheKey, { prices, fetchedAt });
    
    return {
      prices,
      fetchedAt: new Date(fetchedAt).toISOString(),
      stale: false
    };
  } catch (error) {
    // Fallback to stale cache if available
    if (cached) {
      return {
        prices: cached.prices,
        fetchedAt: new Date(cached.fetchedAt).toISOString(),
        stale: true
      };
    }
    throw error;
  }
}

/**
 * Get price in INR (Jupiter-compatible interface)
 * Today: Mock USDC price × FX rate
 * Tomorrow: Jupiter quote → USDC → FX
 */
export async function getPriceInINR(coinSymbol) {
  const normalized = coinSymbol.toUpperCase();
  
  if (!TOKENS[normalized]) {
    throw new Error(`Unknown token: ${coinSymbol}`);
  }
  
  const priceUSD = MOCK_PRICES_USDC[normalized];
  const priceINR = await convertUsdToInr(priceUSD);
  
  return priceINR;
}

/**
 * Get token metadata
 */
export function getTokenInfo(coinSymbol) {
  const normalized = coinSymbol.toUpperCase();
  return TOKENS[normalized];
}

/**
 * Validate coin symbol
 */
export function isValidCoin(coinSymbol) {
  const normalized = coinSymbol.toUpperCase();
  return normalized in TOKENS;
}

/**
 * Get all supported tokens
 */
export function getSupportedTokens() {
  return Object.values(TOKENS);
}
