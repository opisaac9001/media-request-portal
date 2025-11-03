import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';

interface InviteCode {
  code: string;
  createdAt: number;
  createdBy: string;
  usedBy?: string;
  usedAt?: number;
  usedFor?: 'plex' | 'registration';
  isActive: boolean;
}

const InviteCodesPage: NextPage = () => {
  const router = useRouter();
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    fetchInviteCodes();
  }, []);

  const fetchInviteCodes = async () => {
    try {
      const response = await fetch('/api/admin/invite-codes', {
        credentials: 'include',
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setInviteCodes(data.codes || []);
      } else {
        setMessageType('error');
        setMessage(data.message || 'Failed to fetch invite codes');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Error fetching invite codes');
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async () => {
    try {
      const response = await fetch('/api/admin/invite-codes', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setMessageType('success');
        setMessage(`New invite code generated: ${data.code}`);
        fetchInviteCodes();
      } else {
        setMessageType('error');
        setMessage(data.message || 'Failed to generate invite code');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Error generating invite code');
    }
  };

  const revokeInviteCode = async (code: string) => {
    if (!confirm(`Are you sure you want to revoke invite code "${code}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/invite-codes?code=${code}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setMessageType('success');
        setMessage(`Invite code "${code}" revoked successfully`);
        fetchInviteCodes();
      } else {
        setMessageType('error');
        setMessage(data.message || 'Failed to revoke invite code');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Error revoking invite code');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessageType('success');
    setMessage('Invite code copied to clipboard!');
    setTimeout(() => setMessage(''), 3000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const activeCount = inviteCodes.filter(c => c.isActive && !c.usedBy).length;
  const usedCount = inviteCodes.filter(c => c.usedBy).length;

  return (
    <Layout>
      <div className="container">
        <h1>User Invite Codes</h1>
        <p style={{ textAlign: 'center', marginBottom: '30px' }}>
          Manage invite codes for user registration and Plex access
        </p>
        <p style={{ textAlign: 'center', marginBottom: '30px', fontSize: '0.9em', color: 'rgba(255,255,255,0.7)' }}>
          Each code can be used once for either Plex access (creates account + sends Plex invite) or registration (creates account only)
        </p>

        {message && (
          <div className={`flashes ${messageType}`}>
            {message}
          </div>
        )}

        <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ 
            padding: '15px 25px', 
            background: 'rgba(76, 175, 80, 0.1)', 
            borderRadius: '12px',
            border: '2px solid #4caf50'
          }}>
            <strong style={{ color: '#4caf50' }}>Active: {activeCount}</strong>
          </div>
          <div style={{ 
            padding: '15px 25px', 
            background: 'rgba(158, 158, 158, 0.1)', 
            borderRadius: '12px',
            border: '2px solid #9e9e9e'
          }}>
            <strong style={{ color: '#666' }}>Used: {usedCount}</strong>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <button onClick={generateInviteCode} className="btn">
            ➕ Generate New Invite Code
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading invite codes...</p>
        ) : (
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
                  <th style={{ padding: '15px', textAlign: 'left' }}>Invite Code</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Created</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Used By</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Used For</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Used At</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inviteCodes.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                      No invite codes yet. Generate one to get started!
                    </td>
                  </tr>
                ) : (
                  inviteCodes.map((code) => (
                    <tr key={code.code} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '15px', fontFamily: 'monospace', fontSize: '0.95em' }}>
                        <strong>{code.code}</strong>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {code.usedBy ? (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background: '#9e9e9e',
                            color: '#fff',
                            fontSize: '0.85em',
                            fontWeight: '600'
                          }}>
                            Used
                          </span>
                        ) : code.isActive ? (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background: '#4caf50',
                            color: '#fff',
                            fontSize: '0.85em',
                            fontWeight: '600'
                          }}>
                            Active
                          </span>
                        ) : (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background: '#f44336',
                            color: '#fff',
                            fontSize: '0.85em',
                            fontWeight: '600'
                          }}>
                            Revoked
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '15px', fontSize: '0.9em', color: '#666' }}>
                        {formatDate(code.createdAt)}
                      </td>
                      <td style={{ padding: '15px', fontSize: '0.9em', color: '#666' }}>
                        {code.usedBy || '-'}
                      </td>
                      <td style={{ padding: '15px', fontSize: '0.9em', color: '#666' }}>
                        {code.usedFor ? (
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '8px',
                            background: code.usedFor === 'plex' ? '#E91E63' : '#2196F3',
                            color: '#fff',
                            fontSize: '0.85em',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {code.usedFor === 'plex' ? '🎬 Plex' : '📝 Registration'}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '15px', fontSize: '0.9em', color: '#666' }}>
                        {code.usedAt ? formatDate(code.usedAt) : '-'}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {!code.usedBy && (
                            <button
                              onClick={() => copyToClipboard(code.code)}
                              style={{
                                padding: '6px 12px',
                                background: '#667eea',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85em',
                                fontWeight: '600'
                              }}
                            >
                              📋 Copy
                            </button>
                          )}
                          {code.isActive && !code.usedBy && (
                            <button
                              onClick={() => revokeInviteCode(code.code)}
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
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <Link href="/admin/dashboard" className="btn secondary">
            ← Back to Dashboard
          </Link>
          <button onClick={fetchInviteCodes} className="btn">
            🔄 Refresh
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default InviteCodesPage;
