import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import Layout from '../components/Layout';
import AnimatedBackground from '../components/AnimatedBackground';

const AudiobooksAccessPage: NextPage = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [tosAccepted, setTosAccepted] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMessageType('');
    setCredentials(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    // Validate TOS acceptance
    if (!tosAccepted) {
      setMessageType('error');
      setMessage('You must agree to the Terms of Service to continue.');
      setIsSubmitting(false);
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setMessageType('error');
      setMessage('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    const data = {
      invite_code: formData.get('invite_code'),
      email: formData.get('email'),
      username: formData.get('username'),
      password: password,
    };

    try {
      const response = await fetch('/api/audiobooks', {
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
        if (result.credentials) {
          setCredentials(result.credentials);
        }
        if (result.serverUrl) {
          setServerUrl(result.serverUrl);
        }
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
              Request AudiobookShelf Access
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem', margin: 0 }}>
              Get access to the audiobook library
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

          {credentials && (
            <div style={{
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '25px',
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#4caf50' }}>🎉 Your AudiobookShelf Credentials</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: '8px 0' }}>
                <strong>Username:</strong> {credentials.username}
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: '8px 0' }}>
                <strong>Password:</strong> {credentials.password}
              </p>
              {serverUrl && (
                <>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: '8px 0' }}>
                    <strong>Server URL:</strong> {serverUrl}
                  </p>
                  <div style={{ 
                    marginTop: '15px', 
                    padding: '15px', 
                    backgroundColor: 'rgba(33, 150, 243, 0.1)', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(33, 150, 243, 0.3)' 
                  }}>
                    <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#2196F3' }}>
                      📱 Connecting with Plappa App:
                    </p>
                    <ol style={{ margin: '0', paddingLeft: '20px', color: 'rgba(255, 255, 255, 0.9)' }}>
                      <li>Download Plappa from App Store or Google Play</li>
                      <li>Open Plappa and tap "Add Server"</li>
                      <li>Enter Server URL: <code style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '3px' }}>{serverUrl}</code></li>
                      <li>Enter your username and password from above</li>
                      <li>Tap "Connect"</li>
                    </ol>
                    <p style={{ margin: '10px 0 0 0', fontSize: '0.9em', color: 'rgba(255, 255, 255, 0.7)' }}>
                      💡 <strong>Tip:</strong> Download books for offline listening to save bandwidth!
                    </p>
                  </div>
                </>
              )}
              <p style={{ margin: '15px 0 0 0', color: '#FFC107', fontSize: '0.95em' }}>
                ⚠️ Save these credentials! You'll need them to log into AudiobookShelf.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label htmlFor="invite_code" style={labelStyle}>Invite Code:</label>
              <input 
                type="text" 
                id="invite_code" 
                name="invite_code" 
                required 
                disabled={isSubmitting}
                placeholder="XXXX-XXXX-XXXX"
                style={{ ...inputStyle, textTransform: 'uppercase' }}
              />
            </div>

            <div>
              <label htmlFor="username" style={labelStyle}>Desired Username:</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                required 
                disabled={isSubmitting}
                placeholder="Choose a username"
                pattern="[a-zA-Z0-9_-]+"
                title="Only letters, numbers, underscores and hyphens allowed"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="email" style={labelStyle}>Your Email:</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                disabled={isSubmitting}
                placeholder="email@example.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="password" style={labelStyle}>Create Password:</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required 
                disabled={isSubmitting}
                placeholder="Choose a secure password"
                minLength={8}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}"
                title="Password must be at least 8 characters and contain: uppercase, lowercase, number, and special character (@$!%*?&)"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="confirm_password" style={labelStyle}>Confirm Password:</label>
              <input 
                type="password" 
                id="confirm_password" 
                name="confirm_password" 
                required 
                disabled={isSubmitting}
                placeholder="Re-enter your password"
                style={inputStyle}
              />
              <small style={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginTop: '6px', fontSize: '0.9em' }}>
                Password must be at least 8 characters and include: uppercase, lowercase, number, and special character (@$!%*?&)
              </small>
            </div>

            {/* Terms of Service */}
            <div style={{ 
              marginTop: '10px',
              padding: '15px', 
              backgroundColor: 'rgba(255, 193, 7, 0.1)', 
              border: '1px solid rgba(255, 193, 7, 0.3)', 
              borderRadius: '12px' 
            }}>
              <h3 style={{ marginTop: '0', marginBottom: '12px', color: '#FFC107', fontSize: '1.1em' }}>
                ⚠️ AudiobookShelf Terms of Service
              </h3>
              <div style={{ 
                color: 'rgba(255, 255, 255, 0.85)', 
                fontSize: '0.9em', 
                lineHeight: '1.6',
                marginBottom: '15px'
              }}>
                <p style={{ marginTop: '0' }}>By creating an AudiobookShelf account, you agree to the following terms:</p>
                <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                  <li><strong>Required App:</strong> You must use the Plappa mobile app to access AudiobookShelf.</li>
                  <li><strong>Download Only:</strong> You must download audiobooks to your device before listening. Streaming over the network is prohibited.</li>
                  <li><strong>Personal Use:</strong> Your account is for personal use only and may not be shared with others.</li>
                  <li><strong>Bandwidth Compliance:</strong> To maintain service availability for all users, excessive streaming will result in account suspension.</li>
                  <li><strong>Content Rights:</strong> You may only access content you are legally entitled to use... (LOL)</li>
                  <li><strong>Account Termination:</strong> Violation of these terms may result in immediate account termination without notice.</li>
                </ul>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="tos_agreement" 
                  checked={tosAccepted}
                  onChange={(e) => setTosAccepted(e.target.checked)}
                  disabled={isSubmitting}
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    cursor: 'pointer',
                    accentColor: '#FFC107'
                  }}
                />
                <label 
                  htmlFor="tos_agreement" 
                  style={{ 
                    margin: '0', 
                    cursor: 'pointer', 
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontWeight: '500',
                    userSelect: 'none'
                  }}
                >
                  I have read and agree to the Terms of Service
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !tosAccepted}
              style={{
                padding: '14px 32px',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)',
                color: '#fff',
                cursor: (isSubmitting || !tosAccepted) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: (isSubmitting || !tosAccepted) ? 0.6 : 1,
                marginTop: '10px',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && tosAccepted) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(94, 161, 240, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isSubmitting ? 'Creating Account...' : 'Request Access'}
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

export default AudiobooksAccessPage;
