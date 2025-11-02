import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

const ServiceViewer: NextPage = () => {
  const router = useRouter();
  const { service } = router.query;
  const [serviceUrl, setServiceUrl] = useState<string>('');
  const [serviceName, setServiceName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!service) return;

    const loadService = async () => {
      try {
        const response = await fetch('/api/admin/services', {
          credentials: 'include',
        });
        const result = await response.json();

        if (result.authenticated === false) {
          router.push('/admin/login');
          return;
        }

        const serviceData = result.services?.find((s: any) => 
          s.name.toLowerCase().replace(/\s+/g, '-') === service
        );

        if (serviceData) {
          setServiceUrl(serviceData.url);
          setServiceName(serviceData.name);
        } else {
          router.push('/admin/dashboard');
        }
      } catch (error) {
        console.error('Failed to load service:', error);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadService();
  }, [service, router]);

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
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#1a1a1a'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2em' }}>
          🔒 {serviceName}
        </h3>
        <button
          onClick={() => router.push('/admin/dashboard')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9em'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
      <iframe
        src={serviceUrl}
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
        }}
        title={serviceName}
      />
    </div>
  );
};

export default ServiceViewer;
