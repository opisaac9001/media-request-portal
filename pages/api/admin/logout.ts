import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Clear the session cookie (matching user login format)
  const cookie = 'admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax';

  res.setHeader('Set-Cookie', cookie);
  
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}
