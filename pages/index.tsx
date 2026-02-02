import type { NextPage } from 'next';
import Link from 'next/link';
import Layout from '../components/Layout';
import AnimatedBackground from '../components/AnimatedBackground';

const Home: NextPage = () => {
  return (
    <Layout>
      <div style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background */}
        <AnimatedBackground />
        
        {/* Plexus Logo */}
        <div style={{
          position: 'absolute',
          top: '30px',
          left: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
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
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0, 212, 255, 0.3)'
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
        </div>

        {/* Main Content */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '120px 20px 60px',
          textAlign: 'center'
        }}>
          {/* Main Heading */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '20px',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            lineHeight: '1.2'
          }}>
            Hello,
          </h1>
          <h2 style={{
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            fontWeight: '400',
            color: '#ffffff',
            marginBottom: '60px',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            lineHeight: '1.2'
          }}>
            Are you here to...?
          </h2>

          {/* Action Cards */}
                    {/* Main Action Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginTop: '50px',
            maxWidth: '1200px'
          }}>
            {/* Request Content Card */}
            <Link href="/requests" style={{
              textDecoration: 'none',
              background: 'rgba(15, 25, 45, 0.85)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '40px 30px',
              border: '2px solid rgba(251, 146, 60, 0.3)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = '#fb923c';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(251, 146, 60, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.3)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '12px'
              }}>
                Request Movies & TV Shows
              </h2>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '15px',
                lineHeight: '1.6'
              }}>
                Request new content to be added to Plex
              </p>
            </Link>

            {/* Request Audiobooks Card */}
            <Link href="/book-request" style={{
              textDecoration: 'none',
              background: 'rgba(15, 25, 45, 0.85)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '40px 30px',
              border: '2px solid rgba(168, 85, 247, 0.3)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = '#a855f7';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(168, 85, 247, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '12px'
              }}>
                Request Audiobooks
              </h2>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '15px',
                lineHeight: '1.6'
              }}>
                Request audiobooks to be added to AudiobookShelf
              </p>
            </Link>

            {/* Register for Access Card */}
            <Link href="/register" style={{
              textDecoration: 'none',
              background: 'rgba(15, 25, 45, 0.85)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '40px 30px',
              border: '2px solid rgba(94, 161, 240, 0.3)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = '#5ea1f0';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(94, 161, 240, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(94, 161, 240, 0.3)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '12px'
              }}>
                Register for Access
              </h2>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '15px',
                lineHeight: '1.6'
              }}>
                Create an account to access all services
              </p>
            </Link>

            {/* Game Servers - Coming Soon */}
            <div style={{
              background: 'rgba(15, 25, 45, 0.5)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '40px 30px',
              border: '2px solid rgba(156, 163, 175, 0.2)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              opacity: '0.6',
              cursor: 'not-allowed'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '12px'
              }}>
                Game Servers
              </h2>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '15px',
                lineHeight: '1.6'
              }}>
                Coming Soon
              </p>
            </div>
          </div>

          {/* Secondary Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            marginBottom: '40px'
          }}>
                      </div>

          {/* Info Banner */}
          <div style={{
            marginTop: '40px',
            padding: '20px 30px',
            borderRadius: '16px',
            background: 'rgba(94, 161, 240, 0.1)',
            border: '2px solid rgba(94, 161, 240, 0.3)',
            maxWidth: '1200px'
          }}>
            <div style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: '1.6',
              textAlign: 'center'
            }}>
              <strong>🎉 New User?</strong> Register once to get access to <strong>Plex</strong> (movies/TV) and <strong>AudiobookShelf</strong> (audiobooks)!
            </div>
          </div>

          {/* Login Button */}
          <div style={{
            marginTop: '30px'
          }}>
            <Link href="/login" style={{
              padding: '12px 32px',
              borderRadius: '12px',
              background: 'rgba(15, 25, 45, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(94, 161, 240, 0.3)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#5ea1f0';
              e.currentTarget.style.background = 'rgba(15, 25, 45, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(94, 161, 240, 0.3)';
              e.currentTarget.style.background = 'rgba(15, 25, 45, 0.7)';
            }}>
              👤 Already have an account? Login
            </Link>
          </div>
        </div>

        {/* Admin star - bottom right */}
        <Link href="/admin/login" style={{
          position: 'absolute',
          bottom: '60px',
          right: '60px',
          fontSize: '40px',
          textDecoration: 'none',
          cursor: 'pointer',
          opacity: '0.3',
          animation: 'pulse 2s ease-in-out infinite',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          display: 'inline-block'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8';
          e.currentTarget.style.transform = 'scale(1.2) rotate(20deg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.3';
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
        }}>
          ✨
        </Link>
      </div>
    </Layout>
  );
};

export default Home;