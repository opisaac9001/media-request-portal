import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import AnimatedBackground from '../../components/AnimatedBackground';

const API_BASE = '/api/admin-proxy';
const DEFAULT_TOKEN = 'change-this-to-gamesd-token';

const ServerLogs = () => {
  const router = useRouter();
  const { serverId, serverName } = router.query;
  
  const [logs, setLogs] = useState('');
  const [filter, setFilter] = useState('');
  const [tail, setTail] = useState(500);
  const [autoScroll, setAutoScroll] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const logsRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    if (!serverId) return;
    
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/v1/containers/${serverId}/logs/enhanced?tail=${tail}`, {
        headers: { 'x-gamesd-token': DEFAULT_TOKEN }
      });
      const data = await res.json();
      
      if (data.success) {
        setLogs(data.logs);
        
        if (autoScroll && logsRef.current) {
          setTimeout(() => {
            logsRef.current?.scrollTo(0, logsRef.current.scrollHeight);
          }, 100);
        }
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [serverId, tail]);

  const downloadLogs = async () => {
    if (!serverId) return;
    
    try {
      const res = await fetch(`${API_BASE}/v1/containers/${serverId}/logs/download`, {
        headers: { 'x-gamesd-token': DEFAULT_TOKEN }
      });
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${serverName || serverId}_logs.log`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download logs:', err);
    }
  };

  const filteredLogs = filter 
    ? logs.split('\n').filter(line => line.toLowerCase().includes(filter.toLowerCase())).join('\n')
    : logs;

  return (
    <Layout>
      <AnimatedBackground />
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>📜 Server Logs: {serverName || serverId}</h1>
          <button onClick={() => router.back()} style={styles.backButton}>← Back</button>
        </div>

        <div style={styles.controls}>
          <div style={styles.controlGroup}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Auto-scroll
            </label>
          </div>

          <div style={styles.controlGroup}>
            <label style={styles.label}>Tail:</label>
            <select value={tail} onChange={(e) => setTail(Number(e.target.value))} style={styles.select}>
              <option value={100}>100 lines</option>
              <option value={500}>500 lines</option>
              <option value={1000}>1000 lines</option>
              <option value={5000}>5000 lines</option>
            </select>
          </div>

          <div style={styles.controlGroup}>
            <input
              type="text"
              placeholder="Filter logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={styles.filterInput}
            />
          </div>

          <button onClick={fetchLogs} style={styles.refreshButton} disabled={refreshing}>
            🔄 {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button onClick={downloadLogs} style={styles.downloadButton}>
            💾 Download
          </button>
        </div>

        <div ref={logsRef} style={styles.logsContainer}>
          <pre style={styles.logs}>{filteredLogs || 'No logs available'}</pre>
        </div>
      </div>
    </Layout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    position: 'relative',
    zIndex: 1,
    maxWidth: '1600px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0
  },
  backButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  controls: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  label: {
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: '500'
  },
  select: {
    padding: '8px 12px',
    background: 'rgba(0, 0, 0, 0.3)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    fontSize: '0.95rem'
  },
  filterInput: {
    padding: '8px 12px',
    background: 'rgba(0, 0, 0, 0.3)',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    fontSize: '0.95rem',
    width: '300px'
  },
  refreshButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  downloadButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  logsContainer: {
    background: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '12px',
    padding: '20px',
    height: '70vh',
    overflow: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  logs: {
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all'
  }
};

export default ServerLogs;
