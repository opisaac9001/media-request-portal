import type { NextPage } from 'next';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';

interface Service {
  name: string;
  url: string;
  description: string;
  icon: string;
}

const ManageServices: NextPage = () => {
  const [services, setServices] = useState<Service[]>([{ name: '', url: '', description: '', icon: '🔗' }]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await fetch('/api/admin/services', {
          credentials: 'include',
        });
        const result = await response.json();

        if (result.authenticated === false) {
          router.push('/admin/login');
          return;
        }

        if (result.services && result.services.length > 0) {
          setServices(result.services);
        }
      } catch (error) {
        console.error('Failed to load services:', error);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    // Filter out empty services
    const validServices = services.filter(s => s.name && s.url);

    try {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ services: validServices }),
      });

      const result = await response.json();

      if (result.success) {
        setMessageType('success');
        setMessage('Services saved successfully! Restart the container for changes to take effect.');
      } else {
        setMessageType('error');
        setMessage(result.message || 'Failed to save services');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addService = () => {
    setServices([...services, { name: '', url: '', description: '', icon: '🔗' }]);
  };

  const removeService = (index: number) => {
    const newServices = services.filter((_, i) => i !== index);
    setServices(newServices.length > 0 ? newServices : [{ name: '', url: '', description: '', icon: '🔗' }]);
  };

  const updateService = (index: number, field: keyof Service, value: string) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>Manage Protected Services</h1>
          <Link href="/admin/dashboard">
            <a className="btn secondary" style={{ margin: 0 }}>← Back to Dashboard</a>
          </Link>
        </div>
        <p>Add services that will be accessible only after admin login. These will appear on your dashboard.</p>

        {message && (
          <div className={`flashes ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {services.map((service, index) => (
            <div key={index} style={{ 
              padding: '20px', 
              background: '#f9f9f9', 
              borderRadius: '12px', 
              marginTop: '20px',
              border: '2px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#667eea' }}>Service {index + 1}</h3>
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    style={{
                      background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                      padding: '8px 16px',
                      fontSize: '14px',
                      margin: 0
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <label htmlFor={`name-${index}`}>Service Name *:</label>
              <input
                type="text"
                id={`name-${index}`}
                value={service.name}
                onChange={(e) => updateService(index, 'name', e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g., Sonarr, Radarr, Portainer"
                required
              />

              <label htmlFor={`url-${index}`}>Service URL *:</label>
              <input
                type="url"
                id={`url-${index}`}
                value={service.url}
                onChange={(e) => updateService(index, 'url', e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g., http://192.168.1.100:8989"
                required
              />

              <label htmlFor={`description-${index}`}>Description:</label>
              <input
                type="text"
                id={`description-${index}`}
                value={service.description}
                onChange={(e) => updateService(index, 'description', e.target.value)}
                disabled={isSubmitting}
                placeholder="Brief description of the service"
              />

              <label htmlFor={`icon-${index}`}>Icon (Emoji):</label>
              <input
                type="text"
                id={`icon-${index}`}
                value={service.icon}
                onChange={(e) => updateService(index, 'icon', e.target.value)}
                disabled={isSubmitting}
                placeholder="🔗"
                maxLength={2}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addService}
            className="btn tertiary"
            disabled={isSubmitting}
            style={{ marginTop: '20px', width: 'auto' }}
          >
            ➕ Add Another Service
          </button>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Services'}
          </button>
        </form>

        <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', borderRadius: '12px', border: '1px solid #ffc107' }}>
          <strong>💡 Common Services:</strong>
          <ul style={{ marginTop: '10px', marginBottom: 0 }}>
            <li>📺 Sonarr (TV Shows)</li>
            <li>🎬 Radarr (Movies)</li>
            <li>🐳 Portainer (Docker Management)</li>
            <li>📊 Grafana (Monitoring)</li>
            <li>🌐 Pi-hole (DNS/Ad Blocking)</li>
            <li>📁 Nextcloud (File Storage)</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default ManageServices;
