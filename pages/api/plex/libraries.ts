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
    const response = await fetch(`${plexHost}/library/sections?X-Plex-Token=${plexToken}`);
    
    if (!response.ok) {
      throw new Error(`Plex returned ${response.status}`);
    }

    const xml = await response.text();
    
    // Parse library sections from XML
    const libraryRegex = /<Directory[^>]*key="([^"]*)"[^>]*title="([^"]*)"[^>]*type="([^"]*)"[^>]*agent="([^"]*)"[^>]*scanner="([^"]*)"[^>]*language="([^"]*)"[^>]*uuid="([^"]*)"[^>]*updatedAt="([^"]*)"[^>]*createdAt="([^"]*)"[^>]*scannedAt="([^"]*)"[^>]*>/g;
    const sections = [];
    let match;
    
    while ((match = libraryRegex.exec(xml)) !== null) {
      sections.push({
        $: {
          key: match[1],
          title: match[2],
          type: match[3],
          agent: match[4] || '',
          scanner: match[5] || '',
          language: match[6] || '',
          uuid: match[7] || '',
          updatedAt: match[8] || '',
          createdAt: match[9] || '',
          scannedAt: match[10] || ''
        }
      });
    }

    return res.status(200).json({
      success: true,
      sections
    });
  } catch (error) {
    console.error('Failed to fetch Plex libraries:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch libraries: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
