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
      message: 'Plex not configured',
    });
  }

  try {
    const response = await fetch(`${plexHost}/status/sessions?X-Plex-Token=${plexToken}`);
    
    if (!response.ok) {
      throw new Error(`Plex returned ${response.status}`);
    }

    const xml = await response.text();

    return res.status(200).json({
      success: true,
      data: { MediaContainer: { Video: [] } }, // Parse XML if needed
      raw: xml
    });
  } catch (error) {
    console.error('Failed to fetch Plex sessions:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
