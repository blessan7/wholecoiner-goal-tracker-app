import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'app_session';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me_in_production';

/**
 * Set session cookie with JWT token
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {boolean} params.twoFaVerified - Whether 2FA is verified
 */
export function setSession({ userId, twoFaVerified }) {
  const token = jwt.sign(
    { 
      sub: userId, 
      twoFaVerified: !!twoFaVerified 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

/**
 * Clear session cookie
 */
export function clearSession() {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Get and verify session from cookie
 * @returns {Object|null} Session data or null if invalid
 */
export function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

