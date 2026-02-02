import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdminAuthenticated } from '../../../lib/adminAuth';
import fs from 'fs';
import path from 'path';

interface BookRequest {
  id: string;
  title: string;
  author?: string;
  description?: string;
  requestedBy: string;
  requestedByEmail: string;
  requestedAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNotes?: string;
  updatedAt?: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOK_REQUESTS_FILE = path.join(DATA_DIR, 'book-requests.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readBookRequests(): BookRequest[] {
  ensureDataDir();
  if (!fs.existsSync(BOOK_REQUESTS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(BOOK_REQUESTS_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed : (parsed.requests || []);
}

function writeBookRequests(requests: BookRequest[]) {
  ensureDataDir();
  fs.writeFileSync(BOOK_REQUESTS_FILE, JSON.stringify({ requests }, null, 2));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isAuthenticated = isAdminAuthenticated(req);
  
  if (!isAuthenticated) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // GET - Get all book requests for admin
  if (req.method === 'GET') {
    const requests = readBookRequests();
    
    // Sort by date, pending first
    requests.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return b.requestedAt - a.requestedAt;
    });

    return res.status(200).json({ success: true, requests });
  }

  // PATCH - Update book request status
  if (req.method === 'PATCH') {
    const { requestId, status, adminNotes } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and status are required.'
      });
    }

    if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value.'
      });
    }

    const requests = readBookRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    requests[requestIndex].status = status;
    requests[requestIndex].updatedAt = Date.now();
    if (adminNotes !== undefined) {
      requests[requestIndex].adminNotes = adminNotes;
    }

    writeBookRequests(requests);

    console.log(`Book request updated: ${requestId} -> ${status}`);

    return res.status(200).json({
      success: true,
      message: 'Request updated successfully.',
      request: requests[requestIndex]
    });
  }

  // DELETE - Delete a book request
  if (req.method === 'DELETE') {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required.'
      });
    }

    const requests = readBookRequests();
    const filteredRequests = requests.filter(r => r.id !== requestId);

    if (filteredRequests.length === requests.length) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    writeBookRequests(filteredRequests);

    console.log(`Book request deleted: ${requestId}`);

    return res.status(200).json({
      success: true,
      message: 'Request deleted successfully.'
    });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
