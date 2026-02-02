import type { NextApiRequest, NextApiResponse } from 'next';

interface MediaResponse {
  success: boolean;
  message: string;
}

async function addToRadarr(title: string, isKids: boolean = false, tmdbId?: number): Promise<MediaResponse> {
  try {
    const radarrApiKey = process.env.RADARR_API_KEY;
    const radarrBaseUrl = process.env.RADARR_BASE_URL;
    const rootFolder = isKids 
      ? (process.env.RADARR_KIDS_ROOT_FOLDER || '/kids-movies')
      : (process.env.RADARR_ROOT_FOLDER || '/movies');

    if (!radarrApiKey || !radarrBaseUrl) {
      return {
        success: false,
        message: `Radarr ${isKids ? 'Kids ' : ''}configuration is missing. Please contact the administrator.`,
      };
    }

    const headers = { 'X-Api-Key': radarrApiKey };

    let movie: any;

    // If we have a tmdbId, lookup by that for exact match
    if (tmdbId) {
      const lookupResponse = await fetch(
        `${radarrBaseUrl}/api/v3/movie/lookup/tmdb?tmdbId=${tmdbId}`,
        { headers }
      );

      if (lookupResponse.ok) {
        movie = await lookupResponse.json();
      }
    }

    // Fallback to title search if no tmdbId or lookup failed
    if (!movie) {
      const searchResponse = await fetch(
        `${radarrBaseUrl}/api/v3/movie/lookup?term=${encodeURIComponent(title)}`,
        { headers }
      );

      if (!searchResponse.ok) {
        throw new Error('Failed to search Radarr');
      }

      const results = await searchResponse.json();

      if (!results || results.length === 0) {
        return {
          success: false,
          message: `${isKids ? "Children's Movie" : 'Movie'} "${title}" not found in Radarr search.`,
        };
      }

      movie = results[0];
    }

    // Add the movie
    const addResponse = await fetch(`${radarrBaseUrl}/api/v3/movie`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: movie.title,
        qualityProfileId: 1, // Adjust based on your Radarr settings
        rootFolderPath: rootFolder,
        tmdbId: movie.tmdbId,
        monitored: true,
        addOptions: {
          monitor: 'movieOnly',
          searchForMovie: true,
        },
      }),
    });    if (!addResponse.ok) {
      const errorText = await addResponse.text();
      throw new Error(`Radarr API error: ${errorText}`);
    }

    return {
      success: true,
      message: `${isKids ? "Children's Movie" : 'Movie'} "${title}" added to Radarr successfully!`,
    };
  } catch (error) {
    console.error('Radarr error:', error);
    return {
      success: false,
      message: `Failed to add ${isKids ? "children's movie" : 'movie'} to Radarr: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function addToSonarr(title: string, contentType: 'tv_show' | 'anime' | 'adult_swim' | 'saturday_cartoons' = 'tv_show', tvdbId?: number): Promise<MediaResponse> {
  try {
    const sonarrApiKey = process.env.SONARR_API_KEY;
    const sonarrBaseUrl = process.env.SONARR_BASE_URL;
    const qualityProfile = parseInt(process.env.SONARR_QUALITY_PROFILE || '1', 10);
    const languageProfile = parseInt(process.env.SONARR_LANGUAGE_PROFILE || '1', 10);
    
    let rootFolder: string;
    let seriesType: string;
    let typeName: string;

    switch (contentType) {
      case 'anime':
        rootFolder = process.env.SONARR_ANIME_ROOT_FOLDER || '/anime';
        seriesType = 'anime';
        typeName = 'Anime';
        break;
      case 'adult_swim':
        rootFolder = process.env.SONARR_ADULT_SWIM_ROOT_FOLDER || '/adult-swim';
        seriesType = 'standard';
        typeName = 'Adult Swim Show';
        break;
      case 'saturday_cartoons':
        rootFolder = process.env.SONARR_CARTOONS_ROOT_FOLDER || '/saturday-cartoons';
        seriesType = 'standard';
        typeName = 'Saturday Morning Cartoon';
        break;
      default:
        rootFolder = process.env.SONARR_ROOT_FOLDER || '/tv';
        seriesType = 'standard';
        typeName = 'TV Show';
    }

    if (!sonarrApiKey || !sonarrBaseUrl) {
      return {
        success: false,
        message: `Sonarr configuration for ${typeName} is missing. Please contact the administrator.`,
      };
    }

    const headers = { 'X-Api-Key': sonarrApiKey };

    let series: any;

    // If we have a tvdbId, lookup by that for exact match
    if (tvdbId) {
      const lookupResponse = await fetch(
        `${sonarrBaseUrl}/api/v3/series/lookup?term=tvdb:${tvdbId}`,
        { headers }
      );

      if (lookupResponse.ok) {
        const results = await lookupResponse.json();
        if (results && results.length > 0) {
          series = results[0];
        }
      }
    }

    // Fallback to title search if no tvdbId or lookup failed
    if (!series) {
      const searchResponse = await fetch(
        `${sonarrBaseUrl}/api/v3/series/lookup?term=${encodeURIComponent(title)}`,
        { headers }
      );

      if (!searchResponse.ok) {
        throw new Error('Failed to search Sonarr');
      }

      const results = await searchResponse.json();

      if (!results || results.length === 0) {
        return {
          success: false,
          message: `${typeName} "${title}" not found in Sonarr search.`,
        };
      }

      series = results[0];
    }

    // Add the series with type-specific settings
    const addResponse = await fetch(`${sonarrBaseUrl}/api/v3/series`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: series.title,
        qualityProfileId: qualityProfile,
        languageProfileId: languageProfile,
        rootFolderPath: rootFolder,
        tvdbId: series.tvdbId,
        monitored: true,
        seriesType: seriesType,
        seasonFolder: true,
        addOptions: {
          monitor: 'all',
          searchForMissingEpisodes: true,
        },
      }),
    });

    if (!addResponse.ok) {
      const errorText = await addResponse.text();
      throw new Error(`Sonarr API error: ${errorText}`);
    }

    return {
      success: true,
      message: `${typeName} "${title}" added to Sonarr successfully!`,
    };
  } catch (error) {
    console.error('Sonarr error:', error);
    return {
      success: false,
      message: `Failed to add content to Sonarr: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { authorization_phrase, content_type, title, user_email, tmdbId, tvdbId } = req.body;

    // Check if user is logged in via session
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/user_session=([^;]+)/);
    let isAuthenticated = false;
    let username = '';

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
            username = session.username;
          }
        } catch (error) {
          // Session check failed, continue to authorization phrase check
        }
      }
    }

    // Validate authorization phrase (skip if logged in)
    if (!isAuthenticated && authorization_phrase !== process.env.AUTHORIZATION_PHRASE) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect authorization phrase.',
      });
    }

    // Validate required fields
    if (!content_type || !title) {
      return res.status(400).json({
        success: false,
        message: 'Content type and title are required.',
      });
    }

    let result: MediaResponse;

    if (content_type === 'movie') {
      result = await addToRadarr(title, false, tmdbId);
    } else if (content_type === 'kids_movie') {
      result = await addToRadarr(title, true, tmdbId);
    } else if (content_type === 'tv_show') {
      result = await addToSonarr(title, 'tv_show', tvdbId);
    } else if (content_type === 'anime') {
      result = await addToSonarr(title, 'anime', tvdbId);
    } else if (content_type === 'adult_swim') {
      result = await addToSonarr(title, 'adult_swim', tvdbId);
    } else if (content_type === 'saturday_cartoons') {
      result = await addToSonarr(title, 'saturday_cartoons', tvdbId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type.',
      });
    }

    // Log the request (optional - you could save to a database here)
    const requester = isAuthenticated ? `user: ${username}` : (user_email || 'anonymous');
    console.log(`Content request: ${content_type} - "${title}" from ${requester}`);

    return res.status(result.success ? 200 : 500).json(result);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}