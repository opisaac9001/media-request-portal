import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import Layout from '../components/Layout';

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
      <div className="container">
        <h1>Request Plex Server Access</h1>
        <p>Create an account and receive access to the Plex server.</p>

        {message && (
          <div className={`flashes ${messageType}`}>
            {message}
          </div>
        )}

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="invite_code" style={{ 
              display: 'block', 
              marginBottom: '8px',
              color: 'white',
              fontWeight: '500'
            }}>
              Invite Code
            </label>
            <input
              type="text"
              id="invite_code"
              name="invite_code"
              placeholder="XXXX-XXXX-XXXX"
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '16px',
                transition: 'all 0.3s ease',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="username" style={{ 
              display: 'block', 
              marginBottom: '8px',
              color: 'white',
              fontWeight: '500'
            }}>
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '16px',
                transition: 'all 0.3s ease',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{ 
              display: 'block', 
              marginBottom: '8px',
              color: 'white',
              fontWeight: '500'
            }}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '16px',
                transition: 'all 0.3s ease',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="password" style={{ 
              display: 'block', 
              marginBottom: '8px',
              color: 'white',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '16px',
                transition: 'all 0.3s ease',
              }}
            />
            <small style={{ 
              display: 'block', 
              marginTop: '5px', 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px'
            }}>
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="confirm_password" style={{ 
              display: 'block', 
              marginBottom: '8px',
              color: 'white',
              fontWeight: '500'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '16px',
                transition: 'all 0.3s ease',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px',
              background: isSubmitting 
                ? 'rgba(255, 255, 255, 0.3)' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              marginBottom: '15px',
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Request Access'}
          </button>
        </form>

        <p className="back-link">
          <Link href="/">Go back to main page</Link>
        </p>
      </div>
    </Layout>
  );
};

export default AccessRequestPage;