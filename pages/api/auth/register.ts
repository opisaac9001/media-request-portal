import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { checkRateLimit, recordFailedAttempt } from '../admin/rate-limits';

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: number;
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

function getUsers(): User[] {
  ensureDataDir();
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data).users || [];
}

function saveUsers(users: User[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const INVITE_CODES_FILE = path.join(process.cwd(), 'data', 'invite-codes.json');

interface InviteCode {
  code: string;
  createdAt: number;
  createdBy: string;
  usedBy?: string;
  usedAt?: number;
  usedFor?: 'plex' | 'registration';
  isActive: boolean;
}

function getInviteCodes(): InviteCode[] {
  if (!fs.existsSync(INVITE_CODES_FILE)) {
    return [];
  }
  const data = fs.readFileSync(INVITE_CODES_FILE, 'utf-8');
  return JSON.parse(data).codes || [];
}

function saveInviteCodes(codes: InviteCode[]) {
  fs.writeFileSync(INVITE_CODES_FILE, JSON.stringify({ codes }, null, 2));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check rate limit before processing
  if (!checkRateLimit(req, res)) {
    return; // Response already sent by checkRateLimit
  }

  const { invite_code, username, email, password } = req.body;

  // Validate required fields
  if (!invite_code || !username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Invite code, username, email, and password are required.',
    });
  }

  // Validate invite code
  const inviteCodes = getInviteCodes();
  const inviteCodeIndex = inviteCodes.findIndex(
    (c) => c.code.toUpperCase() === invite_code.toUpperCase() && c.isActive && !c.usedBy
  );

  if (inviteCodeIndex === -1) {
    recordFailedAttempt(req);
    console.log(`Failed registration attempt with invalid invite code: ${invite_code}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid or already used invite code.',
    });
  }

  // Validate username format
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return res.status(400).json({
      success: false,
      message: 'Username can only contain letters, numbers, underscores, and hyphens.',
    });
  }

  // Validate username length
  if (username.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Username must be at least 3 characters long.',
    });
  }

  // Validate password requirements
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long.',
    });
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&).',
    });
  }

  try {
    const users = getUsers();

    // Check if username already exists
    if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists.',
      });
    }

    // Check if email already exists
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // Create new user
    const newUser: User = {
      id: crypto.randomBytes(16).toString('hex'),
      username,
      email,
      password: hashPassword(password),
      createdAt: Date.now(),
    };

    users.push(newUser);
    saveUsers(users);

    // Mark invite code as used for registration
    inviteCodes[inviteCodeIndex].usedBy = username;
    inviteCodes[inviteCodeIndex].usedAt = Date.now();
    inviteCodes[inviteCodeIndex].usedFor = 'registration';
    saveInviteCodes(inviteCodes);

    console.log(`New user registered: ${username} (${email}) using invite code: ${invite_code}`);

    return res.status(200).json({
      success: true,
      message: 'Account created successfully!',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.',
    });
  }
}
