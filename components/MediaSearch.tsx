import { useState, useEffect, useRef, useCallback } from 'react';

interface MediaResult {
  id: number;
  title: string;
  year: number;
  overview: string;
  poster: string | null;
  type: 'movie' | 'series';
  tmdbId?: number;
  tvdbId?: number;
  imdbId?: string;
}

interface MediaSearchProps {
  contentType: string;
  onSelect: (media: MediaResult) => void;
  selectedMedia: MediaResult | null;
  onClear: () => void;
  disabled?: boolean;
}

export default function MediaSearch({ 
  contentType, 
  onSelect, 
  selectedMedia, 
  onClear,
  disabled = false 
}: MediaSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const searchUrl = `/api/media/search?query=${encodeURIComponent(searchQuery)}&type=${contentType}`;
      console.log('Searching:', searchUrl);
      
      const response = await fetch(searchUrl, { credentials: 'include' });
      
      console.log('Search response status:', response.status);
      const data = await response.json();
      console.log('Search results:', data);
      
      if (data.success) {
        setResults(data.results || []);
        setShowResults(true);
        if (data.message && data.results?.length === 0) {
          setError(data.message);
        }
      } else {
        setError(data.message || 'Search failed');
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [contentType]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        search(query);
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search]);

  // Clear search when content type changes (skip initial mount)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setQuery('');
    setResults([]);
    setShowResults(false);
    onClear();
  }, [contentType, onClear]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (media: MediaResult) => {
    onSelect(media);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  if (selectedMedia) {
    return (
      <div style={{
        background: 'rgba(76, 175, 80, 0.1)',
        border: '2px solid rgba(76, 175, 80, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
      }}>
        {selectedMedia.poster && (
          <img
            src={selectedMedia.poster}
            alt={selectedMedia.title}
            style={{
              width: '80px',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '8px',
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: '#fff',
            marginBottom: '4px',
          }}>
            {selectedMedia.title}
          </div>
          <div style={{ 
            fontSize: '0.9rem', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '8px',
          }}>
            {selectedMedia.year > 0 ? selectedMedia.year : 'Unknown year'}
            {selectedMedia.imdbId && (
              <span style={{ marginLeft: '8px' }}>
                • <a 
                  href={`https://www.imdb.com/title/${selectedMedia.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#f5c518', textDecoration: 'none' }}
                >
                  IMDb
                </a>
              </span>
            )}
          </div>
          <div style={{ 
            fontSize: '0.85rem', 
            color: 'rgba(255, 255, 255, 0.5)',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {selectedMedia.overview || 'No description available.'}
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          style={{
            background: 'rgba(244, 67, 54, 0.2)',
            border: '1px solid rgba(244, 67, 54, 0.4)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#f44336',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
        >
          ✕ Clear
        </button>
      </div>
    );
  }

  return (
    <div ref={searchRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search for a title..."
          disabled={disabled}
          style={{
            width: '100%',
            padding: '12px 16px',
            paddingRight: '40px',
            fontSize: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            transition: 'all 0.3s ease',
          }}
        />
        {isLoading && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255, 255, 255, 0.5)',
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderTopColor: '#5EA1F0',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          background: 'rgba(244, 67, 54, 0.1)',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          borderRadius: '8px',
          color: '#f44336',
          fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      {showResults && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'rgba(20, 30, 50, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 100,
        }}>
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              type="button"
              onClick={() => handleSelect(result)}
              style={{
                width: '100%',
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(94, 161, 240, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {result.poster ? (
                <img
                  src={result.poster}
                  alt={result.title}
                  style={{
                    width: '50px',
                    height: '75px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: '50px',
                  height: '75px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontSize: '24px',
                  flexShrink: 0,
                }}>
                  🎬
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: '600', 
                  color: '#fff',
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {result.title}
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: '4px',
                }}>
                  {result.year > 0 ? result.year : 'Unknown year'}
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'rgba(255, 255, 255, 0.4)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.3',
                }}>
                  {result.overview || 'No description available.'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && !isLoading && results.length === 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'rgba(20, 30, 50, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.5)',
          zIndex: 100,
        }}>
          No results found for "{query}"
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: translateY(-50%) rotate(0deg); }
          to { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
