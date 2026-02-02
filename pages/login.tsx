import type { NextPage } from 'next';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import AnimatedBackground from '../components/AnimatedBackground';

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

        {/* Logo */}
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

        {/* Form Container */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '450px',
          width: '100%',
          background: 'rgba(15, 25, 45, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '50px 40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(94, 161, 240, 0.2)',
          border: '1px solid rgba(94, 161, 240, 0.2)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: '10px',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}>
              Welcome Back
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '15px' }}>
              Log in to request media content
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label htmlFor="username" style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Username
              </label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                required 
                disabled={isSubmitting}
                placeholder="Enter your username"
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
              }}>
                Password
              </label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required 
                disabled={isSubmitting}
                placeholder="Enter your password"
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
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            marginTop: '30px',
            paddingTop: '30px',
            borderTop: '1px solid rgba(94, 161, 240, 0.2)'
          }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Don't have an account?{' '}
              <Link href="/register" style={{
                color: '#5ea1f0',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#7bb3f5'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#5ea1f0'}>
                Register here
              </Link>
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
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

export default LoginPage;
