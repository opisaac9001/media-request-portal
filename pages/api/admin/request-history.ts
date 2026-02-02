import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdminAuthenticated } from '../../../lib/adminAuth';
import fs from 'fs';
import path from 'path';

interface MediaRequest {
  id: string;
  user: string;
  email: string;
  type: string;
  title: string;
  requestedAt: number;
  status?: string;
  details?: any;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');
const BOOK_REQUESTS_FILE = path.join(DATA_DIR, 'book-requests.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readRequests(): any[] {
  ensureDataDir();
  if (!fs.existsSync(REQUESTS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(REQUESTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : (parsed.requests || []);
  } catch (error) {
    return [];
  }
}

function readBookRequests(): any[] {
  ensureDataDir();
  if (!fs.existsSync(BOOK_REQUESTS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(BOOK_REQUESTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isAuthenticated = isAdminAuthenticated(req);
  
  if (!isAuthenticated) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const mediaRequests = readRequests();
    const bookRequests = readBookRequests();
    
    // Transform media requests into a unified format
    const formattedMediaRequests: MediaRequest[] = mediaRequests.map(request => {
      let type = 'Unknown';
      let title = 'Unknown';
      let details: any = {};

      if (request.content_type) {
        // This is a media content request (movies, TV, etc.)
        type = request.content_type.replace('_', ' ').toUpperCase();
        title = request.title || 'Unknown';
        details = {
          year: request.year,
          tmdb_id: request.tmdb_id,
          quality: request.quality_profile,
          rootFolder: request.root_folder
        };
      } else if (request.email && request.username) {
        title = request.title || request.username;
      }

      return {
        id: request.id,
        user: request.username || request.user || 'Unknown',
        email: request.email || 'N/A',
        type: type,
        title: title,
        requestedAt: request.requested_at || request.createdAt || Date.now(),
        status: request.status || 'completed',
        details: details
      };
    });

    // Transform book requests into unified format
    const formattedBookRequests: MediaRequest[] = bookRequests.map(request => ({
      id: request.id,
      user: request.username || 'Unknown',
      email: request.email || 'N/A',
      type: 'BOOK',
      title: request.title || 'Unknown',
      requestedAt: request.createdAt || Date.now(),
      status: request.status || 'pending',
      details: {
        author: request.author,
        description: request.description,
        adminNotes: request.adminNotes
      }
    }));

    // Combine all requests
    const allRequests = [...formattedMediaRequests, ...formattedBookRequests];

    // Sort by date, newest first
    allRequests.sort((a, b) => b.requestedAt - a.requestedAt);

    // Get stats
    const stats = {
      total: allRequests.length,
      byType: allRequests.reduce((acc: any, req) => {
        acc[req.type] = (acc[req.type] || 0) + 1;
        return acc;
      }, {}),
      uniqueUsers: new Set(allRequests.map(r => r.user)).size
    };

    return res.status(200).json({ 
      success: true, 
      requests: allRequests,
      stats: stats
    });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
