import type { NextPage } from 'next';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';

const LoginPage: NextPage = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get('username'),
      password: formData.get('password'),
    };

    try {
      const response = await fetch('/api/auth/login', {
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
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          router.push('/requests');
        }, 1000);
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
        <h1>User Login</h1>
        <p>Log in to request media content.</p>

        {message && (
          <div className={`flashes ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username:</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            required 
            disabled={isSubmitting}
            placeholder="Enter your username"
          />

          <label htmlFor="password">Password:</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            required 
            disabled={isSubmitting}
            placeholder="Enter your password"
          />

          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Don't have an account? <Link href="/register" style={{ color: '#667eea', fontWeight: '600' }}>Register here</Link>
        </p>

        <p className="back-link">
          <Link href="/">Go back to main page</Link>
        </p>
      </div>
    </Layout>
  );
};

export default LoginPage;
