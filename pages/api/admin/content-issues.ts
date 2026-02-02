import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const ISSUES_FILE = path.join(process.cwd(), 'data', 'content-issues.json');
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'sessions.json');
const ADMIN_SESSIONS_FILE = path.join(process.cwd(), 'data', 'admin-sessions.json');

interface Session {
  sessionId: string;
  userId: string;
  username: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  isAdmin?: boolean;
}

interface ContentIssue {
  id: string;
  username: string;
  userId: string;
  contentType: string;
  title: string;
  issueType: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

// Check if user is admin
function isAdmin(req: NextApiRequest): boolean {
  // First, support the legacy user-session file which may contain an isAdmin flag
  const userSessionId = req.cookies.session;
  if (userSessionId) {
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        const sessionsData = fs.readFileSync(SESSIONS_FILE, 'utf-8');
        const sessions: Session[] = JSON.parse(sessionsData || '[]');
        const session = sessions.find(s => s.sessionId === userSessionId);
        if (session && new Date(session.expiresAt) > new Date() && session.isAdmin === true) {
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking user session admin status:', error);
    }
  }

  // Next, accept admin sessions created via the admin login flow (admin_session cookie)
  const adminSessionId = req.cookies.admin_session;
  if (adminSessionId) {
    try {
      if (fs.existsSync(ADMIN_SESSIONS_FILE)) {
        const adminData = fs.readFileSync(ADMIN_SESSIONS_FILE, 'utf-8');
        const adminSessions = JSON.parse(adminData)?.sessions || [];
        const adminSession = adminSessions.find((s: any) => s.sessionId === adminSessionId);
        if (adminSession && adminSession.expiresAt > Date.now()) {
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking admin session file:', error);
    }
  }

  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check admin authentication
  if (!isAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Read content issues
      if (!fs.existsSync(ISSUES_FILE)) {
        return res.status(200).json({ success: true, issues: [] });
      }

      const issuesData = fs.readFileSync(ISSUES_FILE, 'utf-8');
      const issues: ContentIssue[] = JSON.parse(issuesData);

      // Sort by created date (newest first)
      issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.status(200).json({ success: true, issues });
    } catch (error) {
      console.error('Error reading content issues:', error);
      return res.status(500).json({ success: false, message: 'Failed to load issues' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { issueId, status } = req.body;

      if (!issueId || !status) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      if (!['pending', 'resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      // Read current issues
      if (!fs.existsSync(ISSUES_FILE)) {
        return res.status(404).json({ success: false, message: 'No issues found' });
      }

      const issuesData = fs.readFileSync(ISSUES_FILE, 'utf-8');
      const issues: ContentIssue[] = JSON.parse(issuesData);

      // Find and update the issue
      const issueIndex = issues.findIndex(i => i.id === issueId);
      if (issueIndex === -1) {
        return res.status(404).json({ success: false, message: 'Issue not found' });
      }

      issues[issueIndex].status = status;

      // Save updated issues
      fs.writeFileSync(ISSUES_FILE, JSON.stringify(issues, null, 2));

      return res.status(200).json({ success: true, message: 'Issue updated successfully' });
    } catch (error) {
      console.error('Error updating content issue:', error);
      return res.status(500).json({ success: false, message: 'Failed to update issue' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
