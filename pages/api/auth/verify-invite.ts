import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface InviteCode {
  code: string;
  createdAt: number;
  createdBy: string;
  usedBy?: string;
  usedAt?: number;
  usedFor?: 'plex' | 'registration' | 'audiobooks';
  isActive: boolean;
}

const INVITE_CODES_FILE = path.join(process.cwd(), 'data', 'invite-codes.json');

function getInviteCodes(): InviteCode[] {
  if (!fs.existsSync(INVITE_CODES_FILE)) {
    return [];
  }
  const data = fs.readFileSync(INVITE_CODES_FILE, 'utf-8');
  return JSON.parse(data).codes || [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { invite_code } = req.body;

  if (!invite_code) {
    return res.status(400).json({
      success: false,
      message: 'Invite code is required.',
    });
  }

  try {
    const codes = getInviteCodes();
    const validCode = codes.find(
      (c) => c.code.toUpperCase() === invite_code.toUpperCase() && c.isActive && !c.usedBy
    );

    if (validCode) {
      return res.status(200).json({
        success: true,
        message: 'Invite code is valid.',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid or already used invite code.',
      });
    }
  } catch (error) {
    console.error('Error verifying invite code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify invite code.',
    });
  }
}
