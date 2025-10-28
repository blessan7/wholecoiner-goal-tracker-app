import { requireAuth, ensureTwoFa } from '@/lib/auth';
import { getPricesInINR } from '@/lib/prices';
import { logger } from '@/lib/logger';

/**
 * GET /api/price/current?coins=BTC,ETH,SOL
 * Returns current prices in INR with caching
 */
export async function GET(request) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  
  try {
    const { user, sess } = await requireAuth();
    ensureTwoFa(sess, user);
    
    const { searchParams } = new URL(request.url);
    const coinsParam = searchParams.get('coins');
    
    if (!coinsParam) {
      return Response.json({
        success: false,
        error: {
          code: 'MISSING_COINS',
          message: 'Query parameter "coins" is required (e.g., ?coins=BTC,ETH,SOL)'
        }
      }, { status: 400 });
    }
    
    const coinSymbols = coinsParam.split(',').map(c => c.trim()).filter(Boolean);
    
    if (coinSymbols.length === 0) {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_COINS',
          message: 'At least one coin symbol required'
        }
      }, { status: 400 });
    }
    
    logger.info('Fetching current prices', { coins: coinSymbols, userId: user.id, requestId });
    
    const { prices, fetchedAt, stale } = await getPricesInINR(coinSymbols);
    
    logger.info('Prices fetched', { coins: coinSymbols, stale, requestId });
    
    return Response.json({
      success: true,
      prices,
      fetchedAt,
      stale
    }, { status: 200 });
    
  } catch (error) {
    logger.error('Price fetch failed', { error: error.message, requestId });
    
    if (error.message.includes('Unknown token')) {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_COIN',
          message: error.message
        }
      }, { status: 422 });
    }
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch prices'
      }
    }, { status: 500 });
  }
}
