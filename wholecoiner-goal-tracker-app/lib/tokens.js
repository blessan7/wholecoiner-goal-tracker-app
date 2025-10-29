/**
 * Token mint address mappings for devnet
 * Only SOL and USDC are supported for MVP
 */

// Devnet token mints
export const TOKEN_MINTS = {
  SOL: {
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    symbol: 'SOL'
  },
  USDC: {
    mint: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
    decimals: 6,
    symbol: 'USDC'
  }
};

/**
 * Get token mint info for a coin symbol
 * @param {string} coinSymbol - BTC, ETH, SOL, or USDC
 * @returns {Object} { mint, decimals, symbol }
 */
export function getTokenMint(coinSymbol) {
  const normalized = coinSymbol.toUpperCase();
  
  // For SOL goals, use SOL mint
  if (normalized === 'SOL') {
    return TOKEN_MINTS.SOL;
  }
  
  // For BTC/ETH goals, we'll use USDC on devnet (since wrapped BTC/ETH aren't reliably liquid)
  // In production, map to actual wrapped tokens
  if (normalized === 'BTC' || normalized === 'ETH') {
    // For MVP, use USDC as proxy (devnet limitation)
    return TOKEN_MINTS.USDC;
  }
  
  if (normalized === 'USDC') {
    return TOKEN_MINTS.USDC;
  }
  
  throw new Error(`Unsupported coin symbol: ${coinSymbol}`);
}

/**
 * Check if coin symbol is supported for swaps
 */
export function isSupportedSwapCoin(coinSymbol) {
  const normalized = coinSymbol.toUpperCase();
  return normalized === 'SOL' || normalized === 'USDC' || normalized === 'BTC' || normalized === 'ETH';
}

/**
 * Convert human-readable amount to smallest units (lamports for SOL, decimals for tokens)
 */
export function toSmallestUnits(amount, decimals) {
  return Math.floor(amount * Math.pow(10, decimals));
}

/**
 * Convert smallest units to human-readable amount
 */
export function fromSmallestUnits(amount, decimals) {
  return amount / Math.pow(10, decimals);
}



