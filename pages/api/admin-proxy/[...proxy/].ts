// Next.js API route to proxy admin requests to the experiment daemon
import type { NextApiRequest, NextApiResponse } from 'next';

const DAEMON_URL = process.env.DAEMOND_URL || 'http://127.0.0.1:8081'; // Gamesd daemon port
const ADMIN_TOKEN = process.env.EXPERIMENT_ADMIN_TOKEN || 'experiment-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body, headers, query } = req;
  const path = '/' + (query.proxy as string[]).join('/');
  const target = DAEMON_URL + path;

  // Forward headers, add admin token
  const proxyHeaders: Record<string, string> = {
    ...headers as Record<string, string>,
    'x-admin-token': ADMIN_TOKEN,
  };
  delete proxyHeaders['host'];

  try {
    const response = await fetch(target, {
      method,
      headers: proxyHeaders,
      body: ['GET','HEAD'].includes(method || '') ? undefined : JSON.stringify(body),
    });
    
    // Try to parse as JSON first
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      // For non-JSON responses, send as text
      const data = await response.text();
      res.status(response.status).send(data);
    }
  } catch (err: any) {
    console.error('Admin proxy error:', err);
    res.status(500).json({ success: false, message: `Unable to connect to daemon: ${String(err)}` });
  }
}
