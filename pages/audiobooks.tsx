import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import Layout from '../components/Layout';

const AudiobooksAccessPage: NextPage = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMessageType('');
    setCredentials(null);

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
      authorization_phrase: formData.get('authorization_phrase'),
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
        <h1>Request AudiobookShelf Access</h1>
        <p>Get access to the audiobook library. Enter the authorization phrase and your details.</p>

        {message && (
          <div className={`flashes ${messageType}`}>
            {message}
          </div>
        )}

        {credentials && (
          <div className="credentials-box">
            <h3>🎉 Your AudiobookShelf Credentials</h3>
            <p><strong>Username:</strong> {credentials.username}</p>
            <p><strong>Password:</strong> {credentials.password}</p>
            <p className="note">⚠️ Save these credentials! You'll need them to log into AudiobookShelf.</p>
            <p className="note">📱 For Plappa app, use the server URL provided by the admin.</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="authorization_phrase">Authorization Phrase:</label>
          <input 
            type="password" 
            id="authorization_phrase" 
            name="authorization_phrase" 
            required 
            disabled={isSubmitting}
            placeholder="Enter the secret phrase"
          />

          <label htmlFor="username">Desired Username:</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            required 
            disabled={isSubmitting}
            placeholder="Choose a username"
            pattern="[a-zA-Z0-9_-]+"
            title="Only letters, numbers, underscores and hyphens allowed"
          />

          <label htmlFor="email">Your Email:</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required 
            disabled={isSubmitting}
            placeholder="email@example.com"
          />

          <label htmlFor="password">Create Password:</label>
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
          />

          <label htmlFor="confirm_password">Confirm Password:</label>
          <input 
            type="password" 
            id="confirm_password" 
            name="confirm_password" 
            required 
            disabled={isSubmitting}
            placeholder="Re-enter your password"
          />

          <small style={{ color: '#666', marginTop: '-10px', marginBottom: '15px' }}>
            Password must be at least 8 characters and include: uppercase, lowercase, number, and special character (@$!%*?&)
          </small>

          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Request Access'}
          </button>
        </form>
        <p className="back-link">
          <Link href="/">Go back to main page</Link>
        </p>
      </div>
    </Layout>
  );
};

export default AudiobooksAccessPage;
