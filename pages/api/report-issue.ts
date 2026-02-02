import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ISSUES_FILE = path.join(DATA_DIR, 'content-issues.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readIssues() {
  ensureDataDir();
  if (!fs.existsSync(ISSUES_FILE)) {
    return [];
  }
  const data = fs.readFileSync(ISSUES_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed : (parsed.issues || []);
}

function writeIssues(issues: any[]) {
  ensureDataDir();
  fs.writeFileSync(ISSUES_FILE, JSON.stringify({ issues }, null, 2));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check user authentication
  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/user_session=([^;]+)/);

  if (!sessionMatch) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const sessionToken = sessionMatch[1];
  const sessionFile = path.join(process.cwd(), 'data', 'sessions.json');

  if (!fs.existsSync(sessionFile)) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const sessions = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    const session = sessions[sessionToken];

    if (!session) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (req.method === 'POST') {
      // Submit new issue report
      const { contentType, title, issueType, description } = req.body;

      if (!contentType || !title || !issueType || !description) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required.',
        });
      }

      const issues = readIssues();
      const newIssue = {
        id: Date.now().toString(),
        username: session.username,
        userId: session.userId,
        contentType,
        title,
        issueType,
        description,
        status: 'pending',
        createdAt: Date.now(),
      };

      issues.push(newIssue);
      writeIssues(issues);

      console.log(`Content issue reported by ${session.username}: ${title} (${issueType})`);

      return res.status(200).json({
        success: true,
        message: 'Issue reported successfully.',
      });
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling issue report:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
