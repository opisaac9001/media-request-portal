import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';

interface AudiobookShelfUser {
  id: string;
  username: string;
  email?: string;
  type: string;
  isActive: boolean;
  createdAt: number;
  lastSeen?: number;
  librariesAccessible?: string[];
}

const AudiobookShelfUsersPage: NextPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<AudiobookShelfUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/audiobookshelf-users', {
        credentials: 'include',
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setMessageType('error');
        setMessage(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Error fetching AudiobookShelf users');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/audiobookshelf-users?userId=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setMessageType('success');
        setMessage(`User "${username}" deleted successfully`);
        fetchUsers(); // Refresh the list
      } else {
        setMessageType('error');
        setMessage(data.message || 'Failed to delete user');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Error deleting user');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Layout>
      <div className="container">
        <h1>AudiobookShelf Users</h1>
        <p style={{ textAlign: 'center', marginBottom: '30px' }}>
          Manage AudiobookShelf user accounts
        </p>

        {message && (
          <div className={`flashes ${messageType}`}>
            {message}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading users...</p>
        ) : (
          <>
            <div style={{ marginBottom: '20px', textAlign: 'center', color: '#666' }}>
              <strong>Total Users:</strong> {users.length}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Username</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Type</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Created</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Last Seen</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '15px' }}>
                          <strong>{user.username}</strong>
                        </td>
                        <td style={{ padding: '15px' }}>{user.email || 'N/A'}</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background: user.type === 'admin' ? '#667eea' : '#e0e0e0',
                            color: user.type === 'admin' ? '#fff' : '#666',
                            fontSize: '0.85em',
                            fontWeight: '600'
                          }}>
                            {user.type}
                          </span>
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background: user.isActive ? '#4caf50' : '#f44336',
                            color: '#fff',
                            fontSize: '0.85em',
                            fontWeight: '600'
                          }}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '15px', fontSize: '0.9em', color: '#666' }}>
                          {formatDate(user.createdAt)}
                        </td>
                        <td style={{ padding: '15px', fontSize: '0.9em', color: '#666' }}>
                          {user.lastSeen ? formatDate(user.lastSeen) : 'Never'}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          {user.type !== 'admin' && (
                            <button
                              onClick={() => deleteUser(user.id, user.username)}
                              style={{
                                padding: '6px 12px',
                                background: '#f44336',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85em',
                                fontWeight: '600'
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <Link href="/admin/dashboard" className="btn secondary">
            ← Back to Dashboard
          </Link>
          <button onClick={fetchUsers} className="btn">
            🔄 Refresh
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AudiobookShelfUsersPage;
