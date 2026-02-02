import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface MediaRequest {
  id: string;
  user: string;
  email: string;
  type: string;
  title: string;
  requestedAt: number;
  status: string;
  details: any;
}

interface Stats {
  total: number;
  byType: Record<string, number>;
  uniqueUsers: number;
}

export default function RequestHistory() {
  const router = useRouter();
  const [requests, setRequests] = useState<MediaRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MediaRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRequestHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, typeFilter, statusFilter, userFilter, searchQuery]);

  const fetchRequestHistory = async () => {
    try {
      const response = await fetch('/api/admin/request-history');
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch request history:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(req => req.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // User filter
    if (userFilter) {
      filtered = filtered.filter(req => 
        req.user.toLowerCase().includes(userFilter.toLowerCase())
      );
    }

    // Search query (title or email)
    if (searchQuery) {
      filtered = filtered.filter(req =>
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const getUniqueTypes = () => {
    return Array.from(new Set(requests.map(r => r.type))).sort();
  };

  const getUniqueStatuses = () => {
    return Array.from(new Set(requests.map(r => r.status))).sort();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { bg: 'rgba(255, 165, 0, 0.2)', border: '#ffa500', color: '#ffa500' };
      case 'approved':
        return { bg: 'rgba(0, 200, 255, 0.2)', border: '#00c8ff', color: '#00c8ff' };
      case 'completed':
        return { bg: 'rgba(0, 255, 0, 0.2)', border: '#00ff00', color: '#00ff00' };
      case 'rejected':
        return { bg: 'rgba(255, 0, 0, 0.2)', border: '#ff0000', color: '#ff0000' };
      default:
        return { bg: 'rgba(100, 100, 100, 0.2)', border: '#666', color: '#666' };
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MOVIE':
        return '#e5a029';
      case 'TV':
        return '#00c8ff';
      case 'BOOK':
        return '#9d4edd';
      default:
        return '#888';
    }
  };

  const exportToCSV = () => {
    const headers = ['User', 'Email', 'Type', 'Title', 'Status', 'Requested At'];
    const rows = filteredRequests.map(req => [
      req.user,
      req.email,
      req.type,
      req.title,
      req.status,
      formatDate(req.requestedAt)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `request-history-${Date.now()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading request history...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h1>Request History</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={exportToCSV}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(0, 200, 100, 0.2)',
                border: '1px solid #00c864',
                borderRadius: '5px',
                color: '#00c864',
                cursor: 'pointer'
              }}
            >
              Export CSV
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(40, 40, 40, 0.95)',
                border: '1px solid #e5a029',
                borderRadius: '5px',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'rgba(20, 20, 20, 0.95)',
              border: '1px solid #e5a029',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e5a029' }}>{stats.total}</div>
              <div style={{ color: '#888' }}>Total Requests</div>
            </div>
            <div style={{
              background: 'rgba(20, 20, 20, 0.95)',
              border: '1px solid #e5a029',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e5a029' }}>{stats.uniqueUsers}</div>
              <div style={{ color: '#888' }}>Unique Users</div>
            </div>
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} style={{
                background: 'rgba(20, 20, 20, 0.95)',
                border: `1px solid ${getTypeColor(type)}`,
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getTypeColor(type) }}>{count}</div>
                <div style={{ color: '#888' }}>{type} Requests</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{
          background: 'rgba(20, 20, 20, 0.95)',
          border: '1px solid #e5a029',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#e5a029' }}>Filters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Type:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(40, 40, 40, 0.95)',
                  border: '1px solid #e5a029',
                  borderRadius: '5px',
                  color: '#fff'
                }}
              >
                <option value="all">All Types</option>
                {getUniqueTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(40, 40, 40, 0.95)',
                  border: '1px solid #e5a029',
                  borderRadius: '5px',
                  color: '#fff'
                }}
              >
                <option value="all">All Statuses</option>
                {getUniqueStatuses().map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>User:</label>
              <input
                type="text"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Filter by username"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(40, 40, 40, 0.95)',
                  border: '1px solid #e5a029',
                  borderRadius: '5px',
                  color: '#fff',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Search:</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title or email"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(40, 40, 40, 0.95)',
                  border: '1px solid #e5a029',
                  borderRadius: '5px',
                  color: '#fff',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#888', fontSize: '0.9rem' }}>
              Showing {filteredRequests.length} of {requests.length} requests
            </div>
            <button
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setUserFilter('');
                setSearchQuery('');
              }}
              style={{
                padding: '0.4rem 0.8rem',
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid #ff0000',
                borderRadius: '5px',
                color: '#ff0000',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'rgba(20, 20, 20, 0.95)',
            border: '1px solid #e5a029'
          }}>
            <thead>
              <tr style={{ background: 'rgba(40, 40, 40, 0.95)', borderBottom: '2px solid #e5a029' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>User</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Title</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Requested</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request, index) => {
                const statusStyle = getStatusColor(request.status);
                return (
                  <tr key={request.id} style={{
                    borderBottom: '1px solid rgba(229, 160, 41, 0.2)',
                    background: index % 2 === 0 ? 'rgba(15, 15, 15, 0.5)' : 'transparent'
                  }}>
                    <td style={{ padding: '1rem' }}>
                      <div>{request.user}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>{request.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '3px',
                        background: `rgba(${request.type === 'MOVIE' ? '229, 160, 41' : request.type === 'TV' ? '0, 200, 255' : '157, 78, 221'}, 0.2)`,
                        color: getTypeColor(request.type),
                        border: `1px solid ${getTypeColor(request.type)}`,
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}>
                        {request.type}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{request.title}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '3px',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                        fontSize: '0.85rem',
                        textTransform: 'capitalize'
                      }}>
                        {request.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                      {formatDate(request.requestedAt)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#888' }}>
                      {request.details && Object.keys(request.details).length > 0 && (
                        <div style={{ maxWidth: '200px' }}>
                          {request.details.year && <div>Year: {request.details.year}</div>}
                          {request.details.author && <div>Author: {request.details.author}</div>}
                          {request.details.quality && <div>Quality: {request.details.quality}</div>}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            No requests match your filters
          </div>
        )}
      </div>
    </Layout>
  );
}
