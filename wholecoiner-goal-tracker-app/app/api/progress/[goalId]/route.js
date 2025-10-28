import { requireAuth, ensureTwoFa } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { calculateProgress, calculateEstimatedCompletion } from '@/lib/goalValidation';
import { getPriceInINR } from '@/lib/prices';
import { GoalErrors } from '@/lib/errors';

/**
 * GET /api/progress/:goalId
 * Returns detailed progress metrics for a goal
 */
export async function GET(request, { params }) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const goalId = params.goalId;
  
  try {
    const { user, sess } = await requireAuth();
    ensureTwoFa(sess, user);
    
    logger.info('Fetching goal progress', { goalId, userId: user.id, requestId });
    
    // Fetch goal with ownership check
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: user.id
      }
    });
    
    if (!goal) {
      throw GoalErrors.GOAL_NOT_FOUND();
    }
    
    // Get current price for this coin
    const currentPriceInr = await getPriceInINR(goal.coin);
    
    // Calculate progress metrics
    const progressPercentage = calculateProgress(goal.investedAmount, goal.targetAmount);
    
    // Calculate INR totals
    const totalInvestedINR = goal.investedAmount * currentPriceInr;
    const targetValueINR = goal.targetAmount * currentPriceInr;
    const currentValueINR = goal.investedAmount * currentPriceInr;
    
    // For now, profit/loss is 0 since we haven't tracked purchase prices yet
    // Tomorrow when swaps are implemented, this will use actual transaction data
    const profitLossINR = 0;
    const profitLossPercentage = 0;
    
    // Calculate remaining and ETA
    const remainingAmount = Math.max(0, goal.targetAmount - goal.investedAmount);
    let estimatedCompletion = null;
    
    if (remainingAmount > 0 && goal.status === 'ACTIVE') {
      try {
        const eta = await calculateEstimatedCompletion(
          goal.coin,
          remainingAmount,
          goal.amountInr,
          goal.frequency
        );
        estimatedCompletion = {
          estimatedCompletionDate: eta.estimatedCompletionDate,
          monthsToComplete: eta.monthsToComplete,
          intervalsNeeded: eta.intervalsNeeded
        };
      } catch (error) {
        // If ETA > 10y, just omit it
        if (error.code === 'GOAL_DURATION_TOO_LONG') {
          logger.warn('ETA exceeds 10 years', { goalId, requestId });
          estimatedCompletion = {
            error: 'ETA exceeds maximum 10 years',
            monthsToComplete: null,
            estimatedCompletionDate: null
          };
        } else {
          throw error;
        }
      }
    }
    
    // Next investment date (simple calculation based on frequency)
    let nextInvestmentDate = null;
    if (goal.status === 'ACTIVE') {
      const now = new Date();
      const next = new Date(now);
      
      switch (goal.frequency) {
        case 'DAILY':
          next.setDate(next.getDate() + 1);
          break;
        case 'WEEKLY':
          next.setDate(next.getDate() + 7);
          break;
        case 'MONTHLY':
          next.setMonth(next.getMonth() + 1);
          break;
      }
      
      nextInvestmentDate = next.toISOString();
    }
    
    logger.info('Progress computed', { goalId, progressPercentage, requestId });
    
    return Response.json({
      success: true,
      goalId: goal.id,
      coin: goal.coin,
      targetAmount: goal.targetAmount,
      investedAmount: goal.investedAmount,
      progressPercentage,
      currentPriceInr,
      totalInvestedINR: Math.round(totalInvestedINR * 100) / 100,
      targetValueINR: Math.round(targetValueINR * 100) / 100,
      currentValueINR: Math.round(currentValueINR * 100) / 100,
      profitLossINR,
      profitLossPercentage,
      remainingAmount,
      estimatedCompletion,
      nextInvestmentDate,
      status: goal.status,
      frequency: goal.frequency,
      amountInr: goal.amountInr,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString()
    }, { status: 200 });
    
  } catch (error) {
    logger.error('Progress fetch failed', { goalId, error: error.message, requestId });
    
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
        message: 'Failed to compute progress'
      }
    }, { status: 500 });
  }
}
