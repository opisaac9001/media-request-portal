import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { isAdminAuthenticated } from '../../../lib/adminAuth';

// Paths to config files for each server
const configPaths = {
  palworld: path.resolve(process.cwd(), 'PalWorldSettings.ini'),
  'minecraft-java': path.resolve(process.cwd(), 'minecraft-java', 'server.properties'),
  'minecraft-bedrock': path.resolve(process.cwd(), 'minecraft-bedrock', 'server.properties'),
  valheim: path.resolve(process.cwd(), 'valheim', 'config.ini'),
  projectzomboid: path.resolve(process.cwd(), 'projectzomboid', 'server.ini')
};

// Per-server field schemas for stricter validation (keys -> expected type)
const serverSchemas: Record<string, Record<string, 'string' | 'number' | 'boolean'>> = {
  'minecraft-java': {
    'server-name': 'string',
    'max-players': 'number',
    'online-mode': 'boolean'
  },
  'minecraft-bedrock': {
    'server-name': 'string',
    'max-players': 'number'
  },
  valheim: {
    serverName: 'string',
    worldName: 'string',
    password: 'string'
  },
  projectzomboid: {
    PublicName: 'string',
    Password: 'string',
    MaxPlayers: 'number'
  }
};

function parsePalworldConfig(content: string) {
  // Simple parser for PalWorldSettings.ini
  const match = content.match(/OptionSettings=\(([^)]*)\)/);
  if (!match) return {};
  const pairs = match[1].split(',').map(s => s.trim());
  const result: any = {};
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    result[key] = value?.replace(/^"|"$/g, '');
  });
  return result;
}

function serializePalworldConfig(settings: any) {
  const pairs = Object.entries(settings).map(([k, v]) => `${k}=${typeof v === 'string' ? '"' + v + '"' : v}`);
  return `[/Script/Pal.PalGameWorldSettings]\nOptionSettings=(${pairs.join(',')})\n`;
}

// Helper functions for other servers
function parseMinecraftConfig(content: string) {
  const lines = content.split('\n');
  const result: any = {};
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      result[key.trim()] = value.trim();
    }
  });
  return result;
}

function serializeMinecraftConfig(settings: any) {
  return Object.entries(settings).map(([key, value]) => `${key}=${value}`).join('\n');
}

function parseValheimConfig(content: string) {
  const lines = content.split('\n');
  const result: any = {};
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      result[key.trim()] = value.trim();
    }
  });
  return result;
}

function serializeValheimConfig(settings: any) {
  return Object.entries(settings).map(([key, value]) => `${key}=${value}`).join('\n');
}

function parseProjectZomboidConfig(content: string) {
  const lines = content.split('\n');
  const result: any = {};
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      result[key.trim()] = value.trim();
    }
  });
  return result;
}

function serializeProjectZomboidConfig(settings: any) {
  return Object.entries(settings).map(([key, value]) => `${key}=${value}`).join('\n');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require admin authentication for both read and write
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // TODO: Add authentication check here
  if (req.method === 'GET') {
    const result: any = {};
    try {
      // Palworld
      if (fs.existsSync(configPaths.palworld)) {
        const palworldContent = fs.readFileSync(configPaths.palworld, 'utf-8');
        result.palworld = parsePalworldConfig(palworldContent);
      } else {
        console.warn('Palworld config not found at', configPaths.palworld);
        result.palworld = null;
      }

      // Minecraft Java
      if (fs.existsSync(configPaths['minecraft-java'])) {
        const minecraftJavaContent = fs.readFileSync(configPaths['minecraft-java'], 'utf-8');
        result['minecraft-java'] = parseMinecraftConfig(minecraftJavaContent);
      } else {
        console.warn('Minecraft Java config not found at', configPaths['minecraft-java']);
        result['minecraft-java'] = null;
      }

      // Minecraft Bedrock
      if (fs.existsSync(configPaths['minecraft-bedrock'])) {
        const minecraftBedrockContent = fs.readFileSync(configPaths['minecraft-bedrock'], 'utf-8');
        result['minecraft-bedrock'] = parseMinecraftConfig(minecraftBedrockContent);
      } else {
        console.warn('Minecraft Bedrock config not found at', configPaths['minecraft-bedrock']);
        result['minecraft-bedrock'] = null;
      }

      // Valheim
      if (fs.existsSync(configPaths.valheim)) {
        const valheimContent = fs.readFileSync(configPaths.valheim, 'utf-8');
        result.valheim = parseValheimConfig(valheimContent);
      } else {
        console.warn('Valheim config not found at', configPaths.valheim);
        result.valheim = null;
      }

      // Project Zomboid
      if (fs.existsSync(configPaths.projectzomboid)) {
        const projectZomboidContent = fs.readFileSync(configPaths.projectzomboid, 'utf-8');
        result.projectzomboid = parseProjectZomboidConfig(projectZomboidContent);
      } else {
        console.warn('Project Zomboid config not found at', configPaths.projectzomboid);
        result.projectzomboid = null;
      }

      res.status(200).json(result);
    } catch (e) {
      console.error('Error reading config files:', e);
      res.status(500).json({ error: 'Failed to read config files' });
    }
  } else if (req.method === 'POST') {
    try {
      const body = req.body;

      // Basic server-side validation and normalization
      const { valid, errors, normalized } = validateAndNormalize(body);
      if (!valid) {
        return res.status(400).json({ success: false, errors });
      }

      // Palworld
      if (normalized.palworld) {
        // ensure directory exists
        fs.mkdirSync(path.dirname(configPaths.palworld), { recursive: true });
        const palworldContent = serializePalworldConfig(normalized.palworld);
        fs.writeFileSync(configPaths.palworld, palworldContent, 'utf-8');
      }

      // Minecraft Java
      if (normalized['minecraft-java']) {
        fs.mkdirSync(path.dirname(configPaths['minecraft-java']), { recursive: true });
        const minecraftJavaContent = serializeMinecraftConfig(normalized['minecraft-java']);
        fs.writeFileSync(configPaths['minecraft-java'], minecraftJavaContent, 'utf-8');
      }

      // Minecraft Bedrock
      if (normalized['minecraft-bedrock']) {
        fs.mkdirSync(path.dirname(configPaths['minecraft-bedrock']), { recursive: true });
        const minecraftBedrockContent = serializeMinecraftConfig(normalized['minecraft-bedrock']);
        fs.writeFileSync(configPaths['minecraft-bedrock'], minecraftBedrockContent, 'utf-8');
      }

      // Valheim
      if (normalized.valheim) {
        fs.mkdirSync(path.dirname(configPaths.valheim), { recursive: true });
        const valheimContent = serializeValheimConfig(normalized.valheim);
        fs.writeFileSync(configPaths.valheim, valheimContent, 'utf-8');
      }

      // Project Zomboid
      if (normalized.projectzomboid) {
        fs.mkdirSync(path.dirname(configPaths.projectzomboid), { recursive: true });
        const projectZomboidContent = serializeProjectZomboidConfig(normalized.projectzomboid);
        fs.writeFileSync(configPaths.projectzomboid, projectZomboidContent, 'utf-8');
      }

      res.status(200).json({ success: true });
    } catch (e) {
      console.error('Error writing config files:', e);
      res.status(500).json({ error: 'Failed to write config files' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Validate and normalize incoming settings object
function validateAndNormalize(body: any): { valid: boolean; errors: string[]; normalized: any } {
  const errors: string[] = [];
  const normalized: any = {};

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid body'], normalized: {} };
  }

  Object.entries(body).forEach(([serverKey, fields]) => {
    if (!fields || typeof fields !== 'object') return;
    const schema = serverSchemas[serverKey];
    normalized[serverKey] = {} as any;
    Object.entries(fields as any).forEach(([k, v]) => {
      // basic sanitation: keys should be single-line strings
      if (typeof k !== 'string' || /[\n\r=]/.test(k)) {
        errors.push(`Invalid key for ${serverKey}: ${String(k)}`);
        return;
      }

      // If we have a schema for this server, enforce known keys/types
      if (schema) {
        if (!(k in schema)) {
          errors.push(`Unknown field for ${serverKey}: ${k}`);
          return;
        }
        const expected = schema[k];
        // coerce/validate based on expected type
        if (expected === 'number') {
          if (typeof v === 'number') {
            normalized[serverKey][k] = v;
            return;
          }
          if (typeof v === 'string' && /^[+-]?\d+(?:\.\d+)?$/.test(v.trim())) {
            normalized[serverKey][k] = Number(v.trim());
            return;
          }
          errors.push(`${serverKey}.${k} must be a number`);
          return;
        }
        if (expected === 'boolean') {
          if (typeof v === 'boolean') {
            normalized[serverKey][k] = v;
            return;
          }
          if (typeof v === 'string') {
            const t = v.trim().toLowerCase();
            if (t === 'true' || t === 'false') {
              normalized[serverKey][k] = t === 'true';
              return;
            }
          }
          errors.push(`${serverKey}.${k} must be a boolean`);
          return;
        }
        if (expected === 'string') {
          if (typeof v === 'string') {
            normalized[serverKey][k] = v.trim();
            return;
          }
          if (typeof v === 'number' || typeof v === 'boolean') {
            normalized[serverKey][k] = String(v);
            return;
          }
          errors.push(`${serverKey}.${k} must be a string`);
          return;
        }
      } else {
        // No strict schema (e.g., Palworld) - permissive but sanitize and normalize
        if (v === true || v === false) {
          normalized[serverKey][k] = v;
          return;
        }
        if (typeof v === 'string') {
          const t = v.trim();
          if (/^[+-]?\d+$/.test(t) || /^[+-]?\d+\.\d+$/.test(t)) {
            normalized[serverKey][k] = Number(t);
            return;
          }
          if (t === 'true') {
            normalized[serverKey][k] = true;
            return;
          }
          if (t === 'false') {
            normalized[serverKey][k] = false;
            return;
          }
          normalized[serverKey][k] = t;
          return;
        }
        if (typeof v === 'number') {
          normalized[serverKey][k] = v;
          return;
        }
        errors.push(`Unsupported value type for ${serverKey}.${k}`);
      }
    });
  });

  return { valid: errors.length === 0, errors, normalized };
}
