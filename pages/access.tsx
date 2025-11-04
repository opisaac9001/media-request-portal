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
        <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Create an account and receive access to the Plex server.</p>

        {message && (
          <div className={`flashes ${messageType}`}>
            {message}
          </div>
        )}

                <form onSubmit={handleSubmit}>
          <label htmlFor="invite_code">Invite Code</label>
          <input
            type="text"
            id="invite_code"
            name="invite_code"
            placeholder="XXXX-XXXX-XXXX"
            required
            disabled={isSubmitting}
          />

          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            required
            disabled={isSubmitting}
          />

          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            disabled={isSubmitting}
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={8}
            disabled={isSubmitting}
          />
          <small>Must be at least 8 characters with uppercase, lowercase, number, and special character</small>

          <label htmlFor="confirm_password">Confirm Password</label>
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            required
            disabled={isSubmitting}
          />

          <button type="submit" disabled={isSubmitting}>
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