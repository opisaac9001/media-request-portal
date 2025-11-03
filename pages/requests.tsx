import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import Layout from '../components/Layout';

const RequestsPage: NextPage = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useState(() => {
    // Check if user is logged in
    fetch('/api/auth/check', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsLoggedIn(true);
          setUsername(data.username);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  });

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setIsLoggedIn(false);
    setUsername('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    const formData = new FormData(e.currentTarget);
    const data = {
      authorization_phrase: formData.get('authorization_phrase') || undefined,
      content_type: formData.get('content_type'),
      title: formData.get('title'),
    };

    try {
      const response = await fetch('/api/requests', {
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

  return (
    <Layout>
      <div className="container">
        <h1>Request Content for Plex</h1>
        <p>Tell us what content you'd like to see added!</p>

        {isLoggedIn && (
          <div style={{ 
            padding: '15px 20px', 
            background: 'rgba(76, 175, 80, 0.1)', 
            borderRadius: '12px',
            border: '2px solid #4caf50',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#4caf50', fontWeight: 600 }}>
              ✓ Logged in as: {username}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 16px',
                background: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Logout
            </button>
          </div>
        )}

        {message && (
          <div className={`flashes ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLoggedIn && (
            <>
              <label htmlFor="authorization_phrase">Authorization Phrase:</label>
              <input 
                type="password" 
                id="authorization_phrase" 
                name="authorization_phrase" 
                required 
                disabled={isSubmitting}
                placeholder="Enter the secret phrase"
              />
            </>
          )}

          <label htmlFor="content_type">Content Type:</label>
          <select 
            id="content_type" 
            name="content_type" 
            required
            disabled={isSubmitting}
          >
            <option value="movie">Movie</option>
            <option value="tv_show">TV Show</option>
            <option value="anime">Anime</option>
            <option value="adult_swim">Adult Swim</option>
            <option value="saturday_cartoons">Saturday Morning Cartoons</option>
            <option value="kids_movie">Children's Movie</option>
          </select>

          <label htmlFor="title">Title:</label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            required 
            disabled={isSubmitting}
            placeholder="e.g., Inception, Breaking Bad, One Piece"
          />

          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
        <p className="back-link">
          <Link href="/">Go back to main page</Link>
        </p>
      </div>
    </Layout>
  );
};

export default RequestsPage;