import type { NextPage } from 'next';
import Link from 'next/link';
import Layout from '../components/Layout';

const Home: NextPage = () => {
  return (
    <Layout>
      <div className="container">
        <h1>Welcome to the Media Portal</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '10px' }}>
          What would you like to do today?
        </p>
        
        <div style={{ 
          padding: '15px 20px', 
          background: 'rgba(102, 126, 234, 0.1)', 
          borderRadius: '12px',
          border: '2px solid #667eea',
          marginBottom: '25px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 10px 0', color: '#667eea', fontWeight: 600 }}>
            👤 Have an invite code? Create an account to request media without entering the authorization phrase each time!
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              padding: '8px 20px',
              background: '#667eea',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9em'
            }}>
              Register
            </Link>
            <Link href="/login" style={{
              padding: '8px 20px',
              background: '#764ba2',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9em'
            }}>
              Login
            </Link>
          </div>
        </div>

        <div className="options">
          <Link href="/access" className="btn">
            🎬 Request Plex Access
          </Link>
          <Link href="/requests" className="btn secondary">
            📺 Request Media Content
          </Link>
          <Link href="/audiobooks" className="btn tertiary">
            🎧 Request Audiobook Access
          </Link>
          <a href="#" className="btn quaternary disabled">🎮 Game Servers (Coming Soon)</a>
        </div>
        <Link href="/admin/login" className="admin-link">
          ⚙️ Admin Settings
        </Link>
      </div>
    </Layout>
  );
};

export default Home;