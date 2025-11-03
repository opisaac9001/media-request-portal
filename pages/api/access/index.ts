import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface PlexResponse {
  success: boolean;
  message: string;
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
  usedFor?: 'plex' | 'registration';
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
  // Handle both formats: direct array or {users: []}
  return Array.isArray(parsed) ? parsed : (parsed.users || []);
}

function writeUsers(users: User[]) {
  ensureDataDir();
  // Use consistent format with other files
  fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
}

function readInviteCodes(): InviteCode[] {
  ensureDataDir();
  if (!fs.existsSync(INVITE_CODES_FILE)) {
    return [];
  }
  const data = fs.readFileSync(INVITE_CODES_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  // Handle both formats: direct array or {codes: []}
  return Array.isArray(parsed) ? parsed : (parsed.codes || []);
}

function writeInviteCodes(codes: InviteCode[]) {
  ensureDataDir();
  // Use consistent format with other files
  fs.writeFileSync(INVITE_CODES_FILE, JSON.stringify({ codes }, null, 2));
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

async function sendPlexInvite(email: string): Promise<PlexResponse> {
  try {
    const plexToken = process.env.PLEX_TOKEN;
    const plexBaseUrl = process.env.PLEX_BASE_URL;

    if (!plexToken || !plexBaseUrl) {
      return {
        success: false,
        message: 'Plex configuration is missing. Please contact the administrator.',
      };
    }

    // Get Plex server machine identifier
    const serverResponse = await fetch(`${plexBaseUrl}/?X-Plex-Token=${plexToken}`);
    if (!serverResponse.ok) {
      throw new Error('Failed to connect to Plex server');
    }

    const serverData = await serverResponse.text();
    const machineIdMatch = serverData.match(/machineIdentifier="([^"]+)"/);
    const machineId = machineIdMatch ? machineIdMatch[1] : null;

    if (!machineId) {
      throw new Error('Could not retrieve Plex server ID');
    }

    // Get library IDs from environment (comma-separated)
    const libraryIdsStr = process.env.PLEX_LIBRARY_IDS || '';
    const libraryIds = libraryIdsStr ? libraryIdsStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];

    // Send invitation via Plex.tv API
    const inviteResponse = await fetch('https://plex.tv/api/v2/shared_servers', {
      method: 'POST',
      headers: {
        'X-Plex-Token': plexToken,
        'X-Plex-Client-Identifier': 'media-request-portal',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        machineIdentifier: machineId,
        librarySectionIds: libraryIds, // Empty array shares all libraries, specific IDs share only those
        invitedEmail: email,
      }),
    });

    if (!inviteResponse.ok) {
      const errorText = await inviteResponse.text();
      throw new Error(`Plex API error: ${errorText}`);
    }

    return {
      success: true,
      message: `Plex invitation sent successfully to ${email}!`,
    };
  } catch (error) {
    console.error('Plex invite error:', error);
    return {
      success: false,
      message: `Failed to send Plex invite: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
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

    // Create new user
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

    // Mark invite code as used for Plex access
    inviteCode.usedBy = username;
    inviteCode.usedAt = Date.now();
    inviteCode.usedFor = 'plex';
    inviteCodes[codeIndex] = inviteCode;
    writeInviteCodes(inviteCodes);

    // Send Plex invite
    const result = await sendPlexInvite(email);

    if (!result.success) {
      // If Plex invite fails, still return success for account creation
      // but include warning in message
      console.error(`Plex invite failed for ${email}:`, result.message);
      return res.status(200).json({
        success: true,
        message: `Account created successfully, but there was an issue sending the Plex invitation: ${result.message}. Please contact the administrator.`,
      });
    }

    console.log(`Plex access granted to ${username} (${email})`);

    return res.status(200).json({
      success: true,
      message: `Account created and Plex invitation sent to ${email}! Check your email to accept the invitation.`,
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}