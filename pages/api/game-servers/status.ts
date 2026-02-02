import type { NextApiRequest, NextApiResponse } from 'next';

// Use require for gamedig to avoid TypeScript module resolution issues
const Gamedig = require('gamedig');
// Some versions of gamedig export the library as the default property when using CommonJS interop.
const GamedigLib = (Gamedig && (Gamedig as any).default) ? (Gamedig as any).default : Gamedig;

// Try to load a Bedrock-capable ping library (optional)
let msu: any = null;
try {
  msu = require('minecraft-server-util');
} catch (e) {
  msu = null;
}

// Helper to abstract over different gamedig export shapes
async function runGamedigQuery(opts: any) {
  const lib: any = GamedigLib;
  if (lib && typeof lib.query === 'function') return lib.query(opts);
  if (lib && typeof lib.Query === 'function') return lib.Query(opts);
  if (typeof lib === 'function') return lib(opts);
  if (lib && lib.default && typeof lib.default === 'function') return lib.default(opts);
  if (lib && lib.default && typeof lib.default.query === 'function') return lib.default.query(opts);
  // Support GameDig class export (new GameDig().query(...))
  if (lib && typeof lib.GameDig === 'function' && typeof lib.GameDig.prototype.query === 'function') {
    const inst = new lib.GameDig(opts);
    if (typeof inst.query === 'function') return inst.query(opts);
  }
  throw new Error('gamedig query not available');
}

interface ServerStatus {
  name: string;
  online: boolean;
  players?: number;
  maxPlayers?: number;
  ping?: number;
  error?: string;
}

import net from 'net';

function tcpPortCheck(host: string, port: number, timeout = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      resolved = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.once('error', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.connect(port, host);
  });
}

function extractNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
  if (typeof value === 'object') {
    // look for common numeric fields
    const candidates = ['online', 'max', 'maxPlayers', 'players', 'count', 'total', 'onlinePlayers'];
    for (const k of candidates) {
      if (k in value) {
        const v = extractNumber((value as any)[k]);
        if (v !== null) return v;
      }
    }
    // if object looks like {online: n, max: m} prefer online
    if ('online' in value && typeof value.online === 'number') return value.online;
    if ('max' in value && typeof value.max === 'number') return value.max;
  }
  return null;
}

function normalizeBedrockStatus(s: any) {
  // returns { players: number, maxPlayers: number }
  let players: number | null = null;
  let maxPlayers: number | null = null;

  // Common shapes
  players = extractNumber(s?.onlinePlayers ?? s?.players ?? s?.players?.online ?? s?.online ?? s?.playersCount ?? s?.players?.length);
  maxPlayers = extractNumber(s?.maxPlayers ?? s?.max ?? s?.players?.max ?? s?.maxPlayers?.max ?? s?.players?.length ?? s?.maxCount);

  // If still null, try scanning the root object for numeric values
  if (players === null) {
    for (const k of Object.keys(s || {})) {
      const v = extractNumber(s[k]);
      if (v !== null) { players = v; break; }
    }
  }
  if (maxPlayers === null) {
    // try other numeric in object
    const nums: number[] = [];
    for (const k of Object.keys(s || {})) {
      const v = extractNumber(s[k]);
      if (v !== null) nums.push(v);
    }
    if (nums.length >= 2) maxPlayers = nums[1];
    else if (nums.length === 1) maxPlayers = nums[0];
  }

  return { players: (players ?? 0), maxPlayers: (maxPlayers ?? 0) };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const TAILSCALE_IP = '100.93.141.73';

  const servers = [
    { name: 'minecraft-java', type: 'minecraft', port: 25565, useGamedig: true },
  { name: 'minecraft-bedrock', type: 'minecraft', port: 19132, useGamedig: true },
    { name: 'palworld', type: 'palworld', port: 8212, useGamedig: false }, // Uses REST API
    { name: 'valheim', type: 'valheim', port: 2456, useGamedig: true },
    { name: 'projectzomboid', type: 'projectzomboid', port: 16261, useGamedig: true }
  ];

  const results: { [key: string]: ServerStatus } = {};

  // Query all servers in parallel
  await Promise.all(
    servers.map(async (server) => {
      try {
        // Palworld uses REST API instead of standard game query protocol
        if (server.name === 'palworld') {
          // Add HTTP Basic Auth for Palworld REST API
          const username = 'admin';
          const password = 'Parsy_Br0s!!!';
          const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
          const response = await fetch(`http://${TAILSCALE_IP}:${server.port}/v1/api/info`, {
            signal: AbortSignal.timeout(3000),
            headers: {
              'Authorization': authHeader
            }
          });
          if (response.ok) {
            const data = await response.json();
            results[server.name] = {
              name: server.name,
              online: true,
              players: data.currentplayernum || 0,
              maxPlayers: data.servermaxplayernum || 32
            };
          } else {
            throw new Error('REST API returned error');
          }
        } else if (server.name === 'minecraft-bedrock') {
          // Bedrock uses a different protocol (UDP/RakNet). Prefer a Bedrock-aware library.
          if (msu) {
            try {
              // Prefer statusBedrock if available
              if (typeof msu.statusBedrock === 'function') {
                const s = await msu.statusBedrock(TAILSCALE_IP, server.port, { timeout: 3000 });
                const norm = normalizeBedrockStatus(s);
                results[server.name] = {
                  name: server.name,
                  online: true,
                  players: norm.players,
                  maxPlayers: norm.maxPlayers
                };
              } else if (typeof msu.status === 'function') {
                // Try generic status (some versions support Bedrock via options)
                const s = await msu.status(TAILSCALE_IP, server.port, { timeout: 3000 });
                const norm = normalizeBedrockStatus(s);
                results[server.name] = {
                  name: server.name,
                  online: true,
                  players: norm.players,
                  maxPlayers: norm.maxPlayers
                };
              } else {
                // No usable method, fallback to TCP check
                const up = await tcpPortCheck(TAILSCALE_IP, server.port, 2000);
                results[server.name] = { name: server.name, online: up };
              }
            } catch (e: any) {
              // Fallback to TCP check with the error noted
              const up = await tcpPortCheck(TAILSCALE_IP, server.port, 2000);
              results[server.name] = { name: server.name, online: up, error: e?.message || String(e) };
            }
          } else {
            // No Bedrock library available; fallback to TCP check
            const up = await tcpPortCheck(TAILSCALE_IP, server.port, 2000);
            results[server.name] = { name: server.name, online: up };
          }
        } else {
          // support multiple gamedig export shapes
          // Use slightly more tolerant timeouts for Minecraft Java (can be flaky over tailscale)
          const isJava = server.name === 'minecraft-java' || server.type === 'minecraft';
          const queryOptions = {
            type: server.type as any,
            host: TAILSCALE_IP,
            port: server.port,
            socketTimeout: isJava ? 5000 : 3000,
            attemptTimeout: isJava ? 5000 : 3000,
            maxAttempts: isJava ? 2 : 1,
            // enable SRV lookup for Minecraft Java
            enableSRV: true
          };

          try {
            const state = await runGamedigQuery(queryOptions);
            results[server.name] = {
              name: server.name,
              online: true,
              players: state.players?.length || 0,
              maxPlayers: state.maxplayers || 0,
              ping: state.ping
            };
          } catch (e: any) {
            // If gamedig isn't available or fails, fallback to a simple TCP port check
            const up = await tcpPortCheck(TAILSCALE_IP, server.port, 2000);
            results[server.name] = {
              name: server.name,
              online: up,
              error: e?.message || String(e)
            };
          }
        }
      } catch (error: any) {
        results[server.name] = {
          name: server.name,
          online: false,
          error: error.message
        };
      }
    })
  );

  return res.status(200).json(results);
}

