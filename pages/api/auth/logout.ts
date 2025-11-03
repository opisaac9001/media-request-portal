import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Clear the session cookie
  res.setHeader('Set-Cookie', 'user_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');

  // Remove session from file
  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/user_session=([^;]+)/);
  
  if (sessionMatch) {
    const sessionToken = sessionMatch[1];
    const sessionFile = path.join(process.cwd(), 'data', 'sessions.json');
    
    if (fs.existsSync(sessionFile)) {
      const sessions = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
      delete sessions[sessionToken];
      fs.writeFileSync(sessionFile, JSON.stringify(sessions, null, 2));
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}
