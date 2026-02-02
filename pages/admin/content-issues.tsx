import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import AnimatedBackground from '../../components/AnimatedBackground';

interface ContentIssue {
  id: string;
  username: string;
  userId: string;
  contentType: string;
  title: string;
  issueType: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

const ContentIssuesPage: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<ContentIssue[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/content-issues', {
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        router.push(`/admin/login?returnTo=${encodeURIComponent(router.asPath)}`);
        return;
      }

      const data = await response.json();
      if (data.success && data.issues) {
        setIssues(data.issues);
      }
    } catch (err) {
      console.error('Failed to load issues:', err);
      router.push(`/admin/login?returnTo=${encodeURIComponent(router.asPath)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (issueId: string, newStatus: 'pending' | 'resolved' | 'dismissed') => {
    try {
      const response = await fetch('/api/admin/content-issues', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ issueId, status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setIssues(issues.map(issue => 
          issue.id === issueId ? { ...issue, status: newStatus } : issue
        ));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredIssues = filter === 'all' 
    ? issues 
    : issues.filter(issue => issue.status === filter);

  const pendingCount = issues.filter(i => i.status === 'pending').length;

  if (loading) {
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
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
          }}>
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedBackground />
      <div style={{
        minHeight: '100vh',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '40px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}>
            <div style={{ marginBottom: '30px' }}>
              <button 
                onClick={() => router.push('/admin/dashboard')} 
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginBottom: '20px',
                }}
              >
                ← Back to Dashboard
              </button>

              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '10px',
              }}>
                🔧 Content Issues {pendingCount > 0 && <span style={{ color: '#FFC107' }}>({pendingCount} pending)</span>}
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem' }}>
                Manage user-reported content issues
              </p>
            </div>

            {/* Filter Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '30px',
              flexWrap: 'wrap',
            }}>
              {(['all', 'pending', 'resolved', 'dismissed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  style={{
                    padding: '10px 20px',
                    background: filter === status 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: filter === status ? '600' : '400',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && ` (${issues.filter(i => i.status === status).length})`}
                  {status === 'all' && ` (${issues.length})`}
                </button>
              ))}
            </div>

            {/* Issues List */}
            {filteredIssues.length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.7)',
              }}>
                <p style={{ fontSize: '3rem', margin: '0 0 20px 0' }}>📭</p>
                <p style={{ fontSize: '1.2rem' }}>No {filter !== 'all' ? filter : ''} issues found</p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}>
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      padding: '24px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}>
                      <div>
                        <h3 style={{
                          color: '#fff',
                          fontSize: '1.3rem',
                          fontWeight: '600',
                          margin: '0 0 8px 0',
                        }}>
                          {issue.title}
                        </h3>
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          flexWrap: 'wrap',
                          fontSize: '0.9rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                        }}>
                          <span>👤 {issue.username}</span>
                          <span>📅 {new Date(issue.createdAt).toLocaleDateString()}</span>
                          <span style={{
                            padding: '2px 8px',
                            background: 'rgba(94, 161, 240, 0.2)',
                            borderRadius: '4px',
                            color: '#5ea1f0',
                          }}>
                            {issue.contentType}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                      }}>
                        <select
                          value={issue.status}
                          onChange={(e) => handleStatusChange(issue.id, e.target.value as any)}
                          style={{
                            padding: '8px 12px',
                            background: issue.status === 'pending' 
                              ? '#FFC107' 
                              : issue.status === 'resolved' 
                              ? '#4CAF50' 
                              : '#999',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                    }}>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        margin: '0 0 8px 0',
                      }}>
                        Issue Type: {issue.issueType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                      }}>
                        {issue.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContentIssuesPage;
