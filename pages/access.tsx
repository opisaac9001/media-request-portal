import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import Layout from '../components/Layout';
import AnimatedBackground from '../components/AnimatedBackground';

const AccessRequestPage: NextPage = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    // Validate password match
    if (password !== confirmPassword) {
      setMessageType('error');
      setMessage('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    const data = {
      invite_code: formData.get('invite_code'),
      username: formData.get('username'),
      email: formData.get('email'),
      password: password,
    };

    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setMessageType('success');
        setMessage(result.message || 'Account created and Plex invitation sent! Check your email for the Plex invitation.');
        e.currentTarget.reset();
      } else {
        setMessageType('error');
        setMessage(result.message || 'Failed to submit access request.');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('An error occurred while submitting your request.');
      console.error('Access request error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background */}
        <AnimatedBackground />

        <Link href="/" style={{
          position: 'absolute',
          top: '30px',
          left: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#fff'
          }}>
            P
          </div>
          <span style={{
            fontSize: '24px',
            fontWeight: '300',
            letterSpacing: '2px',
            color: '#5ea1f0',
            textTransform: 'uppercase'
          }}>
            PLEXUS
          </span>
        </Link>

        <div style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '500px',
          width: '100%',
          background: 'rgba(15, 25, 45, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '50px 40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(94, 161, 240, 0.2)',
          border: '1px solid rgba(94, 161, 240, 0.2)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔓</div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: '10px',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}>
              Request Plex Access
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Create an account and receive access to the Plex server
            </p>
          </div>

          {message && (
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              background: messageType === 'success' 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
              border: `1px solid ${messageType === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: messageType === 'success' ? '#10b981' : '#ef4444',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label htmlFor="invite_code" style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: '600'
              }}>Invite Code</label>
              <input
                type="text"
                id="invite_code"
                name="invite_code"
                placeholder="XXXX-XXXX-XXXX"
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid rgba(94, 161, 240, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(30, 50, 80, 0.5)',
                  color: '#fff',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#5ea1f0';
                  e.currentTarget.style.background = 'rgba(30, 50, 80, 0.7)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(94, 161, 240, 0.3)';
                  e.currentTarget.style.background = 'rgba(30, 50, 80, 0.5)';
                }}
              />
            </div>

            <div>
              <label htmlFor="username" style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: '600'
              }}>Username</label>
              <input
                type="text"
                id="username"
                name="username"
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid rgba(94, 161, 240, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(30, 50, 80, 0.5)',
                  color: '#fff',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#5ea1f0';
                  e.currentTarget.style.background = 'rgba(30, 50, 80, 0.7)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(94, 161, 240, 0.3)';
                  e.currentTarget.style.background = 'rgba(30, 50, 80, 0.5)';
                }}
              />
            </div>

            <div>
              <label htmlFor="email" style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: '600'
              }}>Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid rgba(94, 161, 240, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(30, 50, 80, 0.5)',
                  color: '#fff',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#5ea1f0';
                  e.currentTarget.style.background = 'rgba(30, 50, 80, 0.7)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(94, 161, 240, 0.3)';
                  e.currentTarget.style.background = 'rgba(30, 50, 80, 0.5)';
                }}
              />
            </div>

            <div>
              <label htmlFor="password" style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: '600'
              }}>Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={8}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid rgba(94, 161, 240, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(30, 50, 80, 0.5)',
                  color: '#fff',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#5ea1f0';
                  e.currentTarget.style.background = 'rgba(30, 50, 80, 0.7)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(94, 161, 240, 0.3)';
                  e.currentTarget.style.background = 'rgba(30, 50, 80, 0.5)';
                }}
              />
              <small style={{ 
                color: 'rgba(255, 255, 255, 0.5)', 
                fontSize: '12px', 
                display: 'block',
                marginTop: '6px'
              }}>
                At least 8 characters with uppercase, lowercase, number, and special character
              </small>
            </div>

            <div>
              <label htmlFor="confirm_password" style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: '600'
              }}>Confirm Password</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                required
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid rgba(94, 161, 240, 0.3)',
                  borderRadius: '10px',
                  background: 'rgba(30, 50, 80, 0.5)',
                  color: '#fff',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#5ea1f0';
                  e.currentTarget.style.background = 'rgba(30, 50, 80, 0.7)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(94, 161, 240, 0.3)';
                  e.currentTarget.style.background = 'rgba(30, 50, 80, 0.5)';
                }}
              />
            </div>

            {/* Funny TOS */}
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              marginTop: '8px'
            }}>
              <div style={{
                fontSize: '15px',
                fontWeight: '700',
                color: '#ffc107',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚠️ Plex Server Terms of Service
              </div>
              <div style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.6',
                marginBottom: '14px'
              }}>
                By creating a Plex account, you agree to the following terms:
              </div>
              <ul style={{
                margin: '0 0 14px 0',
                paddingLeft: '20px',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.75)',
                lineHeight: '1.7'
              }}>
                <li><strong>High Seas Acknowledgment:</strong> You understand all content was "legally acquired" during our captain's voyages. 🏴‍☠️</li>
                <li><strong>Silence Policy:</strong> You will not inform the FBI, your mom, Disney+, or any streaming executives about this treasure chest.</li>
                <li><strong>Streaming Service Roleplay:</strong> When asked, you paid for all 47 streaming services like a responsible adult.</li>
                <li><strong>Bandwidth Respect:</strong> No downloading <em>The Irishman</em> in 4K at 3 AM. Even pirates have limits.</li>
                <li><strong>Request Moderation:</strong> Requesting "every season of every show ever made" will result in being forced to walk the plank.</li>
                <li><strong>Content Rights:</strong> You may only access content you are legally entitled to use... (LOL 😂)</li>
              </ul>
              <label style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '600'
              }}>
                <input 
                  type="checkbox" 
                  required 
                  disabled={isSubmitting}
                  style={{ 
                    marginTop: '3px',
                    cursor: 'pointer',
                    accentColor: '#5ea1f0'
                  }} 
                />
                <span>I agree to these terms and promise to sail responsibly. Arrr! ⚓</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '700',
                background: isSubmitting 
                  ? 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)'
                  : 'linear-gradient(135deg, #5ea1f0 0%, #3b82f6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(94, 161, 240, 0.3)',
                marginTop: '10px'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(94, 161, 240, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(94, 161, 240, 0.3)';
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Request Access'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <Link href="/" style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}>
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccessRequestPage;