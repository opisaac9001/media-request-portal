import type { NextApiRequest, NextApiResponse } from 'next';

interface MediaResult {
  id: number;
  title: string;
  year: number;
  overview: string;
  poster: string | null;
  type: 'movie' | 'series';
  tmdbId?: number;
  tvdbId?: number;
  imdbId?: string;
}

interface SearchResponse {
  success: boolean;
  results?: MediaResult[];
  message?: string;
}

async function searchRadarr(query: string): Promise<MediaResult[]> {
  const radarrApiKey = process.env.RADARR_API_KEY;
  const radarrBaseUrl = process.env.RADARR_BASE_URL;

  if (!radarrApiKey || !radarrBaseUrl) {
    return [];
  }

  try {
    const response = await fetch(
      `${radarrBaseUrl}/api/v3/movie/lookup?term=${encodeURIComponent(query)}`,
      { headers: { 'X-Api-Key': radarrApiKey } }
    );

    if (!response.ok) {
      console.error('Radarr search failed:', response.status);
      return [];
    }

    const results = await response.json();
    
    return results.slice(0, 10).map((movie: any) => ({
      id: movie.tmdbId,
      title: movie.title,
      year: movie.year || 0,
      overview: movie.overview || '',
      poster: movie.remotePoster || movie.images?.find((img: any) => img.coverType === 'poster')?.remoteUrl || null,
      type: 'movie' as const,
      tmdbId: movie.tmdbId,
      imdbId: movie.imdbId,
    }));
  } catch (error) {
    console.error('Radarr search error:', error);
    return [];
  }
}

async function searchSonarr(query: string): Promise<MediaResult[]> {
  const sonarrApiKey = process.env.SONARR_API_KEY;
  const sonarrBaseUrl = process.env.SONARR_BASE_URL;

  if (!sonarrApiKey || !sonarrBaseUrl) {
    return [];
  }

  try {
    const response = await fetch(
      `${sonarrBaseUrl}/api/v3/series/lookup?term=${encodeURIComponent(query)}`,
      { headers: { 'X-Api-Key': sonarrApiKey } }
    );

    if (!response.ok) {
      console.error('Sonarr search failed:', response.status);
      return [];
    }

    const results = await response.json();
    
    return results.slice(0, 10).map((series: any) => ({
      id: series.tvdbId,
      title: series.title,
      year: series.year || 0,
      overview: series.overview || '',
      poster: series.remotePoster || series.images?.find((img: any) => img.coverType === 'poster')?.remoteUrl || null,
      type: 'series' as const,
      tvdbId: series.tvdbId,
      imdbId: series.imdbId,
    }));
  } catch (error) {
    console.error('Sonarr search error:', error);
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SearchResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { query, type } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, message: 'Query parameter is required' });
  }

  if (query.length < 2) {
    return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
  }

  // Check authentication
  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/user_session=([^;]+)/);
  let isAuthenticated = false;

  if (sessionMatch) {
    const fs = require('fs');
    const path = require('path');
    const sessionFile = path.join(process.cwd(), 'data', 'sessions.json');
    
    if (fs.existsSync(sessionFile)) {
      try {
        const sessions = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
        const session = sessions[sessionMatch[1]];
        if (session) {
          isAuthenticated = true;
        }
      } catch (error) {
        // Session check failed
      }
    }
  }

  if (!isAuthenticated) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  let results: MediaResult[] = [];

  // Search based on content type
  if (type === 'movie' || type === 'kids_movie') {
    results = await searchRadarr(query);
  } else if (type === 'tv_show' || type === 'anime' || type === 'adult_swim' || type === 'saturday_cartoons') {
    results = await searchSonarr(query);
  } else {
    // Search both if no type specified
    const [movies, series] = await Promise.all([
      searchRadarr(query),
      searchSonarr(query),
    ]);
    results = [...movies, ...series];
  }

  return res.status(200).json({ success: true, results });
}
