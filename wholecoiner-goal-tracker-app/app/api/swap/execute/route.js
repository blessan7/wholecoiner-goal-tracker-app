/**
 * POST /api/swap/execute
 * Execute Jupiter swap: get quote and unsigned transaction, or submit signed transaction
 */

import { requireAuth, ensureTwoFa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getSwapQuote, getSwapTransaction, submitSwapTransaction } from '@/lib/jupiter';
import { getSolanaConnection, isValidSolanaAddress } from '@/lib/solana';
import { getTokenMint, toSmallestUnits, fromSmallestUnits } from '@/lib/tokens';
import { SwapErrors, AuthenticationError, AuthorizationError, ValidationError } from '@/lib/errors';
import { ensureIdempotency } from '@/lib/idempotency';
import { calculateProgress, shouldAutoComplete } from '@/lib/goalValidation';

const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%

export async function POST(request) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  let user = null;
  
  try {
    const { user: authUser, sess } = await requireAuth();
    user = authUser;
    ensureTwoFa(sess, user);
    
    const body = await request.json();
    const { 
      goalId, 
      batchId, 
      inputMint, // 'SOL' or 'USDC'
      outputMint, // Goal token: 'BTC', 'ETH', 'SOL'
      slippageBps,
      signedTransaction, // Optional: if provided, submit instead of getting quote
    } = body;
    
    // Validate inputs
    if (!goalId) {
      throw new ValidationError('goalId is required');
    }
    
    if (!batchId) {
      throw new ValidationError('batchId is required');
    }
    
    // If signedTransaction provided, submit it
    if (signedTransaction) {
      return await handleSignedTransaction({
        goalId,
        batchId,
        signedTransaction,
        userId: user.id,
        requestId,
      });
    }
    
    // Otherwise, get quote and return unsigned transaction
    if (!inputMint || !outputMint) {
      throw new ValidationError('inputMint and outputMint are required when not submitting signed transaction');
    }
    
    const finalSlippageBps = slippageBps || DEFAULT_SLIPPAGE_BPS;
    
    logger.info('Swap execution request', { 
      userId: user.id, 
      goalId, 
      batchId, 
      inputMint,
      outputMint,
      slippageBps: finalSlippageBps,
      requestId 
    });
    
    // Check idempotency
    const existing = await ensureIdempotency(batchId, 'SWAP', async () => null);
    
    if (existing) {
      logger.info('Swap transaction already exists', { 
        transactionId: existing.id, 
        batchId,
        requestId 
      });
      
      return Response.json({
        success: true,
        batchId,
        transaction: {
          id: existing.id,
          type: existing.type,
          txnHash: existing.txnHash,
          amountCrypto: existing.amountCrypto,
          tokenMint: existing.tokenMint,
          network: existing.network,
        },
        explorerUrl: existing.txnHash 
          ? `https://explorer.solana.com/tx/${existing.txnHash}?cluster=devnet`
          : null,
      }, { status: 200 });
    }
    
    // Validate goal
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: user.id,
      },
    });
    
    if (!goal) {
      throw SwapErrors.INVALID_WALLET();
    }
    
    if (goal.status !== 'ACTIVE') {
      throw new ValidationError('Goal must be ACTIVE to execute swap');
    }
    
    // Validate user wallet address
    if (!user.walletAddress || !isValidSolanaAddress(user.walletAddress)) {
      throw SwapErrors.INVALID_WALLET();
    }
    
    // Get ONRAMP transaction for this batchId
    const onrampTransaction = await prisma.transaction.findFirst({
      where: {
        batchId,
        type: 'ONRAMP',
      },
    });
    
    if (!onrampTransaction) {
      throw new ValidationError('ONRAMP transaction not found for this batchId. Please simulate onramp first.');
    }
    
    // Get token mint addresses
    const inputTokenInfo = getTokenMint(inputMint);
    const outputTokenInfo = getTokenMint(outputMint);
    
    // Determine swap amount (use amount from ONRAMP transaction)
    const swapAmount = onrampTransaction.amountCrypto; // SOL amount from onramp
    const swapAmountInSmallestUnits = toSmallestUnits(swapAmount, inputTokenInfo.decimals);
    
    logger.info('Getting swap quote', { 
      inputMint: inputTokenInfo.mint,
      outputMint: outputTokenInfo.mint,
      amount: swapAmountInSmallestUnits,
      slippageBps: finalSlippageBps,
      requestId 
    });
    
    // Get quote from Jupiter
    const quote = await getSwapQuote(
      inputTokenInfo.mint,
      outputTokenInfo.mint,
      swapAmountInSmallestUnits.toString(),
      finalSlippageBps
    );
    
    // Get swap transaction (unsigned)
    const swapData = await getSwapTransaction(
      quote,
      user.walletAddress,
      finalSlippageBps
    );
    
    // Calculate output amount in human-readable format
    const outputAmount = fromSmallestUnits(quote.outAmount, outputTokenInfo.decimals);
    
    logger.info('Swap transaction prepared', { 
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      outputAmount,
      priceImpact: quote.priceImpactPct,
      requestId 
    });
    
    // Return unsigned transaction for client to sign
    return Response.json({
      success: true,
      batchId,
      quote: {
        inAmount: quote.inAmount,
        outAmount: quote.outAmount,
        outputAmount,
        inputMint: inputTokenInfo.mint,
        outputMint: outputTokenInfo.mint,
        priceImpactPct: quote.priceImpactPct,
        slippageBps: finalSlippageBps,
      },
      swapTransaction: swapData.swapTransaction,
      lastValidBlockHeight: swapData.lastValidBlockHeight,
      // Instructions for client:
      // 1. Sign swapTransaction with user's wallet
      // 2. POST back to this endpoint with signedTransaction field
    }, { status: 200 });
    
  } catch (error) {
    logger.error('Swap execution failed', { 
      error: error.message,
      errorName: error.name,
      userId: user?.id, 
      requestId 
    });
    
    // Check if it's an Authentication or Authorization error
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return Response.json({
        success: false,
        error: {
          code: error.code || 'AUTH_ERROR',
          message: error.message
        }
      }, { status: error.statusCode || 401 });
    }
    
    if (error.statusCode) {
      return Response.json({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      }, { status: error.statusCode });
    }
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to execute swap'
      }
    }, { status: 500 });
  }
}

/**
 * Handle signed transaction submission
 */
async function handleSignedTransaction({ goalId, batchId, signedTransaction, userId, requestId }) {
  logger.info('Submitting signed swap transaction', { goalId, batchId, requestId });
  
  // Check idempotency again
  const existing = await ensureIdempotency(batchId, 'SWAP', async () => null);
  if (existing) {
    return Response.json({
      success: true,
      batchId,
      transaction: {
        id: existing.id,
        type: existing.type,
        txnHash: existing.txnHash,
        amountCrypto: existing.amountCrypto,
        tokenMint: existing.tokenMint,
        network: existing.network,
      },
      explorerUrl: existing.txnHash 
        ? `https://explorer.solana.com/tx/${existing.txnHash}?cluster=devnet`
        : null,
    }, { status: 200 });
  }
  
  // Get goal and ONRAMP transaction
  const goal = await prisma.goal.findFirst({
    where: {
      id: goalId,
      userId: userId,
    },
  });
  
  if (!goal) {
    throw SwapErrors.INVALID_WALLET();
  }
  
  const onrampTransaction = await prisma.transaction.findFirst({
    where: {
      batchId,
      type: 'ONRAMP',
    },
  });
  
  if (!onrampTransaction) {
    throw new ValidationError('ONRAMP transaction not found for this batchId');
  }
  
  // Get output token info
  const outputTokenInfo = getTokenMint(goal.coin);
  
  // Submit transaction
  const connection = getSolanaConnection();
  const signature = await submitSwapTransaction(signedTransaction, connection);
  
  logger.info('Swap transaction submitted', { signature, requestId });
  
  // Get quote from meta or recalculate
  // For simplicity, we'll estimate output amount based on goal coin
  // In production, you'd want to store the quote or recalculate
  
  // Use atomic transaction to record swap and update goal
  const result = await prisma.$transaction(async (tx) => {
    // Record swap transaction
    const swapTxn = await tx.transaction.create({
      data: {
        goalId: goal.id,
        batchId,
        type: 'SWAP',
        provider: 'JUPITER',
        network: 'DEVNET',
        txnHash: signature,
        amountInr: onrampTransaction.amountInr,
        amountCrypto: null, // Will be calculated from on-chain result
        tokenMint: outputTokenInfo.mint,
        meta: {
          onrampTransactionId: onrampTransaction.id,
          inputMint: onrampTransaction.tokenMint,
          outputMint: outputTokenInfo.mint,
        },
      },
    });
    
    // Update goal invested amount (increment by swap output)
    // For MVP, we'll need to estimate - in production, parse transaction logs
    // For now, use a mock calculation based on price
    const estimatedOutputAmount = onrampTransaction.amountCrypto * 0.0001; // Mock conversion
    
    const updatedGoal = await tx.goal.update({
      where: { id: goal.id },
      data: {
        investedAmount: {
          increment: estimatedOutputAmount,
        },
      },
    });
    
    // Check if goal should auto-complete
    if (shouldAutoComplete(updatedGoal.investedAmount, updatedGoal.targetAmount)) {
      await tx.goal.update({
        where: { id: goal.id },
        data: { status: 'COMPLETED' },
      });
      updatedGoal.status = 'COMPLETED';
    }
    
    // Calculate progress
    const progress = calculateProgress(updatedGoal.investedAmount, updatedGoal.targetAmount);
    
    return {
      transaction: swapTxn,
      goal: updatedGoal,
      progress,
    };
  });
  
  logger.info('Swap transaction recorded and goal updated', { 
    transactionId: result.transaction.id,
    goalId: result.goal.id,
    progress: result.progress,
    requestId 
  });
  
  return Response.json({
    success: true,
    batchId,
    transaction: {
      id: result.transaction.id,
      type: result.transaction.type,
      txnHash: result.transaction.txnHash,
      amountCrypto: result.transaction.amountCrypto,
      tokenMint: result.transaction.tokenMint,
      network: result.transaction.network,
    },
    goal: {
      id: result.goal.id,
      investedAmount: result.goal.investedAmount,
      progressPercentage: result.progress,
      status: result.goal.status,
    },
    explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  }, { status: 201 });
}



