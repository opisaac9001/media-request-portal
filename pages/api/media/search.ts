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

async function searchRadarr(query: string): Promise<{ results: MediaResult[]; error?: string }> {
  const radarrApiKey = process.env.RADARR_API_KEY;
  const radarrBaseUrl = process.env.RADARR_BASE_URL;

  if (!radarrApiKey || !radarrBaseUrl) {
    console.error('Radarr config missing - API_KEY:', !!radarrApiKey, 'BASE_URL:', !!radarrBaseUrl);
    return { results: [], error: 'Radarr is not configured' };
  }

  const url = `${radarrBaseUrl}/api/v3/movie/lookup?term=${encodeURIComponent(query)}`;
  console.log('Searching Radarr:', url);

  try {
    const response = await fetch(url, { 
      headers: { 'X-Api-Key': radarrApiKey },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Radarr search failed:', response.status, errorText);
      return { results: [], error: `Radarr error: ${response.status}` };
    }

    const results = await response.json();
    console.log('Radarr returned', results.length, 'results');
    
    return {
      results: results.slice(0, 10).map((movie: any) => ({
        id: movie.tmdbId,
        title: movie.title,
        year: movie.year || 0,
        overview: movie.overview || '',
        poster: movie.remotePoster || movie.images?.find((img: any) => img.coverType === 'poster')?.remoteUrl || null,
        type: 'movie' as const,
        tmdbId: movie.tmdbId,
        imdbId: movie.imdbId,
      }))
    };
  } catch (error) {
    console.error('Radarr search error:', error);
    return { results: [], error: `Radarr connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

async function searchSonarr(query: string): Promise<{ results: MediaResult[]; error?: string }> {
  const sonarrApiKey = process.env.SONARR_API_KEY;
  const sonarrBaseUrl = process.env.SONARR_BASE_URL;

  if (!sonarrApiKey || !sonarrBaseUrl) {
    console.error('Sonarr config missing - API_KEY:', !!sonarrApiKey, 'BASE_URL:', !!sonarrBaseUrl);
    return { results: [], error: 'Sonarr is not configured' };
  }

  const url = `${sonarrBaseUrl}/api/v3/series/lookup?term=${encodeURIComponent(query)}`;
  console.log('Searching Sonarr:', url);

  try {
    const response = await fetch(url, { 
      headers: { 'X-Api-Key': sonarrApiKey },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sonarr search failed:', response.status, errorText);
      return { results: [], error: `Sonarr error: ${response.status}` };
    }

    const results = await response.json();
    console.log('Sonarr returned', results.length, 'results');
    
    return {
      results: results.slice(0, 10).map((series: any) => ({
        id: series.tvdbId,
        title: series.title,
        year: series.year || 0,
        overview: series.overview || '',
        poster: series.remotePoster || series.images?.find((img: any) => img.coverType === 'poster')?.remoteUrl || null,
        type: 'series' as const,
        tvdbId: series.tvdbId,
        imdbId: series.imdbId,
      }))
    };
  } catch (error) {
    console.error('Sonarr search error:', error);
    return { results: [], error: `Sonarr connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
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
  let error: string | undefined;

  // Search based on content type
  if (type === 'movie' || type === 'kids_movie') {
    const radarrResult = await searchRadarr(query);
    results = radarrResult.results;
    error = radarrResult.error;
  } else if (type === 'tv_show' || type === 'anime' || type === 'adult_swim' || type === 'saturday_cartoons') {
    const sonarrResult = await searchSonarr(query);
    results = sonarrResult.results;
    error = sonarrResult.error;
  } else {
    // Search both if no type specified
    const [radarrResult, sonarrResult] = await Promise.all([
      searchRadarr(query),
      searchSonarr(query),
    ]);
    results = [...radarrResult.results, ...sonarrResult.results];
    if (radarrResult.error && sonarrResult.error) {
      error = `${radarrResult.error}; ${sonarrResult.error}`;
    }
  }

  if (results.length === 0 && error) {
    return res.status(200).json({ success: true, results: [], message: error });
  }

  return res.status(200).json({ success: true, results });
}
