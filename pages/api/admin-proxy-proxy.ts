// Next.js API route to proxy admin requests to the experiment daemon
import type { NextApiRequest, NextApiResponse } from 'next';

const DAEMON_URL = process.env.DAEMOND_URL || 'http://localhost:8082'; // Proxy port
const ADMIN_TOKEN = process.env.EXPERIMENT_ADMIN_TOKEN || 'experiment-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body, headers, query } = req;
  // Support /api/admin-proxy-proxy/v1/templates etc.
  const path = req.url?.replace(/^\/api\/admin-proxy-proxy/, '') || '';
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
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (err: any) {
    res.status(500).json({ success: false, message: String(err) });
  }
}
