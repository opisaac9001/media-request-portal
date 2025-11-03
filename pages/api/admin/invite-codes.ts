import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface InviteCode {
  code: string;
  createdAt: number;
  createdBy: string;
  usedBy?: string;
  usedAt?: number;
  isActive: boolean;
}

const INVITE_CODES_FILE = path.join(process.cwd(), 'data', 'invite-codes.json');

function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(INVITE_CODES_FILE)) {
    fs.writeFileSync(INVITE_CODES_FILE, JSON.stringify({ codes: [] }, null, 2));
  }
}

function getInviteCodes(): InviteCode[] {
  ensureDataDir();
  const data = fs.readFileSync(INVITE_CODES_FILE, 'utf-8');
  return JSON.parse(data).codes || [];
}

function saveInviteCodes(codes: InviteCode[]) {
  ensureDataDir();
  fs.writeFileSync(INVITE_CODES_FILE, JSON.stringify({ codes }, null, 2));
}

function generateCode(): string {
  // Generate a readable invite code (e.g., XXXX-XXXX-XXXX)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking characters
  const segments = 3;
  const segmentLength = 4;
  
  let code = '';
  for (let i = 0; i < segments; i++) {
    if (i > 0) code += '-';
    for (let j = 0; j < segmentLength; j++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      code += chars[randomIndex];
    }
  }
  
  return code;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin authentication
  const cookies = req.headers.cookie || '';
  const hasAdminSession = cookies.includes('admin_session=');

  if (!hasAdminSession) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Get all invite codes
    try {
      const codes = getInviteCodes();
      return res.status(200).json({
        success: true,
        codes,
      });
    } catch (error) {
      console.error('Error fetching invite codes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch invite codes',
      });
    }
  } else if (req.method === 'POST') {
    // Generate new invite code
    try {
      const codes = getInviteCodes();
      
      const newCode: InviteCode = {
        code: generateCode(),
        createdAt: Date.now(),
        createdBy: 'admin',
        isActive: true,
      };

      codes.push(newCode);
      saveInviteCodes(codes);

      console.log(`New invite code generated: ${newCode.code}`);

      return res.status(200).json({
        success: true,
        code: newCode.code,
        message: 'Invite code generated successfully',
      });
    } catch (error) {
      console.error('Error generating invite code:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate invite code',
      });
    }
  } else if (req.method === 'DELETE') {
    // Revoke an invite code
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required',
      });
    }

    try {
      const codes = getInviteCodes();
      const codeIndex = codes.findIndex((c) => c.code === code);

      if (codeIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Invite code not found',
        });
      }

      codes[codeIndex].isActive = false;
      saveInviteCodes(codes);

      console.log(`Invite code revoked: ${code}`);

      return res.status(200).json({
        success: true,
        message: 'Invite code revoked successfully',
      });
    } catch (error) {
      console.error('Error revoking invite code:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to revoke invite code',
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
