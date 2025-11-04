import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdminAuthenticated } from '../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({
      authenticated: false,
      message: 'Not authenticated',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { plexBaseUrl, plexToken } = req.body;

  if (!plexBaseUrl || !plexToken) {
    return res.status(400).json({
      success: false,
      message: 'Plex Base URL and Token are required',
    });
  }

  try {
    // Fetch library sections from Plex
    const response = await fetch(`${plexBaseUrl}/library/sections?X-Plex-Token=${plexToken}`);
    
    if (!response.ok) {
      throw new Error('Failed to connect to Plex server');
    }

    const data = await response.text();
    
    // Parse XML response to extract library information
    const libraryRegex = /<Directory[^>]*key="([^"]*)"[^>]*title="([^"]*)"[^>]*type="([^"]*)"[^>]*>/g;
    const libraries = [];
    let match;
    
    while ((match = libraryRegex.exec(data)) !== null) {
      libraries.push({
        key: match[1],
        title: match[2],
        type: match[3],
      });
    }

    return res.status(200).json({
      success: true,
      libraries,
    });
  } catch (error) {
    console.error('Failed to fetch Plex libraries:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch libraries: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
