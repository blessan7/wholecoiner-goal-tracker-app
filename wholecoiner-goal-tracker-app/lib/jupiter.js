/**
 * Jupiter API v6 client wrapper
 */

import { logger } from './logger.js';
import { AppError } from './errors.js';

const JUPITER_API_BASE = process.env.JUPITER_API_URL || 'https://public.jupiterapi.com';
const JUPITER_QUOTE_API = `${JUPITER_API_BASE}/quote/v1`;
const JUPITER_SWAP_API = `${JUPITER_API_BASE}/swap/v1`;
const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%

/**
 * Get swap quote from Jupiter API
 * @param {string} inputMint - Input token mint address
 * @param {string} outputMint - Output token mint address  
 * @param {string|number} amount - Amount in smallest units (lamports for SOL, decimals for tokens)
 * @param {number} slippageBps - Slippage in basis points (default 50 = 0.5%)
 * @returns {Promise<Object>} Jupiter quote response
 */
export async function getSwapQuote(inputMint, outputMint, amount, slippageBps = DEFAULT_SLIPPAGE_BPS) {
  try {
    const url = new URL(`${JUPITER_QUOTE_API}/quote`);
    url.searchParams.set('inputMint', inputMint);
    url.searchParams.set('outputMint', outputMint);
    url.searchParams.set('amount', amount.toString());
    url.searchParams.set('slippageBps', slippageBps.toString());
    url.searchParams.set('onlyDirectRoutes', 'false');
    url.searchParams.set('asLegacyTransaction', 'false');

    logger.info('Fetching Jupiter quote', { inputMint, outputMint, amount, slippageBps });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Jupiter quote API error', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText 
      });
      
      if (response.status === 404) {
        throw new AppError('No swap route found for this token pair', 404, 'NO_ROUTE_FOUND');
      }
      
      throw new AppError(`Jupiter API error: ${response.statusText}`, response.status, 'JUPITER_API_ERROR');
    }

    const quote = await response.json();
    
    if (!quote || !quote.outAmount) {
      throw new AppError('Invalid quote response from Jupiter', 500, 'INVALID_QUOTE');
    }

    logger.info('Jupiter quote received', { 
      inAmount: quote.inAmount, 
      outAmount: quote.outAmount,
      priceImpactPct: quote.priceImpactPct 
    });

    return quote;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error('Failed to get Jupiter quote', { error: error.message });
    throw new AppError(`Failed to get swap quote: ${error.message}`, 500, 'QUOTE_FETCH_FAILED');
  }
}

/**
 * Get swap transaction from Jupiter API
 * @param {Object} quoteResponse - Quote response from getSwapQuote
 * @param {string} userPublicKey - User's wallet public key (base58)
 * @param {number} slippageBps - Slippage in basis points
 * @returns {Promise<Object>} Swap transaction response
 */
export async function getSwapTransaction(quoteResponse, userPublicKey, slippageBps = DEFAULT_SLIPPAGE_BPS) {
  try {
    const url = `${JUPITER_SWAP_API}`;
    
    const swapRequest = {
      quoteResponse,
      userPublicKey,
      slippageBps,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    };

    logger.info('Fetching Jupiter swap transaction', { userPublicKey, slippageBps });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Jupiter swap API error', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText 
      });
      
      if (response.status === 400) {
        throw new AppError('Invalid swap request', 400, 'INVALID_SWAP_REQUEST');
      }
      
      throw new AppError(`Jupiter swap API error: ${response.statusText}`, response.status, 'SWAP_API_ERROR');
    }

    const swapData = await response.json();
    
    if (!swapData || !swapData.swapTransaction) {
      throw new AppError('Invalid swap transaction response', 500, 'INVALID_SWAP_RESPONSE');
    }

    logger.info('Jupiter swap transaction received', { 
      hasSwapTransaction: !!swapData.swapTransaction,
      hasLastValidBlockHeight: !!swapData.lastValidBlockHeight 
    });

    return swapData;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error('Failed to get Jupiter swap transaction', { error: error.message });
    throw new AppError(`Failed to get swap transaction: ${error.message}`, 500, 'SWAP_TRANSACTION_FETCH_FAILED');
  }
}

/**
 * Submit signed transaction to Solana network
 * @param {string} signedTransaction - Base64 encoded signed transaction
 * @param {Connection} connection - Solana connection
 * @returns {Promise<string>} Transaction signature
 */
export async function submitSwapTransaction(signedTransaction, connection) {
  try {
    const txBuffer = Buffer.from(signedTransaction, 'base64');
    
    logger.info('Submitting swap transaction to Solana');

    const signature = await connection.sendRawTransaction(txBuffer, {
      skipPreflight: false,
      maxRetries: 3,
    });

    logger.info('Swap transaction submitted', { signature });

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      logger.error('Swap transaction failed', { signature, error: confirmation.value.err });
      throw new AppError(`Swap transaction failed: ${JSON.stringify(confirmation.value.err)}`, 500, 'SWAP_EXECUTION_FAILED');
    }

    logger.info('Swap transaction confirmed', { signature });
    return signature;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error('Failed to submit swap transaction', { error: error.message });
    throw new AppError(`Failed to submit swap transaction: ${error.message}`, 500, 'SWAP_SUBMIT_FAILED');
  }
}



