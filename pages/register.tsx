import type { NextPage } from 'next';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';

const RegisterPage: NextPage = () => {
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
      const response = await fetch('/api/auth/register', {
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
        setMessage('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
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
        <h1>Create Account</h1>
        <p>You need an invite code from the admin to create an account. Once registered, you can request media content without entering the authorization phrase each time.</p>

        {message && (
          <div className={`flashes ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="invite_code">Invite Code:</label>
          <input 
            type="text" 
            id="invite_code" 
            name="invite_code" 
            required 
            disabled={isSubmitting}
            placeholder="Enter your invite code (e.g., XXXX-XXXX-XXXX)"
            style={{ textTransform: 'uppercase' }}
          />

          <label htmlFor="username">Username:</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            required 
            disabled={isSubmitting}
            placeholder="Choose a username"
            pattern="[a-zA-Z0-9_-]+"
            title="Only letters, numbers, underscores and hyphens allowed"
            minLength={3}
          />

          <label htmlFor="email">Email:</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required 
            disabled={isSubmitting}
            placeholder="email@example.com"
          />

          <label htmlFor="password">Password:</label>
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
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account? <Link href="/login" style={{ color: '#667eea', fontWeight: '600' }}>Login here</Link>
        </p>

        <p className="back-link">
          <Link href="/">Go back to main page</Link>
        </p>
      </div>
    </Layout>
  );
};

export default RegisterPage;
