import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import AnimatedBackground from '../components/AnimatedBackground';

interface BookRequest {
  id: string;
  title: string;
  author?: string;
  description?: string;
  requestedAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNotes?: string;
}

const BookRequestPage: NextPage = () => {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myRequests, setMyRequests] = useState<BookRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadMyRequests();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setIsLoggedIn(data.authenticated);
      if (!data.authenticated) {
        setMessage('You must be logged in to request books.');
        setMessageType('error');
      }
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyRequests = async () => {
    try {
      const response = await fetch('/api/book-requests');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMyRequests(data.requests);
        }
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      author: formData.get('author'),
      description: formData.get('description'),
    };

    try {
      const response = await fetch('/api/book-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setMessageType('success');
        setMessage(result.message);
        (e.target as HTMLFormElement).reset();
        loadMyRequests(); // Reload the list
      } else {
        setMessageType('error');
        setMessage(result.message);
      }
    } catch (error) {
      setMessageType('error');
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      pending: { backgroundColor: '#FFC107', color: '#000' },
      approved: { backgroundColor: '#4CAF50', color: '#fff' },
      rejected: { backgroundColor: '#F44336', color: '#fff' },
      completed: { backgroundColor: '#2196F3', color: '#fff' },
    };

    return (
      <span style={{
        ...styles[status],
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.85em',
        fontWeight: 'bold',
        textTransform: 'capitalize'
      }}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!isLoggedIn) {
    return (
      <Layout>
        <AnimatedBackground />
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: 'clamp(30px, 5vw, 50px)',
            maxWidth: '600px',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '3em', marginBottom: '15px' }}>📚</div>
              <h1 style={{ 
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: '700',
                margin: '0 0 10px 0',
                background: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Request Audiobooks
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem', margin: 0 }}>
                Tell us what audiobooks you'd like to see added!
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                padding: '30px 20px',
                borderRadius: '12px',
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                marginBottom: '25px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '12px'
                }}>
                  Authentication Required
                </h2>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: '1rem',
                  marginBottom: '24px',
                  lineHeight: '1.6'
                }}>
                  You must be logged in to request audiobooks.
                  <br />
                  Log in or create an account to request audiobooks.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/login" style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #5ea1f0 0%, #3b82f6 100%)',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    display: 'inline-block'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(94, 161, 240, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    Login
                  </Link>
                  <Link href="/register" style={{
                    padding: '12px 24px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    display: 'inline-block',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}>
                    Create Account
                  </Link>
                </div>
              </div>
              <Link href="/" style={{
                color: 'rgba(255, 255, 255, 0.6)',
                textDecoration: 'none',
                fontSize: '0.95rem',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}>
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    transition: 'all 0.3s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  };

  return (
    <Layout>
      <AnimatedBackground />
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: 'clamp(30px, 5vw, 50px)',
          maxWidth: '700px',
          width: '100%',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>📚</div>
            <h1 style={{ 
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: '700',
              margin: '0 0 10px 0',
              background: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Request Audiobooks
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem', margin: 0 }}>
              Tell us what audiobooks you'd like to see added!
            </p>
          </div>

          {message && (
            <div style={{
              padding: '15px 20px',
              borderRadius: '12px',
              marginBottom: '25px',
              background: messageType === 'success' 
                ? 'rgba(76, 175, 80, 0.15)' 
                : 'rgba(244, 67, 54, 0.15)',
              border: `1px solid ${messageType === 'success' 
                ? 'rgba(76, 175, 80, 0.3)' 
                : 'rgba(244, 67, 54, 0.3)'}`,
              color: messageType === 'success' ? '#4caf50' : '#f44336',
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
            <div>
              <label htmlFor="title" style={labelStyle}>Book Title: *</label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                required 
                disabled={isSubmitting}
                placeholder="Enter the book title"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="author" style={labelStyle}>Author:</label>
              <input 
                type="text" 
                id="author" 
                name="author" 
                disabled={isSubmitting}
                placeholder="Author name (optional)"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="description" style={labelStyle}>Additional Details:</label>
              <textarea 
                id="description" 
                name="description" 
                disabled={isSubmitting}
                placeholder="Any additional information (series name, narrator preference, etc.)"
                rows={4}
                style={{
                  ...inputStyle,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{
                padding: '14px 32px',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)',
                color: '#fff',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: isSubmitting ? 0.6 : 1,
                marginTop: '10px',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(94, 161, 240, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>

          {/* My Requests Section */}
          {myRequests.length > 0 && (
            <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h2 style={{ 
                marginBottom: '20px', 
                fontSize: '1.8rem',
                background: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Your Requests
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {myRequests.map(request => (
                  <div key={request.id} style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '18px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '1.2rem' }}>{request.title}</h3>
                        {request.author && (
                          <p style={{ margin: '0 0 5px 0', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.95em' }}>
                            by {request.author}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.description && (
                      <p style={{ margin: '10px 0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95em', lineHeight: '1.5' }}>
                        {request.description}
                      </p>
                    )}
                    {request.adminNotes && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        borderLeft: '3px solid #2196F3',
                        borderRadius: '6px'
                      }}>
                        <strong style={{ color: '#2196F3' }}>Admin Note:</strong>
                        <p style={{ margin: '6px 0 0 0', color: 'rgba(255, 255, 255, 0.85)' }}>
                          {request.adminNotes}
                        </p>
                      </div>
                    )}
                    <p style={{ margin: '12px 0 0 0', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.85em' }}>
                      Requested: {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <Link href="/" style={{ 
              color: '#5EA1F0', 
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'color 0.3s ease',
            }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookRequestPage;
