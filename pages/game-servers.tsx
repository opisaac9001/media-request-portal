import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import AnimatedBackground from '../components/AnimatedBackground';

interface ServerInfo {
  name: string;
  game: string;
  address: string;
  port: number;
  platform: string;
  description: string;
  maxPlayers: number;
  currentPlayers?: number;
  status: 'online' | 'offline' | 'unknown';
  rules: string[];
  icon: string;
  serverKey: string; // Key to match with API response
  howToConnect: {
    pc?: string[];
    xbox?: string[];
    general?: string[];
  };
}

interface ServerStatusResponse {
  [key: string]: {
    name: string;
    online: boolean;
    players?: number;
    maxPlayers?: number;
    ping?: number;
    error?: string;
  };
}

const GameServers: NextPage = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [servers, setServers] = useState<ServerInfo[]>([
    {
      name: 'Team Awsome Survival',
      game: 'Minecraft Java Edition',
      address: 'teamawsomegames.duckdns.org',
      port: 25565,
      platform: 'PC/Mac/Linux',
      description: 'A friendly survival server with custom plugins and a tight-knit community. Build, explore, and survive together!',
      maxPlayers: 20,
      currentPlayers: 0,
      status: 'unknown',
      icon: '⛏️',
      serverKey: 'minecraft-java',
      rules: [
        'No griefing or stealing from other players',
        'Respect all players and keep chat friendly',
        'No hacking, cheating, or exploiting bugs',
        'Build at least 100 blocks away from others unless invited',
        'Have fun and help new players!'
      ],
      howToConnect: {
        pc: [
          'Open Minecraft Java Edition',
          'Click "Multiplayer"',
          'Click "Add Server"',
          'Enter server address: teamawsomegames.duckdns.org:25565',
          'Click "Done" and join the server!'
        ]
      }
    },
    {
      name: 'Team Awsome Bedrock',
      game: 'Minecraft Bedrock Edition',
      address: 'teamawsomegames.duckdns.org',
      port: 19132,
      platform: 'Xbox/Mobile/Windows 10',
      description: 'Cross-platform Minecraft server for Xbox, mobile, and Windows 10 players. Same great survival experience!',
      maxPlayers: 20,
      currentPlayers: 0,
      status: 'unknown',
      icon: '🎮',
      serverKey: 'minecraft-bedrock',
      rules: [
        'No griefing or stealing from other players',
        'Respect all players and keep chat friendly',
        'No hacking, cheating, or exploiting bugs',
        'Build at least 100 blocks away from others unless invited',
        'Have fun and help new players!'
      ],
      howToConnect: {
        xbox: [
          'Open Minecraft on Xbox',
          'Go to "Play" → "Servers" tab',
          'Scroll down and click "Add Server"',
          'Server Name: Team Awsome',
          'Server Address: teamawsomegames.duckdns.org',
          'Port: 19132',
          'Save and join!'
        ],
        general: [
          'Open Minecraft Bedrock Edition',
          'Go to "Play" → "Servers"',
          'Add server with address: teamawsomegames.duckdns.org',
          'Port: 19132',
          'Join and play!'
        ]
      }
    },
    {
      name: 'Team Awsome Island',
      game: 'Palworld',
      address: 'teamawsomegames.duckdns.org',
      port: 8211,
      platform: 'PC (Steam)',
      description: 'Catch, battle, and build with Pals! A cooperative multiplayer server for exploring and building together.',
      maxPlayers: 32,
      currentPlayers: 0,
      status: 'unknown',
      icon: '🦄',
      serverKey: 'palworld',
      rules: [
        'Cooperative play encouraged - help each other out',
        'No destroying other players\' bases',
        'Share resources when possible',
        'PvP is optional and requires mutual consent',
        'Report any bugs or issues to admins'
      ],
      howToConnect: {
        pc: [
          'Launch Palworld on Steam',
          'Select "Join Multiplayer Game"',
          'Enter server address: teamawsomegames.duckdns.org:8211',
          'Click "Connect" and start playing!'
        ]
      }
    },
    {
      name: 'Team Awsome Vikings',
      game: 'Valheim',
      address: 'teamawsomegames.duckdns.org',
      port: 2456,
      platform: 'PC (Steam)',
      description: 'Explore, build, and conquer in the Norse afterlife. Cooperative survival with epic boss battles!',
      maxPlayers: 10,
      currentPlayers: 0,
      status: 'unknown',
      icon: '⚔️',
      serverKey: 'valheim',
      rules: [
        'Work together to defeat bosses',
        'Don\'t take items from others without asking',
        'Communicate before making major base changes',
        'Share portal locations with the team',
        'Have patience with new Vikings!'
      ],
      howToConnect: {
        pc: [
          'Launch Valheim on Steam',
          'Click "Join Game"',
          'Click "Add Server" in the bottom',
          'Enter address: teamawsomegames.duckdns.org:2456',
          'Click "Connect" and join your fellow Vikings!'
        ]
      }
    },
    {
      name: 'Team Awsome Apocalypse',
      game: 'Project Zomboid',
      address: 'teamawsomegames.duckdns.org',
      port: 16261,
      platform: 'PC (Steam)',
      description: 'Survive the zombie apocalypse together. Cooperative survival horror where teamwork is essential.',
      maxPlayers: 16,
      currentPlayers: 0,
      status: 'unknown',
      icon: '🧟',
      serverKey: 'projectzomboid',
      rules: [
        'Teamwork is essential - stick together',
        'Share supplies and food fairly',
        'Don\'t lock other players out of safe houses',
        'Communicate zombie hordes and dangers',
        'No PvP unless all players agree',
        'Respect each other\'s playstyle (stealth vs aggressive)'
      ],
      howToConnect: {
        pc: [
          'Launch Project Zomboid on Steam',
          'Click "Join Server" from main menu',
          'Enter IP: teamawsomegames.duckdns.org',
          'Port: 16261',
          'Click "Connect" and survive together!'
        ]
      }
    }
  ]);

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/check', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsLoggedIn(true);
          setUsername(data.username);
          setCheckingAuth(false);
          // Check if user is an admin (has admin_session cookie/session)
          fetch('/api/admin/settings', { credentials: 'include' })
            .then(r => r.json())
            .then(ad => {
              if (ad && ad.authenticated !== false) setIsAdmin(true);
            })
            .catch(() => {
              // ignore
            });
        } else {
          // Redirect to login if not authenticated
          router.push('/login?redirect=/game-servers');
        }
      })
      .catch(() => {
        // Redirect to login on error
        router.push('/login?redirect=/game-servers');
      });
  }, [router]);

  // Fetch server status after authentication
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchServerStatus = async () => {
      try {
        const response = await fetch('/api/game-servers/status');
        const statusData: ServerStatusResponse = await response.json();

        setServers(prevServers => 
          prevServers.map(server => {
            const status = statusData[server.serverKey];
            if (status) {
              return {
                ...server,
                status: status.online ? 'online' : 'offline',
                currentPlayers: status.players,
                maxPlayers: status.maxPlayers || server.maxPlayers
              };
            }
            return server;
          })
        );
      } catch (error) {
        console.error('Error fetching server status:', error);
      }
    };

    // Fetch immediately
    fetchServerStatus();

    // Then fetch every 30 seconds
    const interval = setInterval(fetchServerStatus, 30000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setIsLoggedIn(false);
      setUsername('');
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <Layout>
        <AnimatedBackground />
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '50px',
            textAlign: 'center' as const,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>Checking authentication...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedBackground />
      
      {/* Top corner user display */}
      {isLoggedIn && (
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
            {username}
          </span>
          {isAdmin && (
            <button
              onClick={() => router.push('/admin/dashboard')}
              style={{
                padding: '6px 12px',
                background: 'rgba(59,130,246,0.9)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              Admin
            </button>
          )}
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

        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>🎮 Game Servers</h1>
          <p style={styles.pageSubtitle}>
            Join our community game servers! All servers are open to registered users.
          </p>
        </div>

        <div style={styles.serversGrid}>
          {servers.map((server, index) => (
            <div key={index} style={styles.serverCard}>
              {/* Server Header */}
              <div style={styles.serverHeader}>
                <div style={styles.serverIcon}>{server.icon}</div>
                <div style={styles.serverTitleSection}>
                  <h2 style={styles.serverName}>{server.name}</h2>
                  <p style={styles.serverGame}>{server.game}</p>
                </div>
                <div style={{
                  ...styles.statusBadge,
                  background: server.status === 'online' 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : server.status === 'offline'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(156, 163, 175, 0.2)',
                  color: server.status === 'online' 
                    ? '#22c55e' 
                    : server.status === 'offline'
                    ? '#ef4444'
                    : '#9ca3af',
                  border: `1px solid ${server.status === 'online' 
                    ? '#22c55e' 
                    : server.status === 'offline'
                    ? '#ef4444'
                    : '#9ca3af'}`
                }}>
                  {server.status === 'online' ? '● Online' : server.status === 'offline' ? '● Offline' : '● Status Unknown'}
                </div>
              </div>

              {/* Server Info */}
              <div style={styles.serverInfo}>
                <p style={styles.serverDescription}>{server.description}</p>
                
                <div style={styles.serverStats}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Platform:</span>
                    <span style={styles.statValue}>{server.platform}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Players:</span>
                    <span style={styles.statValue}>
                      {server.currentPlayers !== undefined ? `${server.currentPlayers}/${server.maxPlayers}` : `0/${server.maxPlayers}`}
                    </span>
                  </div>
                </div>

                {/* Connection Info */}
                <div style={styles.connectionBox}>
                  <h3 style={styles.sectionTitle}>📡 Connection Details</h3>
                  <div style={styles.addressRow}>
                    <span style={styles.addressLabel}>Address:</span>
                    <code style={styles.addressCode}>{server.address}:{server.port}</code>
                    <button 
                      onClick={() => copyToClipboard(`${server.address}:${server.port}`)}
                      style={styles.copyBtn}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* How to Connect */}
                <div style={styles.howToConnect}>
                  <h3 style={styles.sectionTitle}>🔌 How to Connect</h3>
                  {server.howToConnect.pc && (
                    <div style={styles.platformInstructions}>
                      <h4 style={styles.platformTitle}>PC Instructions:</h4>
                      <ol style={styles.instructionsList}>
                        {server.howToConnect.pc.map((step, i) => (
                          <li key={i} style={styles.instructionItem}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {server.howToConnect.xbox && (
                    <div style={styles.platformInstructions}>
                      <h4 style={styles.platformTitle}>Xbox Instructions:</h4>
                      <ol style={styles.instructionsList}>
                        {server.howToConnect.xbox.map((step, i) => (
                          <li key={i} style={styles.instructionItem}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {server.howToConnect.general && !server.howToConnect.pc && (
                    <div style={styles.platformInstructions}>
                      <ol style={styles.instructionsList}>
                        {server.howToConnect.general.map((step, i) => (
                          <li key={i} style={styles.instructionItem}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {/* Server Rules */}
                <div style={styles.rulesSection}>
                  <h3 style={styles.sectionTitle}>📜 Server Rules</h3>
                  <ul style={styles.rulesList}>
                    {server.rules.map((rule, i) => (
                      <li key={i} style={styles.ruleItem}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* General Info */}
        <div style={styles.generalInfo}>
          <h2 style={styles.generalTitle}>ℹ️ General Information</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <h3 style={styles.infoCardTitle}>🔐 Access</h3>
              <p style={styles.infoCardText}>
                All servers are open to registered portal users. Make sure you're logged in to the portal 
                to stay updated on server status and announcements.
              </p>
            </div>
            <div style={styles.infoCard}>
              <h3 style={styles.infoCardTitle}>💬 Support</h3>
              <p style={styles.infoCardText}>
                Need help or have questions? Contact the admin or ask other players in-game. 
                Report any issues or bugs through the portal.
              </p>
            </div>
            <div style={styles.infoCard}>
              <h3 style={styles.infoCardTitle}>🛡️ Moderation</h3>
              <p style={styles.infoCardText}>
                Breaking server rules may result in warnings, temporary bans, or permanent removal. 
                Play fair, be respectful, and have fun!
              </p>
            </div>
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
    position: 'relative',
    zIndex: 1,
  },
  header: {
    maxWidth: '1200px',
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
    transition: 'all 0.3s ease',
  },
  pageHeader: {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    textAlign: 'center' as const,
  },
  pageTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '10px',
    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  pageSubtitle: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  serversGrid: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '30px',
  },
  serverCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  },
  serverHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '2px solid #e5e7eb',
  },
  serverIcon: {
    fontSize: '48px',
    flexShrink: 0,
  },
  serverTitleSection: {
    flex: 1,
  },
  serverName: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 5px 0',
  },
  serverGame: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  serverInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  serverDescription: {
    fontSize: '16px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: 0,
  },
  serverStats: {
    display: 'flex',
    gap: '30px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    textTransform: 'uppercase' as const,
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '18px',
    color: '#1f2937',
    fontWeight: '600',
  },
  connectionBox: {
    background: '#f9fafb',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 15px 0',
  },
  addressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  addressLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '600',
  },
  addressCode: {
    flex: 1,
    background: '#1f2937',
    color: '#22c55e',
    padding: '10px 15px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '16px',
  },
  copyBtn: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  howToConnect: {
    background: '#eff6ff',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #bfdbfe',
  },
  platformInstructions: {
    marginBottom: '15px',
  },
  platformTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 10px 0',
  },
  instructionsList: {
    margin: '0',
    paddingLeft: '20px',
    color: '#1f2937',
  },
  instructionItem: {
    marginBottom: '8px',
    lineHeight: '1.6',
  },
  rulesSection: {
    background: '#fef3c7',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #fde68a',
  },
  rulesList: {
    margin: '0',
    paddingLeft: '20px',
    color: '#78350f',
  },
  ruleItem: {
    marginBottom: '8px',
    lineHeight: '1.6',
  },
  generalInfo: {
    maxWidth: '1200px',
    margin: '50px auto 0',
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  },
  generalTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '30px',
    textAlign: 'center' as const,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  infoCard: {
    background: '#f9fafb',
    padding: '25px',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
  },
  infoCardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  infoCardText: {
    fontSize: '15px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: 0,
  },
};

export default GameServers;
