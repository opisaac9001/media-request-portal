import type { NextApiRequest, NextApiResponse } from 'next';

// Helper function to check authentication
function isAuthenticated(req: NextApiRequest): boolean {
  const cookies = req.cookies;
  return !!cookies.admin_session;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      authenticated: false,
      message: 'Not authenticated',
    });
  }

  const { serviceName } = req.query;

  if (!serviceName || typeof serviceName !== 'string') {
    return res.status(400).json({ message: 'Service name required' });
  }

  // Get service URL from environment
  const envKey = `SERVICE_URL_${serviceName.toUpperCase()}`;
  const serviceUrl = process.env[envKey];

  if (!serviceUrl) {
    return res.status(404).json({ message: 'Service not found' });
  }

  try {
    // Proxy the request to the actual service
    const targetUrl = new URL(serviceUrl);
    const path = req.url?.replace(`/api/proxy/${serviceName}`, '') || '';
    const fullUrl = `${targetUrl.origin}${path}`;

    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host,
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    return res.send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ message: 'Proxy error' });
  }
}
