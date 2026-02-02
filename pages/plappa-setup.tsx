import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

interface SetupInfo {
  user: {
    username: string;
    email: string;
  };
  audiobookshelf: {
    url: string;
  };
}

const MobileAppSetup: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [setupInfo, setSetupInfo] = useState<SetupInfo | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/mobile-app-setup', {
        credentials: 'include', // Important: include cookies
      });
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        console.log('Not authenticated, redirecting to login');
        router.push('/login?redirect=/plappa-setup');
        return;
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.success) {
        setSetupInfo(data);
      } else {
        console.log('API returned success=false, redirecting to login');
        router.push('/login?redirect=/plappa-setup');
      }
    } catch (err) {
      console.error('Error in checkAuth:', err);
      setError('Failed to load setup information');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.container}>
          <div style={styles.loadingBox}>
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !setupInfo) {
    return (
      <Layout>
        <div style={styles.container}>
          <div style={styles.errorBox}>
            <p>{error || 'Failed to load setup information'}</p>
            <button onClick={() => router.push('/')} style={styles.button}>
              Go Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Top corner user display */}
      {setupInfo && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          padding: '10px 16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}>
          <span style={{ 
            color: '#fff', 
            fontWeight: 600,
            fontSize: '14px',
          }}>
            {setupInfo.user.username}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              background: 'rgba(244, 67, 54, 0.8)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(244, 67, 54, 1)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(244, 67, 54, 0.8)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Logout
          </button>
        </div>
      )}
      
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => router.push('/')} style={styles.backButton}>
            ← Back to Portal
          </button>
        </div>

        <div style={styles.card}>
          <h1 style={styles.title}>📱 Mobile App Setup Guide</h1>
          <p style={styles.subtitle}>
            Complete guide to accessing your Plex media library on mobile devices
          </p>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Your Plex Login Information</h2>
            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.label}>Username:</span>
                <span style={styles.value}>{setupInfo.user.username}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(setupInfo.user.username)}
                  style={styles.copyButton}
                >
                  Copy
                </button>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Email:</span>
                <span style={styles.value}>{setupInfo.user.email}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(setupInfo.user.email)}
                  style={styles.copyButton}
                >
                  Copy
                </button>
              </div>
            </div>
            <p style={styles.noteText}>
              💡 Use these credentials to sign in to Plex on any app below
            </p>
          </div>

          <div style={{...styles.section, background: '#fff3cd', padding: '20px', borderRadius: '12px', border: '2px solid #ffc107'}}>
            <h2 style={{...styles.sectionTitle, color: '#856404', fontSize: '20px', marginBottom: '12px'}}>
              ⚠️ Important: Plex Mobile Streaming
            </h2>
            <p style={{color: '#856404', lineHeight: '1.6', marginBottom: '12px'}}>
              The official <strong>Plex app for Movies & TV Shows</strong> requires a <strong>one-time $4.99 payment</strong> to enable mobile streaming.
            </p>
            <p style={{color: '#856404', lineHeight: '1.6', marginBottom: '12px'}}>
              <strong>Free Alternative:</strong> You can bypass this by using <strong>app.plex.tv</strong> in your mobile browser instead. 
              However, the browser experience is less convenient than the app.
            </p>
            <p style={{color: '#856404', lineHeight: '1.6', marginBottom: 0}}>
              💡 <strong>Recommendation:</strong> If you plan to watch movies/TV on mobile frequently, the $4.99 app is worth it for the much better experience.
            </p>
          </div>

          <div style={styles.recommendedBox}>
            <div style={styles.recommendedBadge}>🎬 MOVIES & TV SHOWS</div>
            <h2 style={styles.sectionTitle}>Plex - Official App</h2>
            <p style={styles.description}>
              The official Plex app for streaming movies and TV shows. Free to download, but requires a one-time $4.99 
              in-app purchase to enable mobile streaming. Desktop and web access are always free.
            </p>
            <div style={styles.links}>
              <a
                href="https://apps.apple.com/app/plex/id383457673"
                target="_blank"
                rel="noopener noreferrer"
                style={{...styles.link, background: '#e5a00d'}}
              >
                📱 Plex - iOS (Free Download, $4.99 to stream)
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.plexapp.android"
                target="_blank"
                rel="noopener noreferrer"
                style={{...styles.link, background: '#e5a00d'}}
              >
                📱 Plex - Android (Free Download, $4.99 to stream)
              </a>
              <a
                href="https://app.plex.tv"
                target="_blank"
                rel="noopener noreferrer"
                style={{...styles.link, background: '#22c55e'}}
              >
                🌐 app.plex.tv - Browser (100% FREE)
              </a>
            </div>
            <div style={styles.setupSteps}>
              <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#333'}}>How to Set Up:</h3>
              <ol style={{margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: '#333'}}>
                <li>Download the Plex app or visit app.plex.tv in your browser</li>
                <li>Tap "Sign In" and enter your username/email and password from above</li>
                <li>Browse your Movies and TV Shows libraries</li>
                <li>(App Only) When you try to play, you'll be prompted for the $4.99 unlock</li>
                <li>Stream or download content for offline viewing</li>
              </ol>
            </div>
          </div>

          <div style={styles.recommendedBox}>
            <div style={styles.recommendedBadge}>⭐ RECOMMENDED - iOS</div>
            <h2 style={styles.sectionTitle}>Prologue - Best Audiobook Experience</h2>
            <p style={styles.description}>
              <strong>Prologue</strong> is the recommended audiobook app for iOS users. It offers the best audiobook experience with 
              full <strong>chapter support</strong>, smart speed controls, sleep timer, CarPlay integration, and beautiful UI. 
              While it has a one-time $5.99 cost, it's worth it for serious audiobook listeners.
            </p>
            <div style={styles.links}>
              <a
                href="https://apps.apple.com/app/prologue/id1459223267"
                target="_blank"
                rel="noopener noreferrer"
                style={{...styles.link, background: '#f59e0b'}}
              >
                📱 Get Prologue for iOS ($5.99 one-time)
              </a>
            </div>
            <div style={styles.setupSteps}>
              <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#333'}}>How to Set Up:</h3>
              <ol style={{margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: '#333'}}>
                <li>Download Prologue from the App Store ($5.99 one-time purchase)</li>
                <li>Open the app and tap "Sign In"</li>
                <li>Enter your username/email and password from above</li>
                <li>Browse your audiobooks library with full chapter navigation</li>
                <li>Enjoy the best audiobook experience on iOS!</li>
              </ol>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📚 Alternative Audiobook Apps</h2>
            <p style={styles.description}>
              Free alternatives that also work with Plex:
            </p>

            <div style={styles.appOption}>
              <h3 style={styles.appTitle}>Plexamp (iOS & Android) - FREE</h3>
              <p style={styles.appDescription}>
                The official Plex app for audiobooks. It's <strong>completely free</strong>, but has limited audiobook features. 
                <strong style={{color: '#dc2626'}}> Note: Does not support chapter navigation</strong>, which can make it difficult 
                to navigate through audiobooks. Better suited for continuous listening without needing to skip between chapters.
              </p>
              <div style={styles.links}>
                <a
                  href="https://apps.apple.com/app/plexamp/id1500797510"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{...styles.link, background: '#22c55e'}}
                >
                  📱 Plexamp - iOS (FREE)
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=tv.plex.labs.plexamp"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{...styles.link, background: '#22c55e'}}
                >
                  📱 Plexamp - Android (FREE)
                </a>
              </div>
              <div style={styles.setupSteps}>
                <p style={{margin: '12px 0 0 0', fontSize: '14px', color: '#666'}}>
                  <strong>Setup:</strong> Download app → Sign in with Plex credentials → Access your audiobooks
                </p>
              </div>
            </div>

            <div style={styles.appOption}>
              <h3 style={styles.appTitle}>Bookcamp (Android) - FREE</h3>
              <p style={styles.appDescription}>
                Free audiobook player for Android with a clean interface, playback controls, and library organization.
              </p>
              <div style={styles.links}>
                <a
                  href="https://play.google.com/store/apps/details?id=app.bookcamp.android&pcampaignid=web_share"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  Get Bookcamp for Android
                </a>
              </div>
              <div style={styles.setupSteps}>
                <p style={{margin: '12px 0 0 0', fontSize: '14px', color: '#666'}}>
                  <strong>Setup:</strong> Download app → Sign in with Plex credentials → Access your audiobooks
                </p>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>💡 Quick Tips</h2>
            <ul style={styles.tipsList}>
              <li><strong>Same credentials everywhere:</strong> All apps use your Plex username/email and password</li>
              <li><strong>Recommended for iOS:</strong> Prologue ($5.99) offers the best experience with full chapter support</li>
              <li><strong>Free options:</strong> Plexamp and Bookcamp are free but lack chapter navigation</li>
              <li><strong>For movies/TV:</strong> Official Plex app ($4.99 for mobile streaming) or app.plex.tv (free browser)</li>
              <li><strong>Download for offline:</strong> Most apps let you download content for offline viewing/listening</li>
              <li><strong>Multiple devices:</strong> Use your account on as many devices as you want</li>
              <li><strong>Quality settings:</strong> Adjust streaming quality in app settings to manage data usage</li>
              <li><strong>Password changes:</strong> If you change your password, you'll need to sign in again on all devices</li>
            </ul>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🆓 Cost Summary</h2>
            <div style={{background: '#f7f9fc', padding: '20px', borderRadius: '12px', border: '2px solid #e0e6ed'}}>
              <div style={{marginBottom: '16px'}}>
                <strong style={{color: '#f59e0b', fontSize: '16px'}}>⭐ RECOMMENDED:</strong>
                <ul style={{margin: '8px 0 0 20px', lineHeight: '1.8', color: '#333'}}>
                  <li><strong>Prologue (iOS)</strong> - $5.99 one-time - Best audiobook experience with chapter support</li>
                </ul>
              </div>
              <div style={{marginBottom: '12px'}}>
                <strong style={{color: '#22c55e', fontSize: '16px'}}>✓ FREE:</strong>
                <ul style={{margin: '8px 0 0 20px', lineHeight: '1.8', color: '#333'}}>
                  <li>Plexamp (audiobooks, no chapters) - iOS & Android</li>
                  <li>app.plex.tv in browser (movies, TV, audiobooks)</li>
                  <li>Bookcamp (audiobooks) - Android only</li>
                  <li>Plex desktop apps (Windows, Mac, Linux)</li>
                </ul>
              </div>
              <div>
                <strong style={{color: '#e5a00d', fontSize: '16px'}}>💰 PAID:</strong>
                <ul style={{margin: '8px 0 0 20px', lineHeight: '1.8', color: '#333'}}>
                  <li>Official Plex app mobile streaming - $4.99 one-time (movies & TV)</li>
                  <li>Prologue - $5.99 one-time (audiobooks, iOS only) ⭐ Recommended</li>
                </ul>
              </div>
            </div>
          </div>

          <div style={styles.helpSection}>
            <p style={styles.helpText}>
              Need help getting set up? Contact your administrator for assistance.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  header: {
    maxWidth: '900px',
    margin: '0 auto 20px',
  },
  backButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    backdropFilter: 'blur(10px)',
  },
  card: {
    maxWidth: '900px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '40px',
    textAlign: 'center',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
  },
  infoBox: {
    background: '#f7f9fc',
    border: '2px solid #e0e6ed',
    borderRadius: '12px',
    padding: '20px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #e0e6ed',
  },
  label: {
    fontWeight: 'bold',
    color: '#555',
    minWidth: '120px',
  },
  value: {
    flex: 1,
    color: '#333',
    fontFamily: 'monospace',
    background: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    marginRight: '10px',
  },
  copyButton: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  step: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    background: '#667eea',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
  },
  stepText: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '10px',
  },
  list: {
    marginTop: '10px',
    paddingLeft: '20px',
    color: '#666',
    lineHeight: '1.8',
  },
  links: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px',
    flexWrap: 'wrap' as 'wrap',
  },
  link: {
    background: '#667eea',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    display: 'inline-block',
  },
  setupSteps: {
    marginTop: '20px',
    padding: '20px',
    background: '#f7f9fc',
    borderRadius: '12px',
    border: '1px solid #e0e6ed',
  },
  tipsList: {
    paddingLeft: '20px',
    color: '#666',
    lineHeight: '2',
  },
  helpSection: {
    marginTop: '40px',
    padding: '20px',
    background: '#f0f4ff',
    borderRadius: '12px',
    textAlign: 'center',
  },
  helpText: {
    color: '#666',
    fontSize: '14px',
  },
  loadingBox: {
    maxWidth: '400px',
    margin: '100px auto',
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
  },
  errorBox: {
    maxWidth: '400px',
    margin: '100px auto',
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
  },
  button: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px',
  },
  importantNotice: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    border: '2px solid #f59e0b',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '40px',
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  noticeIcon: {
    fontSize: '36px',
    flexShrink: 0,
  },
  noticeTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: '8px',
    marginTop: 0,
  },
  noticeText: {
    fontSize: '16px',
    color: '#78350f',
    lineHeight: '1.6',
    margin: 0,
  },
  warningSection: {
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    border: '3px solid #dc2626',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '40px',
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: '36px',
    flexShrink: 0,
  },
  warningTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: '8px',
    marginTop: 0,
  },
  warningText: {
    fontSize: '16px',
    color: '#7f1d1d',
    lineHeight: '1.6',
    margin: 0,
  },
  recommendedBox: {
    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    border: '3px solid #22c55e',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '40px',
    position: 'relative' as const,
  },
  recommendedBadge: {
    position: 'absolute' as const,
    top: '-12px',
    right: '20px',
    background: '#22c55e',
    color: 'white',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  appOption: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '15px',
  },
  appTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
    marginTop: 0,
  },
  appDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
  },
  simpleSteps: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  simpleStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  stepNum: {
    width: '40px',
    height: '40px',
    background: '#667eea',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
};

export default MobileAppSetup;
