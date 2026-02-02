import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import AnimatedBackground from '../../components/AnimatedBackground';
import AdminHeader from '../../components/AdminHeader';

const API_BASE = '/api/admin-proxy';

interface PlexUser {
  username: string;
  totalSessions: number;
  last24h: number;
  last7d: number;
  last30d: number;
  lastSeen: number | null;
  uniqueTitles: number;
  inactive: boolean;
}

interface PlexSession {
  title: string;
  user: string;
  state: string;
  type: string;
  transcodeStatus?: string;
  videoDecision?: string;
  audioDecision?: string;
}

interface PlexLibrary {
  key: string;
  title: string;
  type: string;
  agent: string;
  scanner: string;
  language: string;
  uuid: string;
  updatedAt: string;
  createdAt: string;
  scannedAt: string;
}

const PlexMonitor = () => {
  const router = useRouter();
  const [users, setUsers] = useState<PlexUser[]>([]);
  const [sessions, setSessions] = useState<PlexSession[]>([]);
  const [libraries, setLibraries] = useState<PlexLibrary[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activity' | 'libraries'>('dashboard');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/v1/plex/activity`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        if (data.error) {
          // Plex is unreachable but API returned gracefully
          setError(data.error);
        }
      }
    } catch (err) {
      console.error('Failed to load activity:', err);
      setError('Failed to load activity data');
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/plex/sessions`);
      const data = await res.json();
      if (data.success) {
        if (data.error) {
          // Plex unreachable, show empty sessions
          setSessions([]);
          setError(data.error);
        } else if (data.data?.MediaContainer?.Video) {
          const videos = Array.isArray(data.data.MediaContainer.Video) 
            ? data.data.MediaContainer.Video 
            : [data.data.MediaContainer.Video];
          
          setSessions(videos.map((v: any) => {
          // Extract primitive values from XML parsed objects
          const episodeTitle = v.$?.title || v.title || 'Unknown';
          const showTitle = v.$?.grandparentTitle || v.grandparentTitle || '';
          const seasonTitle = v.$?.parentTitle || v.parentTitle || '';
          
          // Build display title: "Show Name - S01E01 Episode Name" or just episode name for movies
          let displayTitle = episodeTitle;
          if (showTitle) {
            // For TV shows, show the series name and episode
            displayTitle = `${showTitle} - ${episodeTitle}`;
          }
          
          const userObj = v.User;
          const userName = userObj?.$?.title || userObj?.title || 'Unknown';
          const playerObj = v.Player;
          const playerState = playerObj?.$?.state || playerObj?.state || 'playing';
          const videoType = v.$?.type || v.type || 'video';
          
          // Extract transcoding information
          const partDecision = v.Media?.Part?.$?.decision || v.Media?.Part?.decision || 'unknown';
          const streams = v.Media?.Part?.Stream || [];
          const streamArray = Array.isArray(streams) ? streams : [streams];
          
          // Find video and audio stream decisions
          let videoDecision = 'unknown';
          let audioDecision = 'unknown';
          streamArray.forEach((s: any) => {
            const streamType = s?.$?.streamType || s?.streamType;
            const decision = s?.$?.decision || s?.decision;
            if (streamType === '1') videoDecision = decision; // Video stream
            if (streamType === '2') audioDecision = decision; // Audio stream
          });
          
          // Determine transcode status
          let transcodeStatus = 'Direct Play';
          if (videoDecision === 'transcode') {
            transcodeStatus = 'Video Transcode';
          } else if (audioDecision === 'transcode') {
            transcodeStatus = 'Audio Transcode';
          } else if (partDecision === 'copy' || videoDecision === 'copy') {
            transcodeStatus = 'Direct Stream';
          }
          
          return {
            title: String(displayTitle),
            user: String(userName),
            state: String(playerState),
            type: String(videoType),
            transcodeStatus: String(transcodeStatus),
            videoDecision: String(videoDecision),
            audioDecision: String(audioDecision)
          };
        }));
      } else {
        setSessions([]);
      }
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load sessions data');
      setSessions([]);
    }
  }, []);

  const loadLibraries = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/plex/libraries`);
      const data = await res.json();
      if (data.success) {
        if (data.error) {
          setLibraries([]);
          setError(data.error);
        } else {
          const sections = Array.isArray(data.sections) ? data.sections : [data.sections];
          // Extract the actual data from the $ property if it exists
          const normalized = sections.filter(Boolean).map((s: any) => {
            if (s.$) {
              return {
                key: s.$.key || '',
                title: s.$.title || 'Unknown',
                type: s.$.type || '',
                agent: s.$.agent || '',
                scanner: s.$.scanner || '',
                language: s.$.language || '',
                uuid: s.$.uuid || '',
                updatedAt: s.$.updatedAt || '',
                createdAt: s.$.createdAt || '',
                scannedAt: s.$.scannedAt || ''
              };
            }
            return s;
          });
          setLibraries(normalized);
        }
      }
    } catch (err) {
      console.error('Failed to load libraries:', err);
      setError('Failed to load libraries data');
      setLibraries([]);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/settings', {
          credentials: 'include',
        });
        const result = await response.json();
        if (result.authenticated === false) {
          router.push(`/admin/login?returnTo=${encodeURIComponent(router.asPath)}`);
          return;
        }
        setAuthenticated(true);
        // Load data after auth check passes
        await Promise.all([loadActivity(), loadSessions(), loadLibraries()]);
      } catch (error) {
        console.error('Auth check failed:', error);
        setError('Authentication failed');
        // Don't redirect on error, just show error state
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanLibrary = async (sectionId: string) => {
    try {
      setLoading(true);
      await fetch(`${API_BASE}/v1/plex/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId })
      });
      alert('Library scan started');
    } catch (err) {
      alert('Failed to start scan');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  useEffect(() => {
    if (!autoRefresh || !authenticated) return;
    const interval = setInterval(() => {
      loadActivity();
      loadSessions();
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, authenticated]);

  const activeUsers = users.filter(u => !u.inactive);
  const inactiveUsers = users.filter(u => u.inactive);

  if (!authenticated) {
    return (
      <Layout>
        <AnimatedBackground />
        <div style={{...styles.container, textAlign: 'center', paddingTop: '100px'}}>
          <div style={{fontSize: '2em'}}>🔒</div>
          <p>Checking authentication...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <AnimatedBackground />
        <div style={{...styles.container, textAlign: 'center', paddingTop: '100px'}}>
          <div style={{fontSize: '2em'}}>⚠️</div>
          <p style={{color: '#ef4444'}}>{error}</p>
          <button onClick={() => { loadActivity(); loadSessions(); loadLibraries(); setError(null); }} style={styles.refreshButton}>
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedBackground />
      <div style={styles.container}>
        <AdminHeader title="Plex Monitor" icon="📺" />

        {/* Auto-refresh controls */}
        <div style={styles.headerControls}>
          <label style={styles.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Auto-refresh (30s)
          </label>
          <button onClick={() => { loadActivity(); loadSessions(); }} style={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            style={{...styles.tab, ...(activeTab === 'dashboard' ? styles.activeTab : {})}}
          >
            📈 Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('activity')} 
            style={{...styles.tab, ...(activeTab === 'activity' ? styles.activeTab : {})}}
          >
            👥 User Activity
          </button>
          <button 
            onClick={() => setActiveTab('libraries')} 
            style={{...styles.tab, ...(activeTab === 'libraries' ? styles.activeTab : {})}}
          >
            📚 Libraries
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div style={styles.content}>
            <div style={styles.dashboardGrid}>
              <div style={styles.dashboardCard}>
                <div style={styles.dashboardIcon}>📺</div>
                <div style={styles.dashboardValue}>{sessions.length}</div>
                <div style={styles.dashboardLabel}>Active Streams</div>
              </div>
              <div style={styles.dashboardCard}>
                <div style={styles.dashboardIcon}>✅</div>
                <div style={styles.dashboardValue}>{activeUsers.length}</div>
                <div style={styles.dashboardLabel}>Active Users (30d)</div>
              </div>
              <div style={styles.dashboardCard}>
                <div style={styles.dashboardIcon}>⚠️</div>
                <div style={styles.dashboardValue}>{inactiveUsers.length}</div>
                <div style={styles.dashboardLabel}>Inactive Users</div>
              </div>
              <div style={styles.dashboardCard}>
                <div style={styles.dashboardIcon}>📁</div>
                <div style={styles.dashboardValue}>{libraries.length}</div>
                <div style={styles.dashboardLabel}>Libraries</div>
              </div>
            </div>

            {/* Current Sessions */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🎬 Current Sessions</h2>
              {sessions.length === 0 ? (
                <p style={styles.emptyState}>No active streams</p>
              ) : (
                <div style={styles.sessionsList}>
                  {sessions.map((session, idx) => {
                    const isVideoTranscode = session.transcodeStatus === 'Video Transcode';
                    const isAudioTranscode = session.transcodeStatus === 'Audio Transcode';
                    const transcodeColor = isVideoTranscode ? '#ff4444' : isAudioTranscode ? '#ffaa00' : '#00ff88';
                    const transcodeIcon = isVideoTranscode ? '⚠️' : isAudioTranscode ? '🔊' : '✓';
                    
                    return (
                      <div key={idx} style={styles.sessionCard}>
                        <div style={styles.sessionTitle}>{session.title}</div>
                        <div style={styles.sessionMeta}>
                          <span>👤 {session.user}</span>
                          <span>• {session.state}</span>
                          {session.transcodeStatus && (
                            <span style={{ color: transcodeColor, fontWeight: 'bold' }}>
                              • {transcodeIcon} {session.transcodeStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recently Active Users */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🔥 Recently Active</h2>
              <div style={styles.userGrid}>
                {activeUsers.slice(0, 8).map((user, idx) => (
                  <div key={idx} style={styles.userCard}>
                    <div style={styles.userName}>{user.username}</div>
                    <div style={styles.userStats}>
                      <span>Last seen: {formatTimeAgo(user.lastSeen)}</span>
                      <span>7d: {user.last7d} sessions</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div style={styles.content}>
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>✅ Active Users ({activeUsers.length})</h2>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Username</th>
                    <th style={styles.th}>Last Seen</th>
                    <th style={styles.th}>24h</th>
                    <th style={styles.th}>7d</th>
                    <th style={styles.th}>30d</th>
                    <th style={styles.th}>Unique Titles</th>
                  </tr>
                </thead>
                <tbody>
                  {activeUsers.map((user, idx) => (
                    <tr key={idx} style={styles.tr}>
                      <td style={styles.td}>{user.username}</td>
                      <td style={styles.td}>{formatTimeAgo(user.lastSeen)}</td>
                      <td style={styles.td}>{user.last24h}</td>
                      <td style={styles.td}>{user.last7d}</td>
                      <td style={styles.td}>{user.last30d}</td>
                      <td style={styles.td}>{user.uniqueTitles}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>⚠️ Inactive Users ({inactiveUsers.length})</h2>
              {inactiveUsers.length === 0 ? (
                <p style={styles.emptyState}>All users are active!</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Username</th>
                      <th style={styles.th}>Last Seen</th>
                      <th style={styles.th}>Total Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveUsers.map((user, idx) => (
                      <tr key={idx} style={styles.tr}>
                        <td style={styles.td}>{user.username}</td>
                        <td style={styles.td}>{formatDate(user.lastSeen)}</td>
                        <td style={styles.td}>{user.totalSessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Libraries Tab */}
        {activeTab === 'libraries' && (
          <div style={styles.content}>
            <div style={styles.librariesGrid}>
              {libraries.map((lib, idx) => (
                <div key={idx} style={styles.libraryCard}>
                  <div style={styles.libraryHeader}>
                    <div style={styles.libraryTitle}>{lib.title}</div>
                    <div style={styles.libraryType}>{lib.type}</div>
                  </div>
                  <div style={styles.libraryMeta}>
                    <div>Last scanned: {new Date(parseInt(lib.scannedAt) * 1000).toLocaleString()}</div>
                  </div>
                  <button 
                    onClick={() => scanLibrary(lib.key)} 
                    style={styles.scanButton}
                    disabled={loading}
                  >
                    🔄 Scan Library
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    position: 'relative' as const,
    zIndex: 1,
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
  },
  headerControls: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    marginBottom: '20px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '15px 20px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  autoRefreshLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  refreshButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600' as const,
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    padding: '15px',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600' as const,
    transition: 'all 0.3s ease',
  },
  activeTab: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  dashboardCard: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '30px',
    border: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center' as const,
  },
  dashboardIcon: {
    fontSize: '3rem',
    marginBottom: '15px',
  },
  dashboardValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: '10px',
  },
  dashboardLabel: {
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.7)',
  },
  section: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '25px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold' as const,
    marginBottom: '20px',
    color: 'white',
  },
  emptyState: {
    textAlign: 'center' as const,
    color: 'rgba(255,255,255,0.5)',
    padding: '40px',
    fontSize: '1.1rem',
  },
  sessionsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px',
  },
  sessionCard: {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '15px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  sessionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600' as const,
    color: 'white',
    marginBottom: '8px',
  },
  sessionMeta: {
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.6)',
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    gap: '10px',
  },
  userGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
  },
  userCard: {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '15px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  userName: {
    fontSize: '1.1rem',
    fontWeight: '600' as const,
    color: 'white',
    marginBottom: '8px',
  },
  userStats: {
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.6)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px',
    borderBottom: '2px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600' as const,
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  td: {
    padding: '12px',
    color: 'rgba(255,255,255,0.8)',
  },
  librariesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  libraryCard: {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  libraryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  libraryTitle: {
    fontSize: '1.2rem',
    fontWeight: '600' as const,
    color: 'white',
  },
  libraryType: {
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase' as const,
    background: 'rgba(255,255,255,0.1)',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  libraryMeta: {
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '15px',
  },
  scanButton: {
    width: '100%',
    padding: '10px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600' as const,
  },
};

export default PlexMonitor;
