import type { NextApiRequest, NextApiResponse } from 'next';

interface PlexResponse {
  success: boolean;
  message: string;
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
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        server_id: machineId,
        shared_server: {
          library_section_ids: libraryIds, // Empty array shares all libraries, specific IDs share only those
          invited_email: email,
        },
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
    const { authorization_phrase, email } = req.body;

    // Validate authorization phrase
    if (authorization_phrase !== process.env.AUTHORIZATION_PHRASE) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect authorization phrase.',
      });
    }

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    // Send Plex invite
    const result = await sendPlexInvite(email);

    // Log the request (optional - you could save to a database here)
    console.log(`Access request for ${email}`);

    return res.status(result.success ? 200 : 500).json(result);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}