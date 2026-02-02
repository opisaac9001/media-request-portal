import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { checkRateLimit, recordAttempt, getClientIP } from '../../../lib/rateLimit';

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: number;
  isAdmin?: boolean;
}

interface PlexResponse {
  success: boolean;
  message: string;
}

interface AudiobookShelfResponse {
  success: boolean;
  message: string;
  credentials?: {
    username: string;
    password: string;
  };
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
  usedFor?: 'plex' | 'registration' | 'audiobooks';
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

async function sendPlexInvite(email: string): Promise<PlexResponse> {
  try {
    const plexToken = process.env.PLEX_TOKEN;
    const plexBaseUrl = process.env.PLEX_BASE_URL;

    if (!plexToken || !plexBaseUrl) {
      return {
        success: false,
        message: 'Plex configuration is missing.',
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
        librarySectionIds: libraryIds,
        invitedEmail: email,
      }),
    });

    if (!inviteResponse.ok) {
      const errorText = await inviteResponse.text();
      throw new Error(`Plex API error: ${errorText}`);
    }

    return {
      success: true,
      message: 'Plex invitation sent successfully!',
    };
  } catch (error) {
    console.error('Plex invite error:', error);
    return {
      success: false,
      message: `Failed to send Plex invite: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function createAudiobookShelfUser(username: string, password: string): Promise<AudiobookShelfResponse> {
  try {
    const audiobookshelfUrl = process.env.AUDIOBOOKSHELF_BASE_URL;
    const audiobookshelfToken = process.env.AUDIOBOOKSHELF_API_TOKEN;

    if (!audiobookshelfUrl || !audiobookshelfToken) {
      return {
        success: false,
        message: 'AudiobookShelf configuration is missing.',
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
      message: 'AudiobookShelf account created successfully!',
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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check rate limit before processing
  const clientIP = getClientIP(req);
  const rateLimitCheck = checkRateLimit(clientIP);
  
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: rateLimitCheck.message || 'Too many attempts. Please try again later.',
      retryAfter: rateLimitCheck.retryAfter
    });
  }

  const { invite_code, username, email, password, request_plex, request_audiobooks } = req.body;

  // Validate required fields
  if (!invite_code || !username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Invite code, username, email, and password are required.',
    });
  }

  // Default to true if not specified (backwards compatibility)
  const shouldCreatePlex = request_plex !== false;
  const shouldCreateAudiobooks = request_audiobooks !== false;

  // Validate invite code
  const inviteCodes = getInviteCodes();
  const inviteCodeIndex = inviteCodes.findIndex(
    (c) => c.code.toUpperCase() === invite_code.toUpperCase() && c.isActive && !c.usedBy
  );

  if (inviteCodeIndex === -1) {
    recordAttempt(clientIP);
    console.log(`Failed registration attempt with invalid invite code: ${invite_code} from IP: ${clientIP}`);
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

    // Create new user in portal
    const newUser: User = {
      id: crypto.randomBytes(16).toString('hex'),
      username,
      email,
      password: hashPassword(password),
      createdAt: Date.now(),
      isAdmin: false,
    };

    users.push(newUser);
    saveUsers(users);

    // Mark invite code as used for registration
    inviteCodes[inviteCodeIndex].usedBy = username;
    inviteCodes[inviteCodeIndex].usedAt = Date.now();
    inviteCodes[inviteCodeIndex].usedFor = 'registration';
    saveInviteCodes(inviteCodes);

    console.log(`New user registered: ${username} (${email}) using invite code: ${invite_code}`);

    // Create requested service accounts
    const results = {
      plex: { success: false, message: '', requested: shouldCreatePlex },
      audiobookshelf: { success: false, message: '', requested: shouldCreateAudiobooks }
    };

    // Send Plex invitation if requested
    if (shouldCreatePlex) {
      const plexResult = await sendPlexInvite(email);
      results.plex = { ...plexResult, requested: true };
      if (plexResult.success) {
        console.log(`Plex invitation sent to ${email}`);
      } else {
        console.error(`Plex invitation failed for ${email}: ${plexResult.message}`);
      }
    } else {
      console.log(`Plex invitation skipped for ${username} (user already has access)`);
    }

    // Create AudiobookShelf account if requested
    if (shouldCreateAudiobooks) {
      const audiobookshelfResult = await createAudiobookShelfUser(username, password);
      results.audiobookshelf = { ...audiobookshelfResult, requested: true };
      if (audiobookshelfResult.success) {
        console.log(`AudiobookShelf account created for ${username}`);
      } else {
        console.error(`AudiobookShelf creation failed for ${username}: ${audiobookshelfResult.message}`);
      }
    } else {
      console.log(`AudiobookShelf creation skipped for ${username} (user already has access)`);
    }

    // Build response message
    let message = '✅ Portal account created successfully!\n\n';
    
    if (shouldCreatePlex) {
      if (results.plex.success) {
        message += '✅ Plex invitation sent to your email - check your inbox to accept!\n';
      } else {
        message += `⚠️ Plex invitation failed: ${results.plex.message}\n`;
      }
    } else {
      message += '⏭️ Plex invitation skipped (you already have access)\n';
    }

    if (shouldCreateAudiobooks) {
      if (results.audiobookshelf.success) {
        message += '✅ AudiobookShelf account created - use the same username/password!\n';
        const audiobookshelfUrl = process.env.AUDIOBOOKSHELF_PUBLIC_URL;
        if (audiobookshelfUrl) {
          message += `\n📚 AudiobookShelf URL: ${audiobookshelfUrl}`;
        }
      } else {
        message += `⚠️ AudiobookShelf creation failed: ${results.audiobookshelf.message}`;
      }
    } else {
      message += '⏭️ AudiobookShelf creation skipped (you already have access)';
    }

    // Return success even if some services failed (user can contact admin)
    return res.status(200).json({
      success: true,
      message: message,
      details: {
        portal: true,
        plex: results.plex.success,
        audiobookshelf: results.audiobookshelf.success,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.',
    });
  }
}
