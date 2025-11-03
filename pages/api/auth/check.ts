import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/user_session=([^;]+)/);

  if (!sessionMatch) {
    return res.status(200).json({ authenticated: false });
  }

  const sessionToken = sessionMatch[1];
  const sessionFile = path.join(process.cwd(), 'data', 'sessions.json');

  if (!fs.existsSync(sessionFile)) {
    return res.status(200).json({ authenticated: false });
  }

  try {
    const sessions = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    const session = sessions[sessionToken];

    if (session) {
      return res.status(200).json({
        authenticated: true,
        username: session.username,
        userId: session.userId,
      });
    }
  } catch (error) {
    console.error('Session check error:', error);
  }

  return res.status(200).json({ authenticated: false });
}
