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
        <div className="options">
          <Link href="/access" className="btn">
            🎬 Request Plex Access
          </Link>
          <Link href="/requests" className="btn secondary">
            📺 Request Media Content
          </Link>
          <a href="#" className="btn tertiary disabled">🎧 Audiobooks (Coming Soon)</a>
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