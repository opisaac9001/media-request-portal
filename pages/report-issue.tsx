import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import Layout from '../components/Layout';
import AnimatedBackground from '../components/AnimatedBackground';

const ReportIssuePage: NextPage = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useState(() => {
    fetch('/api/auth/check', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsLoggedIn(true);
          setUsername(data.username);
        }
        setCheckingAuth(false);
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setMessageType('error');
      setMessage('You must be logged in to report an issue.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      severity: formData.get('severity'),
    };

    try {
      const response = await fetch('/api/report-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setMessageType('success');
        setMessage(result.message);
        (e.target as HTMLFormElement).reset();
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

  if (!checkingAuth && !isLoggedIn) {
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
              <div style={{ fontSize: '3em', marginBottom: '15px' }}>🐛</div>
              <h1 style={{ 
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: '700',
                margin: '0 0 10px 0',
                background: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Report an Issue
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem', margin: 0 }}>
                Help us improve by reporting bugs and issues!
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
                  You must be logged in to report an issue.
                  <br />
                  Log in or create an account to help us improve!
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
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>🐛</div>
            <h1 style={{ 
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: '700',
              margin: '0 0 10px 0',
              background: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Report an Issue
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem', margin: 0 }}>
              Help us improve by reporting bugs and issues!
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label htmlFor="title" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500',
              }}>
                Issue Title: *
              </label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                required 
                disabled={isSubmitting}
                placeholder="Brief title of the issue"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>

            <div>
              <label htmlFor="severity" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500',
              }}>
                Severity:
              </label>
              <select 
                id="severity" 
                name="severity"
                disabled={isSubmitting}
                defaultValue="medium"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  transition: 'all 0.3s ease',
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '500',
              }}>
                Description: *
              </label>
              <textarea 
                id="description" 
                name="description" 
                required
                disabled={isSubmitting}
                placeholder="Describe the issue in detail. What were you doing when it happened?"
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  transition: 'all 0.3s ease',
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
              {isSubmitting ? 'Submitting...' : 'Report Issue'}
            </button>
          </form>

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

export default ReportIssuePage;
