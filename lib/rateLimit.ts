import fs from 'fs';
import path from 'path';

interface RateLimitEntry {
  ip: string;
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const RATE_LIMIT_FILE = path.join(DATA_DIR, 'rate-limits.json');

// Configuration
const MAX_ATTEMPTS = 5; // Max attempts
const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour lockout after exceeding

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readRateLimits(): RateLimitEntry[] {
  ensureDataDir();
  if (!fs.existsSync(RATE_LIMIT_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(RATE_LIMIT_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : (parsed.limits || []);
  } catch (error) {
    return [];
  }
}

function writeRateLimits(limits: RateLimitEntry[]) {
  ensureDataDir();
  fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify({ limits }, null, 2));
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number; message?: string } {
  const now = Date.now();
  const limits = readRateLimits();

  // Clean up old entries (older than lockout duration)
  const cleanedLimits = limits.filter(entry => 
    now - entry.lastAttempt < LOCKOUT_DURATION
  );

  const entry = cleanedLimits.find(e => e.ip === ip);

  if (!entry) {
    // First attempt from this IP
    return { allowed: true };
  }

  // Check if still in lockout period
  if (entry.attempts >= MAX_ATTEMPTS) {
    const timeSinceLastAttempt = now - entry.lastAttempt;
    if (timeSinceLastAttempt < LOCKOUT_DURATION) {
      const retryAfter = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60);
      return {
        allowed: false,
        retryAfter,
        message: `Too many attempts. Please try again in ${retryAfter} minutes.`
      };
    } else {
      // Lockout expired, reset
      entry.attempts = 0;
      entry.firstAttempt = now;
    }
  }

  // Check if within time window
  const timeSinceFirst = now - entry.firstAttempt;
  if (timeSinceFirst > TIME_WINDOW) {
    // Time window expired, reset
    entry.attempts = 0;
    entry.firstAttempt = now;
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil(LOCKOUT_DURATION / 1000 / 60);
    return {
      allowed: false,
      retryAfter,
      message: `Too many attempts. Please try again in ${retryAfter} minutes.`
    };
  }

  return { allowed: true };
}

export function recordAttempt(ip: string) {
  const now = Date.now();
  const limits = readRateLimits();

  // Clean up old entries
  const cleanedLimits = limits.filter(entry => 
    now - entry.lastAttempt < LOCKOUT_DURATION
  );

  const entryIndex = cleanedLimits.findIndex(e => e.ip === ip);

  if (entryIndex === -1) {
    // New entry
    cleanedLimits.push({
      ip,
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now
    });
  } else {
    // Update existing entry
    const entry = cleanedLimits[entryIndex];
    
    // Reset if time window expired
    if (now - entry.firstAttempt > TIME_WINDOW) {
      entry.attempts = 1;
      entry.firstAttempt = now;
    } else {
      entry.attempts += 1;
    }
    
    entry.lastAttempt = now;
    cleanedLimits[entryIndex] = entry;
  }

  writeRateLimits(cleanedLimits);
}

export function getClientIP(req: any): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  const real = req.headers['x-real-ip'];
  const cloudflare = req.headers['cf-connecting-ip'];

  if (cloudflare) return cloudflare;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (real) return real;
  
  return req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}
