import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import crypto from 'crypto';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from './rate-limits';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check rate limit before processing
  if (!checkRateLimit(req, res)) {
    return; // Response already sent by checkRateLimit
  }

  const { username, password } = req.body;

  // Get admin credentials from environment variables
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Simple authentication check
  if (username === adminUsername && password === adminPassword) {
    // Reset rate limit on successful login
    resetRateLimit(req);
    // Generate a simple session token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set cookie with session token
    const cookie = serialize('admin_session', token, {
      httpOnly: true,
      secure: false, // Set to false to work with HTTP (not just HTTPS)
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      domain: undefined, // Don't set domain to work with any hostname
    });
    
    // Also log for debugging
    console.log('Setting cookie for user:', username);

    res.setHeader('Set-Cookie', cookie);
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
    });
  } else {
    recordFailedAttempt(req);
    console.log(`Failed admin login attempt for user: ${username}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password',
    });
  }
}
