import { PrivyClient } from '@privy-io/server-auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { AuthenticationError } from '@/lib/errors';
import { setSession } from '@/lib/session';

// Initialize Privy client
const privyClient = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

/**
 * POST /api/auth/login
 * Create or retrieve user based on Privy authentication
 */
export async function POST(request) {
  const requestId = request.headers.get('x-request-id');

  try {
    // Get authorization token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        {
          error: {
            message: 'Authorization header required',
            code: 'AUTH_REQUIRED',
          },
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the Privy access token
    let verifiedClaims;
    try {
      verifiedClaims = await privyClient.verifyAuthToken(token);
    } catch (error) {
      logger.error('Token verification failed', { error: error.message, requestId });
      return Response.json(
        {
          error: {
            message: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
          },
        },
        { status: 401 }
      );
    }

    // Extract user data from request body
    const body = await request.json();
    const { privyId, email, walletAddress } = body;

    // Validate required fields
    if (!privyId || !email) {
      return Response.json(
        {
          error: {
            message: 'Missing required fields: privyId and email',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    // Verify the privyId matches the token
    if (verifiedClaims.userId !== privyId) {
      logger.warn('Privy ID mismatch', {
        tokenUserId: verifiedClaims.userId,
        bodyPrivyId: privyId,
        requestId,
      });
      return Response.json(
        {
          error: {
            message: 'Token user ID does not match provided Privy ID',
            code: 'INVALID_TOKEN',
          },
        },
        { status: 401 }
      );
    }

    // Create or update user in database using upsert
    // This ensures we don't create duplicate users
    const user = await prisma.user.upsert({
      where: { privyId },
      update: {
        email,
        walletAddress: walletAddress || undefined,
        updatedAt: new Date(),
      },
      create: {
        privyId,
        email,
        walletAddress: walletAddress || null,
      },
    });

    logger.info('User authenticated successfully', {
      userId: user.id,
      privyId: user.privyId,
      isNewUser: user.createdAt.getTime() === user.updatedAt.getTime(),
      requestId,
    });

    // Set session cookie (2FA not verified yet on login)
    setSession({ userId: user.id, twoFaVerified: false });

    // Return user data (excluding sensitive fields)
    return Response.json(
      {
        success: true,
        user: {
          id: user.id,
          privyId: user.privyId,
          email: user.email,
          walletAddress: user.walletAddress,
          twoFaEnabled: user.twoFaEnabled,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      stack: error.stack,
      requestId,
    });

    // Handle Prisma unique constraint violations
    if (error.code === 'P2002') {
      return Response.json(
        {
          error: {
            message: 'User with this email or Privy ID already exists',
            code: 'DUPLICATE_USER',
          },
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

