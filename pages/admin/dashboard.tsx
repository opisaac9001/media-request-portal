import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import AnimatedBackground from '../../components/AnimatedBackground';

interface Service {
  name: string;
  url: string;
  description: string;
  icon: string;
}

const AdminDashboard: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [pendingBookRequests, setPendingBookRequests] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/settings', {
          credentials: 'include',
        });
        const result = await response.json();

        if (result.authenticated === false) {
          router.push('/admin/login');
          return;
        }

        // Load services from environment or settings
        const servicesResponse = await fetch('/api/admin/services', {
          credentials: 'include',
        });
        const servicesData = await servicesResponse.json();
        
        if (servicesData.services) {
          setServices(servicesData.services);
        }

        // Load book requests count
        const bookRequestsResponse = await fetch('/api/admin/book-requests', {
          credentials: 'include',
        });
        const bookRequestsData = await bookRequestsResponse.json();
        
        if (bookRequestsData.success && bookRequestsData.requests) {
          const pending = bookRequestsData.requests.filter((r: any) => r.status === 'pending').length;
          setPendingBookRequests(pending);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <Layout>
        <AnimatedBackground />
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <p style={{ color: '#fff', fontSize: '1.2rem' }}>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedBackground />
      <div style={{
        minHeight: '100vh',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: 'clamp(30px, 5vw, 50px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>🔐</div>
            <h1 style={{ 
              fontSize: 'clamp(2rem, 5vw, 2.8rem)',
              fontWeight: '700',
              margin: '0 0 10px 0',
              background: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Admin Dashboard
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem', margin: 0 }}>
              Manage your portal and protected services
            </p>
          </div>

          <div style={{ 
            marginTop: '30px', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px' 
          }}>
            {[
              { label: '⚙️ Settings', onClick: () => router.push('/admin/settings'), gradient: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)' },
              { label: '🔗 Services', onClick: () => router.push('/admin/services'), gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
              { label: '🎧 AudiobookShelf', onClick: () => router.push('/admin/audiobookshelf-users'), gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
              { label: '🎫 Invite Codes', onClick: () => router.push('/admin/invite-codes'), gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
              { label: '👥 Users', onClick: () => router.push('/admin/users'), gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
              { label: '📚 Book Requests', onClick: () => router.push('/admin/book-requests'), gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', badge: pendingBookRequests },
              { label: '📊 History', onClick: () => router.push('/admin/request-history'), gradient: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)' },
              { label: '🚪 Logout', onClick: handleLogout, gradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' },
            ].map((btn, idx) => (
              <button 
                key={idx}
                onClick={btn.onClick}
                style={{
                  padding: '16px 20px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: 'none',
                  background: btn.gradient,
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(94, 161, 240, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {btn.label}
                {btn.badge && btn.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#FF4444',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75em',
                    fontWeight: 'bold',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    {btn.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <h2 style={{ 
            marginTop: '40px', 
            fontSize: '1.8rem',
            background: 'linear-gradient(135deg, #5EA1F0 0%, #9B72F2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Protected Services
          </h2>
          
          <div style={{ 
            padding: '15px 20px', 
            background: 'rgba(102, 126, 234, 0.1)', 
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            marginBottom: '20px',
            marginTop: '20px',
          }}>
            <p style={{ margin: 0, color: '#667eea', fontWeight: 600 }}>
              💡 <strong>Tip:</strong> Use the same password for these services that you used to log in here for seamless access.
            </p>
          </div>
        
          {services.length === 0 ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
              No services configured yet. Go to Settings to add services.
            </p>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '20px', 
              marginTop: '20px' 
            }}>
            {services.map((service, index) => (
              <a
                key={index}
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '25px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'block',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(94, 161, 240, 0.3)';
                  e.currentTarget.style.borderColor = '#5EA1F0';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                <div style={{ fontSize: '2em', marginBottom: '10px' }}>{service.icon}</div>
                <h3 style={{ 
                  color: '#5EA1F0', 
                  marginBottom: '8px', 
                  marginTop: '0',
                  fontWeight: '600',
                }}>{service.name}</h3>
                <p style={{ margin: '0', fontSize: '0.9em', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {service.description}
                </p>
                <p style={{ margin: '10px 0 0 0', fontSize: '0.8em', color: 'rgba(255, 255, 255, 0.5)' }}>
                  🔗 Opens in new tab
                </p>
              </a>
            ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
