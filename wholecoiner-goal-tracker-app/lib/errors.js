/**
 * Unified error format for the application
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class GoalValidationError extends AppError {
  constructor(message, code) {
    super(message, 422, code); // 422 Unprocessable Entity
    this.name = 'GoalValidationError';
  }
}

export const GoalErrors = {
  INVALID_COIN: (coin) => new GoalValidationError(
    `Invalid coin: ${coin}. Supported: BTC, ETH, SOL`, 
    'INVALID_COIN'
  ),
  INVALID_AMOUNT: (field, min, max) => new GoalValidationError(
    `${field} must be between ${min} and ${max}`, 
    'INVALID_AMOUNT'
  ),
  INVALID_FREQUENCY: (freq) => new GoalValidationError(
    `Invalid frequency: ${freq}. Must be DAILY, WEEKLY, or MONTHLY`, 
    'INVALID_FREQUENCY'
  ),
  GOAL_DURATION_TOO_LONG: (months) => new GoalValidationError(
    `Goal would take ${Math.ceil(months)} months (max 120 months / 10 years)`, 
    'GOAL_DURATION_TOO_LONG'
  ),
  GOAL_NOT_FOUND: () => new NotFoundError('Goal not found'),
  GOAL_NOT_OWNED: () => new AuthorizationError('You do not own this goal'),
  INVALID_STATUS_TRANSITION: (from, to) => new GoalValidationError(
    `Cannot transition from ${from} to ${to}`, 
    'INVALID_STATUS_TRANSITION'
  ),
  GOAL_ALREADY_COMPLETED: () => new GoalValidationError(
    'Cannot modify completed goal',
    'GOAL_ALREADY_COMPLETED'
  )
};

/**
 * Format error response
 */
export function formatErrorResponse(error, requestId = null) {
  const isAppError = error instanceof AppError;

  return {
    error: {
      message: error.message || 'An unexpected error occurred',
      code: isAppError ? error.code : 'INTERNAL_ERROR',
      statusCode: isAppError ? error.statusCode : 500,
      ...(requestId && { requestId }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  };
}

