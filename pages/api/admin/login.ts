import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from './rate-limits';

interface AdminSession {
  sessionId: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

const ADMIN_SESSIONS_FILE = path.join(process.cwd(), 'data', 'admin-sessions.json');

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readAdminSessions(): AdminSession[] {
  ensureDataDir();
  if (!fs.existsSync(ADMIN_SESSIONS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(ADMIN_SESSIONS_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed : (parsed.sessions || []);
}

function writeAdminSessions(sessions: AdminSession[]) {
  ensureDataDir();
  fs.writeFileSync(ADMIN_SESSIONS_FILE, JSON.stringify({ sessions }, null, 2));
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

  // Get admin credentials from environment variables
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Simple authentication check
  if (username === adminUsername && password === adminPassword) {
    // Reset rate limit on successful login
    resetRateLimit(req);
    
    // Generate a session token
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours
    
    // Store session
    const sessions = readAdminSessions();
    // Remove old expired sessions
    const activeSessions = sessions.filter(s => s.expiresAt > now);
    
    const newSession: AdminSession = {
      sessionId,
      username,
      createdAt: now,
      expiresAt,
    };
    
    activeSessions.push(newSession);
    writeAdminSessions(activeSessions);
    
    // Set cookie with session token
    const cookie = serialize('admin_session', sessionId, {
      httpOnly: true,
      secure: false, // Set to false to work with HTTP
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    console.log('Admin login successful for:', username);

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
