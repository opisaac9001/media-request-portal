import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../admin/rate-limits';

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: number;
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

function getUsers(): User[] {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data).users || [];
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check rate limit before processing
  if (!checkRateLimit(req, res)) {
    return; // Response already sent by checkRateLimit
  }

  const { username, password } = req.body;

  if (!username || !password) {
    recordFailedAttempt(req);
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.',
    });
  }

  try {
    const users = getUsers();
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

    if (!user || user.password !== hashPassword(password)) {
      recordFailedAttempt(req);
      console.log(`Failed login attempt for user: ${username}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Set cookie
    res.setHeader('Set-Cookie', `user_session=${sessionToken}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`);

    // Store session mapping (in production, use Redis or database)
    // For now, we'll use a simple file-based session store
    const sessionFile = path.join(process.cwd(), 'data', 'sessions.json');
    let sessions: { [key: string]: { userId: string; username: string } } = {};
    
    if (fs.existsSync(sessionFile)) {
      sessions = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    }
    
    sessions[sessionToken] = {
      userId: user.id,
      username: user.username,
    };
    
    fs.writeFileSync(sessionFile, JSON.stringify(sessions, null, 2));

    // Reset rate limit on successful login
    resetRateLimit(req);
    
    console.log(`User logged in: ${username}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      user: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
}
