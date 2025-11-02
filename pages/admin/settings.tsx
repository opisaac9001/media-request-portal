import type { NextPage } from 'next';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';

interface Settings {
  authorizationPhrase: string;
  plexBaseUrl: string;
  plexToken: string;
  plexLibraryIds: string;
  radarrBaseUrl: string;
  radarrApiKey: string;
  radarrRootFolder: string;
  radarrKidsRootFolder: string;
  sonarrBaseUrl: string;
  sonarrApiKey: string;
  sonarrRootFolder: string;
  sonarrAnimeRootFolder: string;
  sonarrAdultSwimRootFolder: string;
  sonarrCartoonsRootFolder: string;
  sonarrQualityProfile: string;
  sonarrLanguageProfile: string;
}

interface PlexLibrary {
  key: string;
  title: string;
  type: string;
}

const AdminSettings: NextPage = () => {
  const [settings, setSettings] = useState<Settings>({
    authorizationPhrase: '',
    plexBaseUrl: '',
    plexToken: '',
    plexLibraryIds: '',
    radarrBaseUrl: '',
    radarrApiKey: '',
    radarrRootFolder: '/movies',
    radarrKidsRootFolder: '/kids-movies',
    sonarrBaseUrl: '',
    sonarrApiKey: '',
    sonarrRootFolder: '/tv',
    sonarrAnimeRootFolder: '/anime',
    sonarrAdultSwimRootFolder: '/adult-swim',
    sonarrCartoonsRootFolder: '/saturday-cartoons',
    sonarrQualityProfile: '1',
    sonarrLanguageProfile: '1',
  });
  const [plexLibraries, setPlexLibraries] = useState<PlexLibrary[]>([]);
  const [isLoadingLibraries, setIsLoadingLibraries] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated and load settings
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const result = await response.json();

        if (result.authenticated === false) {
          router.push('/admin/login');
          return;
        }

        if (result.settings) {
          setSettings(result.settings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        setMessageType('success');
        setMessage('Settings saved successfully!');
      } else {
        setMessageType('error');
        setMessage(result.message || 'Failed to save settings');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const loadPlexLibraries = async () => {
    if (!settings.plexBaseUrl || !settings.plexToken) {
      setMessageType('error');
      setMessage('Please enter Plex Base URL and Token first, then save settings.');
      return;
    }

    setIsLoadingLibraries(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/admin/plex-libraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plexBaseUrl: settings.plexBaseUrl,
          plexToken: settings.plexToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPlexLibraries(result.libraries);
        setMessageType('success');
        setMessage('Loaded Plex libraries successfully!');
      } else {
        setMessageType('error');
        setMessage(result.message || 'Failed to load libraries');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Failed to connect to Plex. Check your URL and token.');
    } finally {
      setIsLoadingLibraries(false);
    }
  };

  const toggleLibrary = (libraryKey: string) => {
    const currentIds = settings.plexLibraryIds ? settings.plexLibraryIds.split(',') : [];
    const index = currentIds.indexOf(libraryKey);

    if (index > -1) {
      currentIds.splice(index, 1);
    } else {
      currentIds.push(libraryKey);
    }

    setSettings({ ...settings, plexLibraryIds: currentIds.filter(id => id).join(',') });
  };

  const isLibrarySelected = (libraryKey: string): boolean => {
    if (!settings.plexLibraryIds) return false;
    return settings.plexLibraryIds.split(',').includes(libraryKey);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <h1>Admin Settings</h1>
        <p>Configure your Plex, Sonarr, and Radarr integration settings below.</p>

        {message && (
          <ul className="flashes">
            <li className={messageType}>{message}</li>
          </ul>
        )}

        <form onSubmit={handleSubmit}>
          <h2 style={{ color: '#61dafb', marginTop: '20px' }}>General Settings</h2>
          
          <label htmlFor="authorizationPhrase">Authorization Phrase:</label>
          <input
            type="text"
            id="authorizationPhrase"
            value={settings.authorizationPhrase}
            onChange={(e) => setSettings({ ...settings, authorizationPhrase: e.target.value })}
            required
            disabled={isSubmitting}
            placeholder="Your secret phrase for users"
          />

          <h2 style={{ color: '#61dafb', marginTop: '30px' }}>Plex Configuration</h2>
          
          <label htmlFor="plexBaseUrl">Plex Base URL:</label>
          <input
            type="text"
            id="plexBaseUrl"
            value={settings.plexBaseUrl}
            onChange={(e) => setSettings({ ...settings, plexBaseUrl: e.target.value })}
            required
            disabled={isSubmitting}
            placeholder="http://192.168.1.100:32400"
          />

          <label htmlFor="plexToken">Plex Token:</label>
          <input
            type="password"
            id="plexToken"
            value={settings.plexToken}
            onChange={(e) => setSettings({ ...settings, plexToken: e.target.value })}
            required
            disabled={isSubmitting}
            placeholder="Your Plex X-Plex-Token"
          />
          <small style={{ color: '#bbb', fontSize: '0.9em' }}>
            Get your token from: <a href="https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/" target="_blank" rel="noopener noreferrer" style={{ color: '#61dafb' }}>Plex Support</a>
          </small>

          <div style={{ marginTop: '20px' }}>
            <button 
              type="button" 
              onClick={loadPlexLibraries} 
              className="btn" 
              disabled={isLoadingLibraries || isSubmitting}
              style={{ backgroundColor: '#4fa3d1', marginBottom: '15px' }}
            >
              {isLoadingLibraries ? 'Loading Libraries...' : 'Load Plex Libraries'}
            </button>
          </div>

          {plexLibraries.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <label>Select Libraries to Share (leave all unchecked to share all):</label>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plexLibraries.map((library) => (
                  <label key={library.key} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#e0e0e0' }}>
                    <input
                      type="checkbox"
                      checked={isLibrarySelected(library.key)}
                      onChange={() => toggleLibrary(library.key)}
                      disabled={isSubmitting}
                      style={{ marginRight: '10px', cursor: 'pointer' }}
                    />
                    <span>{library.title} ({library.type})</span>
                  </label>
                ))}
              </div>
              <small style={{ color: '#bbb', fontSize: '0.9em', display: 'block', marginTop: '10px' }}>
                Selected IDs: {settings.plexLibraryIds || 'All libraries (default)'}
              </small>
            </div>
          )}

          <h2 style={{ color: '#61dafb', marginTop: '30px' }}>Radarr Configuration (Movies)</h2>
          
          <label htmlFor="radarrBaseUrl">Radarr Base URL:</label>
          <input
            type="text"
            id="radarrBaseUrl"
            value={settings.radarrBaseUrl}
            onChange={(e) => setSettings({ ...settings, radarrBaseUrl: e.target.value })}
            required
            disabled={isSubmitting}
            placeholder="http://192.168.1.100:7878"
          />

          <label htmlFor="radarrApiKey">Radarr API Key:</label>
          <input
            type="password"
            id="radarrApiKey"
            value={settings.radarrApiKey}
            onChange={(e) => setSettings({ ...settings, radarrApiKey: e.target.value })}
            required
            disabled={isSubmitting}
            placeholder="Found in Radarr Settings → General"
          />

          <label htmlFor="radarrRootFolder">Radarr Root Folder:</label>
          <input
            type="text"
            id="radarrRootFolder"
            value={settings.radarrRootFolder}
            onChange={(e) => setSettings({ ...settings, radarrRootFolder: e.target.value })}
            required
            disabled={isSubmitting}
            placeholder="/movies"
          />

          <label htmlFor="radarrKidsRootFolder">Radarr Kids Root Folder:</label>
          <input
            type="text"
            id="radarrKidsRootFolder"
            value={settings.radarrKidsRootFolder}
            onChange={(e) => setSettings({ ...settings, radarrKidsRootFolder: e.target.value })}
            disabled={isSubmitting}
            placeholder="/kids-movies"
          />
          <p style={{ color: '#888', fontSize: '0.85em', marginTop: '-10px' }}>
            Uses the same Radarr instance, just saves to a different folder
          </p>

          <h2 style={{ color: '#61dafb', marginTop: '30px' }}>Sonarr Configuration (TV Shows)</h2>
          
          <label htmlFor="sonarrBaseUrl">Sonarr Base URL:</label>
          <input
            type="text"
            id="sonarrBaseUrl"
            value={settings.sonarrBaseUrl}
            onChange={(e) => setSettings({ ...settings, sonarrBaseUrl: e.target.value })}
            required
            disabled={isSubmitting}
            placeholder="http://192.168.1.100:8989"
          />

          <label htmlFor="sonarrApiKey">Sonarr API Key:</label>
          <input
            type="password"
            id="sonarrApiKey"
            value={settings.sonarrApiKey}
            onChange={(e) => setSettings({ ...settings, sonarrApiKey: e.target.value })}
            required
            disabled={isSubmitting}
            placeholder="Found in Sonarr Settings → General"
          />

          <label htmlFor="sonarrRootFolder">Sonarr Root Folder:</label>
          <input
            type="text"
            id="sonarrRootFolder"
            value={settings.sonarrRootFolder}
            onChange={(e) => setSettings({ ...settings, sonarrRootFolder: e.target.value })}
            required
            disabled={isSubmitting}
            placeholder="/tv"
          />

          <label htmlFor="sonarrQualityProfile">Sonarr Quality Profile ID:</label>
          <input
            type="text"
            id="sonarrQualityProfile"
            value={settings.sonarrQualityProfile}
            onChange={(e) => setSettings({ ...settings, sonarrQualityProfile: e.target.value })}
            required
            disabled={isSubmitting}
            placeholder="1"
          />
          <p style={{ color: '#888', fontSize: '0.85em', marginTop: '-10px' }}>
            Find this in Sonarr → Settings → Profiles → Quality Profiles
          </p>

          <label htmlFor="sonarrLanguageProfile">Sonarr Language Profile ID:</label>
          <input
            type="text"
            id="sonarrLanguageProfile"
            value={settings.sonarrLanguageProfile}
            onChange={(e) => setSettings({ ...settings, sonarrLanguageProfile: e.target.value })}
            required
            disabled={isSubmitting}
            placeholder="1"
          />
          <p style={{ color: '#888', fontSize: '0.85em', marginTop: '-10px' }}>
            Find this in Sonarr → Settings → Profiles → Language Profiles
          </p>

          <h2 style={{ color: '#61dafb', marginTop: '30px' }}>Content Type Root Folders</h2>
          <p style={{ color: '#bbb', fontSize: '0.9em' }}>
            All use the same Sonarr instance above - these just specify different storage folders. Anime will use absolute numbering.
          </p>

          <label htmlFor="sonarrAnimeRootFolder">Anime Root Folder:</label>
          <input
            type="text"
            id="sonarrAnimeRootFolder"
            value={settings.sonarrAnimeRootFolder}
            onChange={(e) => setSettings({ ...settings, sonarrAnimeRootFolder: e.target.value })}
            disabled={isSubmitting}
            placeholder="/anime"
          />

          <label htmlFor="sonarrAdultSwimRootFolder">Adult Swim Root Folder:</label>
          <input
            type="text"
            id="sonarrAdultSwimRootFolder"
            value={settings.sonarrAdultSwimRootFolder}
            onChange={(e) => setSettings({ ...settings, sonarrAdultSwimRootFolder: e.target.value })}
            disabled={isSubmitting}
            placeholder="/adult-swim"
          />

          <label htmlFor="sonarrCartoonsRootFolder">Saturday Morning Cartoons Root Folder:</label>
          <input
            type="text"
            id="sonarrCartoonsRootFolder"
            value={settings.sonarrCartoonsRootFolder}
            onChange={(e) => setSettings({ ...settings, sonarrCartoonsRootFolder: e.target.value })}
            disabled={isSubmitting}
            placeholder="/saturday-cartoons"
          />

          <button type="submit" className="btn" disabled={isSubmitting} style={{ marginTop: '20px' }}>
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </form>

        <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={handleLogout} className="btn" style={{ backgroundColor: '#dc3545' }}>
            Logout
          </button>
          <Link href="/" className="btn">
            Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default AdminSettings;
