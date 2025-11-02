import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface Service {
  name: string;
  url: string;
  description: string;
  icon: string;
}

const AdminDashboard: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
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
        <div className="container">
          <h1>Loading...</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <h1>🔐 Admin Dashboard</h1>
        <p>Welcome to your secure admin portal. Access your protected services below.</p>

        <div style={{ marginTop: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/admin/settings')} className="btn secondary">
            ⚙️ Settings
          </button>
          <button onClick={handleLogout} className="btn" style={{ background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' }}>
            🚪 Logout
          </button>
        </div>

        <h2 style={{ marginTop: '40px' }}>Protected Services</h2>
        
        {services.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic' }}>
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
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  border: '2px solid #e0e0e0',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.2)';
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                <div style={{ fontSize: '2em', marginBottom: '10px' }}>{service.icon}</div>
                <h3 style={{ color: '#667eea', marginBottom: '8px', marginTop: '0' }}>{service.name}</h3>
                <p style={{ margin: '0', fontSize: '0.9em', color: '#666' }}>{service.description}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
