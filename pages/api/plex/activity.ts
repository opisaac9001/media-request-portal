import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdminAuthenticated } from '../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({
      authenticated: false,
      message: 'Not authenticated',
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const plexHost = process.env.PLEX_BASE_URL;
  const plexToken = process.env.PLEX_TOKEN;

  if (!plexHost || !plexToken) {
    return res.status(500).json({
      success: false,
      message: 'Plex not configured. Please set PLEX_BASE_URL and PLEX_TOKEN in environment variables.',
    });
  }

  try {
    // Fetch watch history from Plex
    const response = await fetch(`${plexHost}/status/sessions/history/all?X-Plex-Token=${plexToken}`);
    
    if (!response.ok) {
      throw new Error(`Plex returned ${response.status}`);
    }

    const xml = await response.text();
    
    // Parse users from XML
    const userMap = new Map<string, {
      username: string;
      totalSessions: number;
      last24h: number;
      last7d: number;
      last30d: number;
      lastSeen: number | null;
      uniqueTitles: Set<string>;
      inactive: boolean;
    }>();

    // Extract video entries from XML
    const videoRegex = /<Video[^>]*accountID="([^"]*)"[^>]*title="([^"]*)"[^>]*viewedAt="([^"]*)"[^>]*>/g;
    let match;
    const now = Date.now() / 1000;
    const day = 24 * 60 * 60;

    while ((match = videoRegex.exec(xml)) !== null) {
      const accountId = match[1];
      const title = match[2];
      const viewedAt = parseInt(match[3]);

      if (!userMap.has(accountId)) {
        userMap.set(accountId, {
          username: accountId,
          totalSessions: 0,
          last24h: 0,
          last7d: 0,
          last30d: 0,
          lastSeen: null,
          uniqueTitles: new Set(),
          inactive: false
        });
      }

      const user = userMap.get(accountId)!;
      user.totalSessions++;
      user.uniqueTitles.add(title);

      if (!user.lastSeen || viewedAt > user.lastSeen) {
        user.lastSeen = viewedAt;
      }

      const age = now - viewedAt;
      if (age < day) user.last24h++;
      if (age < 7 * day) user.last7d++;
      if (age < 30 * day) user.last30d++;
    }

    // Mark inactive users (no activity in 30 days)
    userMap.forEach(user => {
      user.inactive = !user.lastSeen || (now - user.lastSeen) > 30 * day;
    });

    const users = Array.from(userMap.values()).map(u => ({
      username: u.username,
      totalSessions: u.totalSessions,
      last24h: u.last24h,
      last7d: u.last7d,
      last30d: u.last30d,
      lastSeen: u.lastSeen,
      uniqueTitles: u.uniqueTitles.size,
      inactive: u.inactive
    }));

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Failed to fetch Plex activity:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch activity: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
