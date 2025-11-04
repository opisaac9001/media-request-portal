import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdminAuthenticated } from '../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin authentication
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const audiobookshelfUrl = process.env.AUDIOBOOKSHELF_BASE_URL;
  const audiobookshelfToken = process.env.AUDIOBOOKSHELF_API_TOKEN;

  if (!audiobookshelfUrl || !audiobookshelfToken) {
    return res.status(500).json({
      success: false,
      message: 'AudiobookShelf configuration is missing.',
    });
  }

  if (req.method === 'GET') {
    // Fetch all users
    try {
      const response = await fetch(`${audiobookshelfUrl}/api/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${audiobookshelfToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`AudiobookShelf API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return res.status(200).json({
        success: true,
        users: data.users || [],
      });
    } catch (error) {
      console.error('Error fetching AudiobookShelf users:', error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  } else if (req.method === 'DELETE') {
    // Delete a user
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    try {
      const response = await fetch(`${audiobookshelfUrl}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${audiobookshelfToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`AudiobookShelf API error: ${response.statusText}`);
      }

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting AudiobookShelf user:', error);
      return res.status(500).json({
        success: false,
        message: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
