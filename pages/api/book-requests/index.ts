import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parse } from 'cookie';

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
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

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

function getUserFromSession(sessionId: string | undefined): { username: string; email: string } | null {
  if (!sessionId) return null;

  try {
    if (!fs.existsSync(SESSIONS_FILE)) return null;
    const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const sessions = JSON.parse(data);
    const session = sessions[sessionId];

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    // Get user details
    if (!fs.existsSync(USERS_FILE)) return null;
    const usersData = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(usersData);
    const users = Array.isArray(parsed) ? parsed : (parsed.users || []);
    const user = users.find((u: any) => u.username === session.username);

    if (!user) return null;

    return {
      username: user.username,
      email: user.email
    };
  } catch (error) {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET - Retrieve all book requests (admin only handled in separate endpoint)
  if (req.method === 'GET') {
    const cookies = parse(req.headers.cookie || '');
    const sessionId = cookies.user_session;
    const user = getUserFromSession(sessionId);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const requests = readBookRequests();
    // Return only requests from this user
    const userRequests = requests.filter(r => r.requestedBy === user.username);

    return res.status(200).json({ success: true, requests: userRequests });
  }

  // POST - Create new book request
  if (req.method === 'POST') {
    const cookies = parse(req.headers.cookie || '');
    const sessionId = cookies.user_session;
    const user = getUserFromSession(sessionId);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'You must be logged in to request books.' 
      });
    }

    const { title, author, description } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Book title is required.'
      });
    }

    // Check for duplicate request from same user
    const requests = readBookRequests();
    const duplicate = requests.find(
      r => r.title.toLowerCase() === title.toLowerCase() && 
           r.requestedBy === user.username &&
           r.status === 'pending'
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested this book. Please wait for admin approval.'
      });
    }

    const newRequest: BookRequest = {
      id: crypto.randomUUID(),
      title: title.trim(),
      author: author?.trim(),
      description: description?.trim(),
      requestedBy: user.username,
      requestedByEmail: user.email,
      requestedAt: Date.now(),
      status: 'pending'
    };

    requests.push(newRequest);
    writeBookRequests(requests);

    console.log(`New book request: "${title}" by ${user.username}`);

    return res.status(200).json({
      success: true,
      message: 'Book request submitted successfully! An admin will review it soon.',
      request: newRequest
    });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
