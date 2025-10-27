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
