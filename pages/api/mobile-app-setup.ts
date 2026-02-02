import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check user authentication
  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/user_session=([^;]+)/);

  if (!sessionMatch) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const sessionToken = sessionMatch[1];
  const sessionFile = path.join(process.cwd(), 'data', 'sessions.json');

  if (!fs.existsSync(sessionFile)) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const sessions = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    const session = sessions[sessionToken];

    if (!session) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Check if this is an admin user
    if (session.isAdmin && session.userId === 'admin') {
      // Admin user - use admin credentials from environment
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const audiobookshelfUrl = process.env.AUDIOBOOKSHELF_PUBLIC_URL || process.env.AUDIOBOOKSHELF_BASE_URL;

      return res.status(200).json({
        success: true,
        user: {
          username: session.username || adminUsername,
          email: 'admin@localhost', // Admin doesn't have email in session
        },
        audiobookshelf: {
          url: audiobookshelfUrl || 'Not configured',
        }
      });
    }

    // Get user details from users.json
    const usersFile = path.join(process.cwd(), 'data', 'users.json');
    if (!fs.existsSync(usersFile)) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const users = Array.isArray(usersData) ? usersData : (usersData.users || []);
    const user = users.find((u: any) => u.id === session.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get AudiobookShelf URL from environment
    const audiobookshelfUrl = process.env.AUDIOBOOKSHELF_PUBLIC_URL || process.env.AUDIOBOOKSHELF_BASE_URL;

    return res.status(200).json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
      },
      audiobookshelf: {
        url: audiobookshelfUrl || 'Not configured',
      }
    });
  } catch (error) {
    console.error('Error fetching plappa setup info:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
