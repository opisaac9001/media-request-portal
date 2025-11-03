import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface AudiobookShelfResponse {
  success: boolean;
  message: string;
  credentials?: {
    username: string;
    password: string;
  };
}

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: number;
  isAdmin?: boolean;
}

interface InviteCode {
  code: string;
  createdAt: number;
  createdBy: string;
  usedBy?: string;
  usedAt?: number;
  usedFor?: 'plex' | 'registration' | 'audiobooks';
  isActive: boolean;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const INVITE_CODES_FILE = path.join(DATA_DIR, 'invite-codes.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readUsers(): User[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed : (parsed.users || []);
}

function writeUsers(users: User[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
}

function readInviteCodes(): InviteCode[] {
  ensureDataDir();
  if (!fs.existsSync(INVITE_CODES_FILE)) {
    return [];
  }
  const data = fs.readFileSync(INVITE_CODES_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed : (parsed.codes || []);
}

function writeInviteCodes(codes: InviteCode[]) {
  ensureDataDir();
  fs.writeFileSync(INVITE_CODES_FILE, JSON.stringify({ codes }, null, 2));
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createAudiobookShelfUser(username: string, password: string): Promise<AudiobookShelfResponse> {
  try {
    const audiobookshelfUrl = process.env.AUDIOBOOKSHELF_BASE_URL;
    const audiobookshelfToken = process.env.AUDIOBOOKSHELF_API_TOKEN;

    if (!audiobookshelfUrl || !audiobookshelfToken) {
      return {
        success: false,
        message: 'AudiobookShelf configuration is missing. Please contact the administrator.',
      };
    }

    // Create user via AudiobookShelf API
    const createUserResponse = await fetch(`${audiobookshelfUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${audiobookshelfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
        type: 'user',
        isActive: true,
        permissions: {
          download: true,
          update: false,
          delete: false,
          upload: false,
          accessAllLibraries: true,
          accessAllTags: true,
        },
      }),
    });

    if (!createUserResponse.ok) {
      const errorText = await createUserResponse.text();
      throw new Error(`AudiobookShelf API error: ${errorText}`);
    }

    return {
      success: true,
      message: `AudiobookShelf account created successfully! Save your credentials below.`,
      credentials: {
        username,
        password,
      },
    };
  } catch (error) {
    console.error('AudiobookShelf user creation error:', error);
    return {
      success: false,
      message: `Failed to create AudiobookShelf account: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { invite_code, username, email, password } = req.body;

    // Validate required fields
    if (!invite_code || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.',
      });
    }

    // Validate invite code
    const inviteCodes = readInviteCodes();
    const codeIndex = inviteCodes.findIndex(c => c.code === invite_code);
    
    if (codeIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invite code.',
      });
    }

    const inviteCode = inviteCodes[codeIndex];

    if (!inviteCode.isActive || inviteCode.usedBy) {
      return res.status(400).json({
        success: false,
        message: 'This invite code has already been used or is no longer active.',
      });
    }

    // Check if username or email already exists
    const users = readUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists.',
      });
    }

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, underscores, and hyphens.',
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

    // Create new user in portal
    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      email,
      password: hashPassword(password),
      createdAt: Date.now(),
      isAdmin: false,
    };

    users.push(newUser);
    writeUsers(users);

    // Mark invite code as used for audiobooks
    inviteCode.usedBy = username;
    inviteCode.usedAt = Date.now();
    inviteCode.usedFor = 'audiobooks';
    inviteCodes[codeIndex] = inviteCode;
    writeInviteCodes(inviteCodes);

    // Create AudiobookShelf user
    const result = await createAudiobookShelfUser(username, password);

    if (!result.success) {
      console.error(`AudiobookShelf creation failed for ${username}:`, result.message);
      return res.status(500).json({
        success: false,
        message: `Portal account created, but there was an issue creating the AudiobookShelf account: ${result.message}. Please contact the administrator.`,
      });
    }

    console.log(`AudiobookShelf account created for ${username} (${email})`);

    return res.status(200).json(result);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
