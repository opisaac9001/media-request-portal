import type { NextApiRequest, NextApiResponse } from 'next';

interface AudiobookShelfResponse {
  success: boolean;
  message: string;
  credentials?: {
    username: string;
    password: string;
  };
}

async function createAudiobookShelfUser(username: string, password: string): Promise<AudiobookShelfResponse> {
  try {
    const audiobookshelfUrl = process.env.AUDIOBOOKSHELF_BASE_URL;
    const audiobookshelfToken = process.env.AUDIOBOOKSHELF_API_TOKEN;

    if (!audiobookshelfUrl || !audiobookshelfToken) {
      return {
        success: false,
        message: 'AudiobookShelf configuration is missing. Please contact the administrator.',
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
      message: `AudiobookShelf account created successfully! Save your credentials below.`,
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
  if (req.method === 'POST') {
    const { authorization_phrase, username, email, password } = req.body;

    // Validate authorization phrase
    if (authorization_phrase !== process.env.AUTHORIZATION_PHRASE) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect authorization phrase.',
      });
    }

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.',
      });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, underscores, and hyphens.',
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

    // Create AudiobookShelf user
    const result = await createAudiobookShelfUser(username, password);

    // Log the request
    console.log(`AudiobookShelf access request for ${username} (${email})`);

    return res.status(result.success ? 200 : 500).json(result);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
