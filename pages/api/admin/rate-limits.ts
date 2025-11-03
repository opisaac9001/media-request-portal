import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface RateLimitEntry {
  ip: string;
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockedUntil?: number;
}

const RATE_LIMIT_FILE = path.join(process.cwd(), 'data', 'rate-limits.json');
const MAX_ATTEMPTS = 5; // Maximum attempts before blocking
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour block

function ensureRateLimitFile() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(RATE_LIMIT_FILE)) {
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify({ entries: [] }, null, 2));
  }
}

function getRateLimits(): RateLimitEntry[] {
  ensureRateLimitFile();
  const data = fs.readFileSync(RATE_LIMIT_FILE, 'utf-8');
  return JSON.parse(data).entries || [];
}

function saveRateLimits(entries: RateLimitEntry[]) {
  ensureRateLimitFile();
  // Clean up old entries (older than 24 hours)
  const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
  const cleaned = entries.filter(e => e.lastAttempt > dayAgo);
  fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify({ entries: cleaned }, null, 2));
}

function getClientIP(req: NextApiRequest): string {
  // Check various headers for real IP (considering proxies/Cloudflare)
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip'];
  
  if (cfConnectingIP && typeof cfConnectingIP === 'string') {
    return cfConnectingIP;
  }
  
  if (realIP && typeof realIP === 'string') {
    return realIP;
  }
  
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }
  
  return req.socket.remoteAddress || 'unknown';
}

export function checkRateLimit(req: NextApiRequest, res: NextApiResponse): boolean {
  const ip = getClientIP(req);
  const now = Date.now();
  
  let entries = getRateLimits();
  let entry = entries.find(e => e.ip === ip);
  
  // Check if currently blocked
  if (entry?.blocked && entry.blockedUntil) {
    if (now < entry.blockedUntil) {
      const remainingMinutes = Math.ceil((entry.blockedUntil - now) / 60000);
      res.status(429).json({
        success: false,
        message: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`,
        blocked: true,
        retryAfter: entry.blockedUntil,
      });
      return false;
    } else {
      // Block expired, reset entry
      entry.blocked = false;
      entry.blockedUntil = undefined;
      entry.attempts = 0;
    }
  }
  
  // Create or update entry
  if (!entry) {
    entry = {
      ip,
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false,
    };
    entries.push(entry);
  } else {
    // Reset if window expired
    if (now - entry.firstAttempt > WINDOW_MS) {
      entry.attempts = 1;
      entry.firstAttempt = now;
    } else {
      entry.attempts++;
    }
    entry.lastAttempt = now;
    
    // Check if should be blocked
    if (entry.attempts > MAX_ATTEMPTS) {
      entry.blocked = true;
      entry.blockedUntil = now + BLOCK_DURATION_MS;
      saveRateLimits(entries);
      
      const remainingMinutes = Math.ceil(BLOCK_DURATION_MS / 60000);
      res.status(429).json({
        success: false,
        message: `Too many failed attempts. Blocked for ${remainingMinutes} minutes.`,
        blocked: true,
        retryAfter: entry.blockedUntil,
      });
      return false;
    }
  }
  
  saveRateLimits(entries);
  return true;
}

export function recordFailedAttempt(req: NextApiRequest) {
  const ip = getClientIP(req);
  const now = Date.now();
  
  let entries = getRateLimits();
  let entry = entries.find(e => e.ip === ip);
  
  if (entry) {
    entry.lastAttempt = now;
    saveRateLimits(entries);
  }
}

export function resetRateLimit(req: NextApiRequest) {
  const ip = getClientIP(req);
  let entries = getRateLimits();
  entries = entries.filter(e => e.ip !== ip);
  saveRateLimits(entries);
}

// API endpoint to view rate limit stats (admin only)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin authentication
  const cookies = req.headers.cookie || '';
  const hasAdminSession = cookies.includes('admin_session=');

  if (!hasAdminSession) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const entries = getRateLimits();
    return res.status(200).json({
      success: true,
      entries: entries.map(e => ({
        ...e,
        ip: e.ip.substring(0, 10) + '...', // Partially mask IPs
      })),
    });
  } else if (req.method === 'DELETE') {
    // Clear all rate limits (emergency reset)
    saveRateLimits([]);
    return res.status(200).json({
      success: true,
      message: 'All rate limits cleared',
    });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
