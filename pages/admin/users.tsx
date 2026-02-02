import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface User {
  username: string;
  email: string;
  createdAt: number;
  lastLogin?: number;
  isActive: boolean;
  isAdmin?: boolean;
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  // Password reset modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const openResetModal = (username: string) => {
    setResetUsername(username);
    setNewPassword('');
    setConfirmPassword('');
    setResetModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showMessage('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: resetUsername,
          action: 'reset_password',
          newPassword: newPassword
        })
      });

      const data = await response.json();
      if (data.success) {
        showMessage(`Password reset for ${resetUsername}`, 'success');
        setResetModalOpen(false);
        setResetUsername('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showMessage(data.message || 'Failed to reset password', 'error');
      }
    } catch (error) {
      showMessage('Error resetting password', 'error');
    }
  };

  const toggleUserStatus = async (username: string, currentStatus: boolean) => {
    const action = currentStatus ? 'disable' : 'enable';
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          action: action
        })
      });

      const data = await response.json();
      if (data.success) {
        showMessage(`User ${action}d successfully`, 'success');
        fetchUsers();
      } else {
        showMessage(data.message || `Failed to ${action} user`, 'error');
      }
    } catch (error) {
      showMessage(`Error ${action}ing user`, 'error');
    }
  };

  const deleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const data = await response.json();
      if (data.success) {
        showMessage('User deleted successfully', 'success');
        fetchUsers();
      } else {
        showMessage(data.message || 'Failed to delete user', 'error');
      }
    } catch (error) {
      showMessage('Error deleting user', 'error');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading users...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>User Management</h1>
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

        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: messageType === 'success' ? 'rgba(0, 200, 0, 0.2)' : 'rgba(200, 0, 0, 0.2)',
            border: `1px solid ${messageType === 'success' ? '#00ff00' : '#ff0000'}`,
            borderRadius: '5px',
            color: messageType === 'success' ? '#00ff00' : '#ff0000'
          }}>
            {message}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'rgba(20, 20, 20, 0.95)',
            border: '1px solid #e5a029'
          }}>
            <thead>
              <tr style={{ background: 'rgba(40, 40, 40, 0.95)', borderBottom: '2px solid #e5a029' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Username</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Last Login</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.username} style={{
                  borderBottom: '1px solid rgba(229, 160, 41, 0.2)',
                  background: index % 2 === 0 ? 'rgba(15, 15, 15, 0.5)' : 'transparent'
                }}>
                  <td style={{ padding: '1rem' }}>
                    {user.username}
                    {user.isAdmin && (
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.2rem 0.5rem',
                        background: '#e5a029',
                        color: '#000',
                        borderRadius: '3px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        ADMIN
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>{user.email}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{formatDate(user.createdAt)}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '3px',
                      background: user.isActive ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                      color: user.isActive ? '#00ff00' : '#ff0000',
                      border: `1px solid ${user.isActive ? '#00ff00' : '#ff0000'}`,
                      fontSize: '0.85rem'
                    }}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => openResetModal(user.username)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: 'rgba(0, 100, 255, 0.2)',
                          border: '1px solid #0064ff',
                          borderRadius: '3px',
                          color: '#0064ff',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.username, user.isActive)}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: user.isActive ? 'rgba(255, 165, 0, 0.2)' : 'rgba(0, 255, 0, 0.2)',
                          border: `1px solid ${user.isActive ? '#ffa500' : '#00ff00'}`,
                          borderRadius: '3px',
                          color: user.isActive ? '#ffa500' : '#00ff00',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        {user.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteUser(user.username)}
                        disabled={user.isAdmin}
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: user.isAdmin ? 'rgba(100, 100, 100, 0.2)' : 'rgba(255, 0, 0, 0.2)',
                          border: `1px solid ${user.isAdmin ? '#666' : '#ff0000'}`,
                          borderRadius: '3px',
                          color: user.isAdmin ? '#666' : '#ff0000',
                          cursor: user.isAdmin ? 'not-allowed' : 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            No users found
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {resetModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(20, 20, 20, 0.98)',
            border: '2px solid #e5a029',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2 style={{ marginTop: 0, color: '#e5a029' }}>Reset Password for {resetUsername}</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(40, 40, 40, 0.95)',
                  border: '1px solid #e5a029',
                  borderRadius: '5px',
                  color: '#fff',
                  boxSizing: 'border-box'
                }}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm Password:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(40, 40, 40, 0.95)',
                  border: '1px solid #e5a029',
                  borderRadius: '5px',
                  color: '#fff',
                  boxSizing: 'border-box'
                }}
                placeholder="Re-enter password"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleResetPassword}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#e5a029',
                  border: 'none',
                  borderRadius: '5px',
                  color: '#000',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Reset Password
              </button>
              <button
                onClick={() => {
                  setResetModalOpen(false);
                  setResetUsername('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(255, 0, 0, 0.2)',
                  border: '1px solid #ff0000',
                  borderRadius: '5px',
                  color: '#ff0000',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
