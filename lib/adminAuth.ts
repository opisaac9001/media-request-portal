import type { NextApiRequest } from 'next';
import fs from 'fs';
import path from 'path';

interface AdminSession {
  sessionId: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

const ADMIN_SESSIONS_FILE = path.join(process.cwd(), 'data', 'admin-sessions.json');

function readAdminSessions(): AdminSession[] {
  if (!fs.existsSync(ADMIN_SESSIONS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(ADMIN_SESSIONS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : (parsed.sessions || []);
  } catch (error) {
    console.error('Error reading admin sessions:', error);
    return [];
  }
}

export function isAdminAuthenticated(req: NextApiRequest): boolean {
  const cookies = req.cookies;
  const sessionId = cookies.admin_session;
  
  console.log('=== Admin Auth Check ===');
  console.log('Cookies received:', cookies);
  console.log('Session ID from cookie:', sessionId);
  
  if (!sessionId) {
    console.log('❌ No admin_session cookie found');
    return false;
  }
  
  const sessions = readAdminSessions();
  console.log('Total sessions in storage:', sessions.length);
  
  const session = sessions.find(s => s.sessionId === sessionId);
  
  if (!session) {
    console.log('❌ Admin session not found in storage');
    return false;
  }
  
  console.log('Session found. Expires at:', new Date(session.expiresAt).toISOString());
  console.log('Current time:', new Date().toISOString());
  
  if (session.expiresAt < Date.now()) {
    console.log('❌ Admin session expired');
    return false;
  }
  
  console.log('✅ Valid admin session for:', session.username);
  console.log('========================');
  return true;
}
