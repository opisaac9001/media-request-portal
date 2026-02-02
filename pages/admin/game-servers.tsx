import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import AnimatedBackground from '../../components/AnimatedBackground';
import AdminHeader from '../../components/AdminHeader';

const API_BASE = '/api/admin-proxy';

const DEFAULT_TOKEN = 'change-this-to-gamesd-token';

interface Server {
  id: string;
  name: string;
  templateId: string;
  image: string;
  status?: string;
  running?: boolean;
  uptime?: number;
  stats?: {
    cpu: string;
    memory: {
      used: string;
      limit: string;
      percent: string;
    };
  };
  ports?: any;
  createdAt: number;
}

interface Template {
  id: string;
  name: string;
  image: string;
  description: string;
  defaultEnv: Record<string, string>;
  defaultPorts: Record<string, string>;
}

interface Backup {
  name: string;
  file: string;
  size: number;
  created: number;
}

const GameServerManager = () => {
  const [token] = useState(DEFAULT_TOKEN);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [serverName, setServerName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [customEnv, setCustomEnv] = useState<Record<string, string>>({});
  const [customPorts, setCustomPorts] = useState<Record<string, string>>({});
  const [createResult, setCreateResult] = useState('');
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'servers' | 'create' | 'backups'>('dashboard');
  const [showModal, setShowModal] = useState<'template' | 'server-details' | 'logs' | 'mods' | 'mod-list' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [modUrl, setModUrl] = useState('');
  const [modPath, setModPath] = useState('/mods');
  const [modName, setModName] = useState('');
  const [installedMods, setInstalledMods] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadTemplates();
    loadServers();
    loadBackups();
    loadDashboard();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadServers();
        loadDashboard();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const api = async (path: string, opts: any = {}) => {
    const headers = { ...opts.headers, 'x-gamesd-token': DEFAULT_TOKEN };
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json().catch(() => res.text());
  };

  const loadTemplates = async () => {
    try {
      const t = await api('/v1/templates');
      setTemplates(t.templates || []);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
      setTemplates([]);
    }
  };

  const loadServers = async () => {
    try {
      const r = await api('/v1/servers');
      const serverList = r.servers || [];
      
      // Load detailed stats for each server
      const detailedServers = await Promise.all(
        serverList.map(async (server: Server) => {
          try {
            const details = await api(`/v1/servers/${server.id}`);
            return details.server;
          } catch {
            return server;
          }
        })
      );
      
      setServers(detailedServers);
    } catch (err: any) {
      console.error('Failed to load servers:', err);
      setServers([]);
    }
  };

  const loadBackups = async () => {
    try {
      const b = await api('/v1/backups');
      setBackups(b.backups || []);
    } catch (err: any) {
      console.error('Failed to load backups:', err);
      setBackups([]);
    }
  };

  const loadDashboard = async () => {
    try {
      const d = await api('/v1/dashboard');
      setDashboard(d.overview);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    }
  };

  const loadServerMods = async (serverId: string) => {
    try {
      const m = await api(`/v1/servers/${serverId}/mods`);
      setInstalledMods(m.mods || []);
    } catch (err: any) {
      console.error('Failed to load mods:', err);
      setInstalledMods([]);
    }
  };

  const createServer = async () => {
    if (!serverName || !templateId) {
      alert('Please provide a server name and select a template');
      return;
    }
    setLoading(true);
    try {
      const result = await api('/v1/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: serverName, 
          templateId,
          env: customEnv,
          ports: customPorts
        }),
      });
      setCreateResult(`✅ Server created: ${result.server.name}`);
      setServerName('');
      setTemplateId('');
      setCustomEnv({});
      setCustomPorts({});
      loadServers();
      setTimeout(() => setActiveTab('servers'), 2000);
    } catch (err: any) {
      setCreateResult(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startServer = async (id: string) => {
    try {
      await api(`/v1/servers/${id}/start`, { method: 'POST' });
      loadServers();
    } catch (err: any) {
      alert(`Error starting server: ${err.message}`);
    }
  };

  const stopServer = async (id: string) => {
    try {
      await api(`/v1/servers/${id}/stop`, { method: 'POST' });
      loadServers();
    } catch (err: any) {
      alert(`Error stopping server: ${err.message}`);
    }
  };

  const restartServer = async (id: string) => {
    try {
      await api(`/v1/servers/${id}/restart`, { method: 'POST' });
      loadServers();
    } catch (err: any) {
      alert(`Error restarting server: ${err.message}`);
    }
  };

  const deleteServer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will remove all data.`)) return;
    try {
      await api(`/v1/servers/${id}`, { method: 'DELETE' });
      loadServers();
    } catch (err: any) {
      alert(`Error deleting server: ${err.message}`);
    }
  };

  const showServerLogs = async (server: Server) => {
    try {
      const result = await api(`/v1/servers/${server.id}/logs`);
      setLogs(result || 'No logs available');
      setSelectedServer(server);
      setShowModal('logs');
    } catch (err: any) {
      setLogs(`Error loading logs: ${err.message}`);
      setShowModal('logs');
    }
  };

  const backupServer = async (id: string, name: string) => {
    if (!confirm(`Create a backup of "${name}"?`)) return;
    setLoading(true);
    try {
      await api(`/v1/servers/${id}/backup`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${name}_backup` })
      });
      alert('Backup created successfully');
      loadBackups();
    } catch (err: any) {
      alert(`Error creating backup: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (serverId: string, backupFile: string) => {
    if (!confirm(`Restore this backup? The server will be stopped.`)) return;
    setLoading(true);
    try {
      await api(`/v1/servers/${serverId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupFile })
      });
      alert('Backup restored successfully. Start the server when ready.');
      loadServers();
    } catch (err: any) {
      alert(`Error restoring backup: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const installMod = async (serverId: string) => {
    if (!modUrl) {
      alert('Please provide a mod URL');
      return;
    }
    setLoading(true);
    try {
      await api(`/v1/servers/${serverId}/mods/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modUrl, modPath, modName: modName || undefined })
      });
      alert('Mod installed successfully. Restart the server to apply.');
      setModUrl('');
      setModName('');
      setShowModal(null);
      loadServers();
    } catch (err: any) {
      alert(`Error installing mod: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeMod = async (serverId: string, modName: string) => {
    if (!confirm(`Remove mod "${modName}"?`)) return;
    setLoading(true);
    try {
      await api(`/v1/servers/${serverId}/mods/${modName}`, {
        method: 'DELETE'
      });
      alert('Mod removed successfully. Restart the server to apply.');
      loadServerMods(serverId);
    } catch (err: any) {
      alert(`Error removing mod: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (server: Server) => {
    if (server.running) return '#4caf50';
    if (server.status === 'exited') return '#f44336';
    return '#ff9800';
  };

  const getStatusText = (server: Server) => {
    if (server.running) return '🟢 Running';
    if (server.status === 'exited') return '🔴 Stopped';
    return '🟡 ' + (server.status || 'Unknown');
  };

  return (
    <Layout>
      <AnimatedBackground />
      <div style={styles.container}>
        <AdminHeader title="Game Server Manager" icon="🎮" />
        
        {/* Controls */}
        <div style={styles.headerControls}>
          <label style={styles.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Auto-refresh (5s)
          </label>
          <button onClick={loadServers} style={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabs}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            style={{...styles.tab, ...(activeTab === 'dashboard' ? styles.activeTab : {})}}
          >
            📊 Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('servers')} 
            style={{...styles.tab, ...(activeTab === 'servers' ? styles.activeTab : {})}}
          >
            🖥️ Servers ({servers.length})
          </button>
          <button 
            onClick={() => setActiveTab('create')} 
            style={{...styles.tab, ...(activeTab === 'create' ? styles.activeTab : {})}}
          >
            ➕ Create Server
          </button>
          <button 
            onClick={() => setActiveTab('backups')} 
            style={{...styles.tab, ...(activeTab === 'backups' ? styles.activeTab : {})}}
          >
            💾 Backups ({backups.length})
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboard && (
          <div style={styles.tabContent}>
            <div style={styles.dashboardGrid}>
              <div style={styles.dashboardCard}>
                <div style={styles.dashboardIcon}>🖥️</div>
                <div style={styles.dashboardValue}>{dashboard.totalServers}</div>
                <div style={styles.dashboardLabel}>Total Servers</div>
              </div>
              <div style={styles.dashboardCard}>
                <div style={styles.dashboardIcon}>🟢</div>
                <div style={styles.dashboardValue}>{dashboard.running}</div>
                <div style={styles.dashboardLabel}>Running</div>
              </div>
              <div style={styles.dashboardCard}>
                <div style={styles.dashboardIcon}>🔴</div>
                <div style={styles.dashboardValue}>{dashboard.stopped}</div>
                <div style={styles.dashboardLabel}>Stopped</div>
              </div>
              <div style={styles.dashboardCard}>
                <div style={styles.dashboardIcon}>⚡</div>
                <div style={styles.dashboardValue}>{dashboard.avgCpu}%</div>
                <div style={styles.dashboardLabel}>Avg CPU</div>
              </div>
              <div style={styles.dashboardCard}>
                <div style={styles.dashboardIcon}>💾</div>
                <div style={styles.dashboardValue}>{dashboard.totalMemory}</div>
                <div style={styles.dashboardLabel}>Total RAM</div>
              </div>
              <div style={styles.dashboardCard}>
                <div style={styles.dashboardIcon}>📦</div>
                <div style={styles.dashboardValue}>{backups.length}</div>
                <div style={styles.dashboardLabel}>Backups</div>
              </div>
            </div>

            <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Recent Servers</h3>
            <div style={styles.serverGrid}>
              {servers.slice(0, 6).map((server) => (
                <div key={server.id} style={styles.serverCard}>
                  <div style={styles.serverCardHeader}>
                    <h3 style={styles.serverName}>{server.name}</h3>
                    <span style={{...styles.statusBadge, background: getStatusColor(server)}}>
                      {getStatusText(server)}
                    </span>
                  </div>
                  <div style={styles.serverInfo}>
                    {server.uptime && server.running && (
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Uptime:</span>
                        <span style={styles.value}>{formatUptime(server.uptime)}</span>
                      </div>
                    )}
                    {server.stats && (
                      <>
                        <div style={styles.infoRow}>
                          <span style={styles.label}>CPU:</span>
                          <span style={styles.value}>{server.stats.cpu}%</span>
                        </div>
                        <div style={styles.infoRow}>
                          <span style={styles.label}>Memory:</span>
                          <span style={styles.value}>{server.stats.memory.percent}%</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={styles.actionBar}>
                    {server.running ? (
                      <button onClick={() => stopServer(server.id)} style={styles.stopButton}>
                        ⏸️ Stop
                      </button>
                    ) : (
                      <button onClick={() => startServer(server.id)} style={styles.startButton}>
                        ▶️ Start
                      </button>
                    )}
                    <button onClick={() => setActiveTab('servers')} style={styles.secondaryButton}>
                      View All
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Servers Tab */}
        {activeTab === 'servers' && (
          <div style={styles.tabContent}>
            {servers.length === 0 ? (
              <div style={styles.emptyState}>
                <h2>No game servers yet</h2>
                <p>Create your first server to get started!</p>
                <button onClick={() => setActiveTab('create')} style={styles.primaryButton}>
                  Create Server
                </button>
              </div>
            ) : (
              <div style={styles.serverGrid}>
                {servers.map((server) => (
                  <div key={server.id} style={styles.serverCard}>
                    <div style={styles.serverCardHeader}>
                      <h3 style={styles.serverName}>{server.name}</h3>
                      <span style={{...styles.statusBadge, background: getStatusColor(server)}}>
                        {getStatusText(server)}
                      </span>
                    </div>

                    <div style={styles.serverInfo}>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Template:</span>
                        <span style={styles.value}>{server.templateId}</span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.label}>Created:</span>
                        <span style={styles.value}>{formatDate(server.createdAt)}</span>
                      </div>
                      {server.uptime && server.running && (
                        <div style={styles.infoRow}>
                          <span style={styles.label}>Uptime:</span>
                          <span style={styles.value}>{formatUptime(server.uptime)}</span>
                        </div>
                      )}
                      {server.stats && (
                        <>
                          <div style={styles.infoRow}>
                            <span style={styles.label}>CPU:</span>
                            <span style={styles.value}>{server.stats.cpu}%</span>
                          </div>
                          <div style={styles.infoRow}>
                            <span style={styles.label}>Memory:</span>
                            <span style={styles.value}>
                              {server.stats.memory.used} / {server.stats.memory.limit} ({server.stats.memory.percent}%)
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div style={styles.actionBar}>
                      {server.running ? (
                        <>
                          <button onClick={() => stopServer(server.id)} style={styles.stopButton}>
                            ⏸️ Stop
                          </button>
                          <button onClick={() => restartServer(server.id)} style={styles.warningButton}>
                            🔄 Restart
                          </button>
                        </>
                      ) : (
                        <button onClick={() => startServer(server.id)} style={styles.startButton}>
                          ▶️ Start
                        </button>
                      )}
                      <button onClick={() => showServerLogs(server)} style={styles.secondaryButton}>
                        📋 Logs
                      </button>
                      <button onClick={() => { 
                        setSelectedServer(server); 
                        loadServerMods(server.id); 
                        setShowModal('mod-list'); 
                      }} style={styles.secondaryButton}>
                        🧩 Mods
                      </button>
                      <button onClick={() => backupServer(server.id, server.name)} style={styles.secondaryButton}>
                        💾 Backup
                      </button>
                      <button onClick={() => deleteServer(server.id, server.name)} style={styles.dangerButton}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Server Tab */}
        {activeTab === 'create' && (
          <div style={styles.tabContent}>
            <div style={styles.createForm}>
              <h2>Create New Game Server</h2>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Server Name</label>
                <input
                  type="text"
                  placeholder="my-minecraft-server"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Game Template</label>
                <select
                  value={templateId}
                  onChange={(e) => {
                    setTemplateId(e.target.value);
                    const template = templates.find(t => t.id === e.target.value);
                    if (template) {
                      setCustomEnv(template.defaultEnv);
                      setCustomPorts(template.defaultPorts);
                    }
                  }}
                  style={styles.input}
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {templateId && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Environment Variables</label>
                    <div style={styles.envGrid}>
                      {Object.entries(customEnv).map(([key, value]) => (
                        <div key={key} style={styles.envRow}>
                          <input
                            type="text"
                            value={key}
                            readOnly
                            style={{...styles.input, flex: 1}}
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setCustomEnv({...customEnv, [key]: e.target.value})}
                            style={{...styles.input, flex: 2}}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Port Mappings (Host:Container)</label>
                    <div style={styles.envGrid}>
                      {Object.entries(customPorts).map(([hostPort, containerPort]) => (
                        <div key={hostPort} style={styles.envRow}>
                          <input
                            type="text"
                            value={hostPort}
                            onChange={(e) => {
                              const newPorts = {...customPorts};
                              delete newPorts[hostPort];
                              newPorts[e.target.value] = containerPort;
                              setCustomPorts(newPorts);
                            }}
                            style={{...styles.input, flex: 1}}
                            placeholder="Host Port"
                          />
                          <input
                            type="text"
                            value={containerPort}
                            onChange={(e) => setCustomPorts({...customPorts, [hostPort]: e.target.value})}
                            style={{...styles.input, flex: 1}}
                            placeholder="Container Port"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div style={styles.formActions}>
                <button 
                  onClick={createServer} 
                  disabled={loading || !serverName || !templateId}
                  style={{...styles.primaryButton, ...(loading || !serverName || !templateId ? styles.disabledButton : {})}}
                >
                  {loading ? '⏳ Creating...' : '✅ Create Server'}
                </button>
              </div>

              {createResult && (
                <div style={createResult.includes('✅') ? styles.successMessage : styles.errorMessage}>
                  {createResult}
                </div>
              )}
            </div>

            <div style={styles.templatesList}>
              <h3>Available Templates</h3>
              {templates.map((template) => (
                <div key={template.id} style={styles.templateCard}>
                  <h4>{template.name}</h4>
                  <p style={styles.templateDescription}>{template.description}</p>
                  <button 
                    onClick={() => { setSelectedTemplate(template); setShowModal('template'); }}
                    style={styles.secondaryButton}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Backups Tab */}
        {activeTab === 'backups' && (
          <div style={styles.tabContent}>
            <h2>Server Backups</h2>
            {backups.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No backups yet. Create a backup from any running server.</p>
              </div>
            ) : (
              <div style={styles.backupList}>
                {backups.map((backup) => (
                  <div key={backup.file} style={styles.backupCard}>
                    <div style={styles.backupInfo}>
                      <h4>{backup.name}</h4>
                      <p>Size: {formatBytes(backup.size)}</p>
                      <p>Created: {formatDate(backup.created)}</p>
                    </div>
                    <div style={styles.backupActions}>
                      <select 
                        onChange={(e) => {
                          if (e.target.value) restoreBackup(e.target.value, backup.file);
                          e.target.value = '';
                        }}
                        style={styles.input}
                      >
                        <option value="">Restore to server...</option>
                        {servers.map((server) => (
                          <option key={server.id} value={server.id}>
                            {server.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {showModal === 'template' && selectedTemplate && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2>{selectedTemplate.name}</h2>
              <p>{selectedTemplate.description}</p>
              <h3>Docker Image</h3>
              <code style={styles.code}>{selectedTemplate.image}</code>
              <h3>Default Environment Variables</h3>
              <ul style={styles.list}>
                {Object.entries(selectedTemplate.defaultEnv).map(([key, value]) => (
                  <li key={key}><code>{key}</code> = <code>{String(value)}</code></li>
                ))}
              </ul>
              <h3>Default Ports</h3>
              <ul style={styles.list}>
                {Object.entries(selectedTemplate.defaultPorts).map(([host, container]) => (
                  <li key={host}>Host <code>{host}</code> → Container <code>{container}</code></li>
                ))}
              </ul>
              <button onClick={() => setShowModal(null)} style={styles.primaryButton}>
                Close
              </button>
            </div>
          </div>
        )}

        {showModal === 'logs' && selectedServer && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
            <div style={{...styles.modal, maxWidth: '800px'}} onClick={(e) => e.stopPropagation()}>
              <h2>📋 Logs: {selectedServer.name}</h2>
              <pre style={styles.logsContainer}>{logs}</pre>
              <button onClick={() => setShowModal(null)} style={styles.primaryButton}>
                Close
              </button>
            </div>
          </div>
        )}

        {showModal === 'mod-list' && selectedServer && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2>🧩 Mods: {selectedServer.name}</h2>
              
              {installedMods.length > 0 ? (
                <div style={styles.modList}>
                  {installedMods.map((mod, idx) => (
                    <div key={idx} style={styles.modItem}>
                      <div>
                        <strong>{mod.name}</strong>
                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                          Installed: {formatDate(mod.installedAt)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          Path: {mod.path}
                        </div>
                      </div>
                      <button 
                        onClick={() => removeMod(selectedServer.id, mod.name)}
                        style={styles.dangerButton}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
                  No mods installed yet
                </p>
              )}

              <div style={styles.modalActions}>
                <button 
                  onClick={() => setShowModal('mods')} 
                  style={styles.primaryButton}
                >
                  ➕ Install New Mod
                </button>
                <button onClick={() => setShowModal(null)} style={styles.secondaryButton}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal === 'mods' && selectedServer && (
          <div style={styles.modalOverlay} onClick={() => setShowModal(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2>🧩 Install Mod: {selectedServer.name}</h2>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Mod Name (optional)</label>
                <input
                  type="text"
                  placeholder="my-awesome-mod"
                  value={modName}
                  onChange={(e) => setModName(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Mod Download URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/mod.zip"
                  value={modUrl}
                  onChange={(e) => setModUrl(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Install Path (relative to /data)</label>
                <input
                  type="text"
                  value={modPath}
                  onChange={(e) => setModPath(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActions}>
                <button 
                  onClick={() => installMod(selectedServer.id)} 
                  disabled={loading || !modUrl}
                  style={{...styles.primaryButton, ...(loading || !modUrl ? styles.disabledButton : {})}}
                >
                  {loading ? '⏳ Installing...' : '✅ Install Mod'}
                </button>
                <button onClick={() => setShowModal(null)} style={styles.secondaryButton}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    color: '#fff',
    position: 'relative',
    zIndex: 1,
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: 0,
  },
  headerControls: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  autoRefreshLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
  },
  refreshButton: {
    padding: '8px 16px',
    background: '#2196f3',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #333',
  },
  tab: {
    padding: '12px 24px',
    background: 'transparent',
    color: '#aaa',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  activeTab: {
    color: '#fff',
    borderBottomColor: '#e91e63',
  },
  tabContent: {
    marginTop: '20px',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  dashboardCard: {
    background: 'rgba(30, 30, 30, 0.9)',
    border: '2px solid #444',
    borderRadius: '10px',
    padding: '25px',
    textAlign: 'center',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  dashboardIcon: {
    fontSize: '40px',
    marginBottom: '10px',
  },
  dashboardValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: '5px',
  },
  dashboardLabel: {
    fontSize: '14px',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  modList: {
    maxHeight: '400px',
    overflowY: 'auto',
    marginBottom: '20px',
  },
  modItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '5px',
    marginBottom: '10px',
  },
  serverGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px',
  },
  serverCard: {
    background: 'rgba(30, 30, 30, 0.9)',
    border: '1px solid #444',
    borderRadius: '10px',
    padding: '20px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  serverCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  serverName: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  serverInfo: {
    marginBottom: '15px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #333',
  },
  label: {
    color: '#aaa',
    fontSize: '14px',
  },
  value: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
  },
  actionBar: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  startButton: {
    padding: '8px 12px',
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  stopButton: {
    padding: '8px 12px',
    background: '#ff9800',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  warningButton: {
    padding: '8px 12px',
    background: '#ffc107',
    color: '#000',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  secondaryButton: {
    padding: '8px 12px',
    background: '#2196f3',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  dangerButton: {
    padding: '8px 12px',
    background: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  primaryButton: {
    padding: '12px 24px',
    background: '#e91e63',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'rgba(30, 30, 30, 0.5)',
    borderRadius: '10px',
    border: '2px dashed #444',
  },
  createForm: {
    background: 'rgba(30, 30, 30, 0.9)',
    padding: '30px',
    borderRadius: '10px',
    marginBottom: '30px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#e91e63',
  },
  input: {
    width: '100%',
    padding: '10px',
    background: '#1a1a1a',
    border: '1px solid #444',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '14px',
  },
  envGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  envRow: {
    display: 'flex',
    gap: '10px',
  },
  formActions: {
    marginTop: '30px',
  },
  successMessage: {
    marginTop: '20px',
    padding: '15px',
    background: '#4caf50',
    borderRadius: '5px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorMessage: {
    marginTop: '20px',
    padding: '15px',
    background: '#f44336',
    borderRadius: '5px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  templatesList: {
    background: 'rgba(30, 30, 30, 0.9)',
    padding: '30px',
    borderRadius: '10px',
  },
  templateCard: {
    padding: '15px',
    marginBottom: '15px',
    background: '#1a1a1a',
    border: '1px solid #444',
    borderRadius: '8px',
  },
  templateDescription: {
    color: '#aaa',
    fontSize: '14px',
    margin: '10px 0',
  },
  backupList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  backupCard: {
    background: 'rgba(30, 30, 30, 0.9)',
    border: '1px solid #444',
    borderRadius: '10px',
    padding: '20px',
  },
  backupInfo: {
    marginBottom: '15px',
  },
  backupActions: {
    display: 'flex',
    gap: '10px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1e1e1e',
    padding: '30px',
    borderRadius: '15px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    border: '1px solid #444',
  },
  code: {
    background: '#0a0a0a',
    padding: '8px 12px',
    borderRadius: '5px',
    display: 'block',
    margin: '10px 0',
    color: '#4caf50',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  logsContainer: {
    background: '#0a0a0a',
    padding: '15px',
    borderRadius: '5px',
    overflow: 'auto',
    maxHeight: '400px',
    fontSize: '12px',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
};

export default GameServerManager;