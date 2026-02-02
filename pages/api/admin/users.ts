import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdminAuthenticated } from '../../../lib/adminAuth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: number;
  isAdmin?: boolean;
  isActive?: boolean;
  lastLogin?: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

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

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isAuthenticated = isAdminAuthenticated(req);
  
  if (!isAuthenticated) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // GET - Get all users
  if (req.method === 'GET') {
    const users = readUsers();
    
    // Don't send passwords to frontend
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      isAdmin: user.isAdmin || false,
      isActive: user.isActive !== false, // Default to true if not set
      lastLogin: user.lastLogin
    }));

    // Sort by creation date, newest first
    sanitizedUsers.sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ success: true, users: sanitizedUsers });
  }

  // PATCH - Update user (reset password, enable/disable account)
  if (req.method === 'PATCH') {
    const { userId, action, newPassword } = req.body;

    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        message: 'User ID and action are required.'
      });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const user = users[userIndex];

    switch (action) {
      case 'reset_password':
        if (!newPassword || newPassword.length < 8) {
          return res.status(400).json({
            success: false,
            message: 'New password must be at least 8 characters.'
          });
        }
        users[userIndex].password = hashPassword(newPassword);
        writeUsers(users);
        console.log(`Password reset for user: ${user.username}`);
        return res.status(200).json({
          success: true,
          message: `Password reset successfully for ${user.username}.`
        });

      case 'disable':
        users[userIndex].isActive = false;
        writeUsers(users);
        console.log(`User disabled: ${user.username}`);
        return res.status(200).json({
          success: true,
          message: `User ${user.username} has been disabled.`
        });

      case 'enable':
        users[userIndex].isActive = true;
        writeUsers(users);
        console.log(`User enabled: ${user.username}`);
        return res.status(200).json({
          success: true,
          message: `User ${user.username} has been enabled.`
        });

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: reset_password, disable, or enable.'
        });
    }
  }

  // DELETE - Delete a user
  if (req.method === 'DELETE') {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.'
      });
    }

    const users = readUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Prevent deleting admin users
    if (user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users.'
      });
    }

    const filteredUsers = users.filter(u => u.id !== userId);
    writeUsers(filteredUsers);

    console.log(`User deleted: ${user.username}`);

    return res.status(200).json({
      success: true,
      message: `User ${user.username} has been deleted.`
    });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
