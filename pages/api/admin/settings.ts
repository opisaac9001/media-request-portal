import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Helper function to check authentication
function isAuthenticated(req: NextApiRequest): boolean {
  const cookies = req.cookies;
  console.log('Checking auth, cookies:', cookies);
  const hasSession = !!cookies.admin_session;
  console.log('Has admin_session:', hasSession);
  return hasSession;
}

// Helper function to read .env.local
function readEnvFile(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env.local');
  const env: Record<string, string> = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  }

  return env;
}

// Helper function to write .env.local
function writeEnvFile(settings: Record<string, string>): void {
  const envPath = path.join(process.cwd(), '.env.local');
  
  let content = '# Authorization Phrase - Change this to your secret phrase\n';
  content += `AUTHORIZATION_PHRASE=${settings.authorizationPhrase}\n\n`;
  
  content += '# Admin Credentials\n';
  content += `ADMIN_USERNAME=${settings.adminUsername || process.env.ADMIN_USERNAME || 'admin'}\n`;
  content += `ADMIN_PASSWORD=${settings.adminPassword || process.env.ADMIN_PASSWORD || 'admin123'}\n\n`;
  
  content += '# Plex Configuration\n';
  content += `PLEX_BASE_URL=${settings.plexBaseUrl}\n`;
  content += `PLEX_TOKEN=${settings.plexToken}\n`;
  content += `PLEX_LIBRARY_IDS=${settings.plexLibraryIds || ''}\n\n`;
  
  content += '# Radarr Configuration (Movies)\n';
  content += `RADARR_BASE_URL=${settings.radarrBaseUrl}\n`;
  content += `RADARR_API_KEY=${settings.radarrApiKey}\n`;
  content += `RADARR_ROOT_FOLDER=${settings.radarrRootFolder}\n\n`;
  
  content += '# Radarr Root Folders (uses same instance, different folders)\n';
  content += `RADARR_KIDS_ROOT_FOLDER=${settings.radarrKidsRootFolder}\n\n`;
  
  content += '# Sonarr Configuration (TV Shows)\n';
  content += `SONARR_BASE_URL=${settings.sonarrBaseUrl}\n`;
  content += `SONARR_API_KEY=${settings.sonarrApiKey}\n`;
  content += `SONARR_QUALITY_PROFILE=${settings.sonarrQualityProfile}\n`;
  content += `SONARR_LANGUAGE_PROFILE=${settings.sonarrLanguageProfile}\n\n`;
  
  content += '# Sonarr Root Folders (uses same instance, different folders)\n';
  content += '# Anime will use "anime" series type with absolute numbering\n';
  content += `SONARR_ROOT_FOLDER=${settings.sonarrRootFolder}\n`;
  content += `SONARR_ANIME_ROOT_FOLDER=${settings.sonarrAnimeRootFolder}\n`;
  content += `SONARR_ADULT_SWIM_ROOT_FOLDER=${settings.sonarrAdultSwimRootFolder}\n`;
  content += `SONARR_CARTOONS_ROOT_FOLDER=${settings.sonarrCartoonsRootFolder}\n`;

  fs.writeFileSync(envPath, content, 'utf-8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      authenticated: false,
      message: 'Not authenticated',
    });
  }

  if (req.method === 'GET') {
    // Return current settings
    const env = readEnvFile();
    
    return res.status(200).json({
      authenticated: true,
      settings: {
        authorizationPhrase: env.AUTHORIZATION_PHRASE || '',
        plexBaseUrl: env.PLEX_BASE_URL || '',
        plexToken: env.PLEX_TOKEN || '',
        plexLibraryIds: env.PLEX_LIBRARY_IDS || '',
        radarrBaseUrl: env.RADARR_BASE_URL || '',
        radarrApiKey: env.RADARR_API_KEY || '',
        radarrRootFolder: env.RADARR_ROOT_FOLDER || '/movies',
        radarrKidsRootFolder: env.RADARR_KIDS_ROOT_FOLDER || '/kids-movies',
        sonarrBaseUrl: env.SONARR_BASE_URL || '',
        sonarrApiKey: env.SONARR_API_KEY || '',
        sonarrRootFolder: env.SONARR_ROOT_FOLDER || '/tv',
        sonarrAnimeRootFolder: env.SONARR_ANIME_ROOT_FOLDER || '/anime',
        sonarrAdultSwimRootFolder: env.SONARR_ADULT_SWIM_ROOT_FOLDER || '/adult-swim',
        sonarrCartoonsRootFolder: env.SONARR_CARTOONS_ROOT_FOLDER || '/saturday-cartoons',
        sonarrQualityProfile: env.SONARR_QUALITY_PROFILE || '1',
        sonarrLanguageProfile: env.SONARR_LANGUAGE_PROFILE || '1',
      },
    });
  } else if (req.method === 'POST') {
    // Save settings
    const settings = req.body;

    try {
      writeEnvFile(settings);
      
      // Update process.env for immediate effect (requires restart in production)
      process.env.AUTHORIZATION_PHRASE = settings.authorizationPhrase;
      process.env.PLEX_BASE_URL = settings.plexBaseUrl;
      process.env.PLEX_TOKEN = settings.plexToken;
      process.env.PLEX_LIBRARY_IDS = settings.plexLibraryIds;
      process.env.RADARR_BASE_URL = settings.radarrBaseUrl;
      process.env.RADARR_API_KEY = settings.radarrApiKey;
      process.env.RADARR_ROOT_FOLDER = settings.radarrRootFolder;
      process.env.RADARR_KIDS_ROOT_FOLDER = settings.radarrKidsRootFolder;
      process.env.SONARR_BASE_URL = settings.sonarrBaseUrl;
      process.env.SONARR_API_KEY = settings.sonarrApiKey;
      process.env.SONARR_ROOT_FOLDER = settings.sonarrRootFolder;
      process.env.SONARR_ANIME_ROOT_FOLDER = settings.sonarrAnimeRootFolder;
      process.env.SONARR_ADULT_SWIM_ROOT_FOLDER = settings.sonarrAdultSwimRootFolder;
      process.env.SONARR_CARTOONS_ROOT_FOLDER = settings.sonarrCartoonsRootFolder;
      process.env.SONARR_QUALITY_PROFILE = settings.sonarrQualityProfile;
      process.env.SONARR_LANGUAGE_PROFILE = settings.sonarrLanguageProfile;

      return res.status(200).json({
        success: true,
        message: 'Settings saved successfully',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save settings',
      });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
