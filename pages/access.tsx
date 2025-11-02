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
    const data = {
      authorization_phrase: formData.get('authorization_phrase'),
      email: formData.get('email'),
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
        <h1>Request Plex Server Access</h1>
        <p>Enter the authorization phrase and your Plex email to receive access.</p>

        {message && (
          <div className={`flashes ${messageType}`}>
            {message}
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

          <label htmlFor="email">Your Plex Email:</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required 
            disabled={isSubmitting}
            placeholder="email@example.com"
          />

          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Sending Invitation...' : 'Request Access'}
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