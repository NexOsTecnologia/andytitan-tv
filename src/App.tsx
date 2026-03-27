import React, { useState, useEffect, useRef } from 'react';
import { ChannelList } from './components/ChannelList';
import { VideoPlayer } from './components/VideoPlayer';
import { SeriesSection } from './components/SeriesSection';
import { useChannels } from './hooks/useChannels';
import { Channel } from './types';
import './App.css';

type TabType = 'tv' | 'series';

function App() {
  const { channels, isLoading, error: loadError } = useChannels();
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabType>('tv');
  
  // Estado para el reproductor de series
  const [seriesUrl, setSeriesUrl] = useState<string | null>(null);
  const [seriesTitle, setSeriesTitle] = useState<string | null>(null);
  const [isPlaylist, setIsPlaylist] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Cargar favoritos guardados
  useEffect(() => {
    const saved = localStorage.getItem('andytv_favorites');
    if (saved) {
      try {
        setFavorites(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }
  }, []);

  // Guardar favoritos
  useEffect(() => {
    localStorage.setItem('andytv_favorites', JSON.stringify([...favorites]));
  }, [favorites]);

  const handleSelectChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    // Limpiar reproductor de series cuando se selecciona un canal
    setSeriesUrl(null);
    setSeriesTitle(null);
  };

  const handleToggleFavorite = (channelId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(channelId)) {
        newFavorites.delete(channelId);
      } else {
        newFavorites.add(channelId);
      }
      return newFavorites;
    });
  };

  const handleVideoError = (error: Error) => {
    console.error('Video error:', error);
  };

  // Manejar reproducción de series
  const handlePlaySerie = (url: string, title: string, isPlaylistMode: boolean = false) => {
    setSeriesUrl(url);
    setSeriesTitle(title);
    setIsPlaylist(isPlaylistMode);
    // Si hay un canal reproduciéndose, no lo interrumpimos
  };

  // Función para obtener el embed URL de YouTube
  const getYouTubeEmbedUrl = (url: string): string | null => {
    // Extraer ID de YouTube
    const videoMatch = url.match(/(?:youtube\.com\/watch\?v=)([^&]+)|(?:youtu\.be\/)([^?]+)/);
    if (videoMatch) {
      const videoId = videoMatch[1] || videoMatch[2];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    
    const playlistMatch = url.match(/[&?]list=([^&]+)/);
    if (playlistMatch) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}&autoplay=1`;
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="app loading-screen">
        <div className="spinner"></div>
        <p>Cargando canales...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📺 AndyTV</h1>
        <p>Canales de Argentina · Series · Contenido en vivo</p>
        
        {/* Tabs de navegación */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
          <button
            onClick={() => {
              setActiveTab('tv');
              setSeriesUrl(null);
            }}
            style={{
              padding: '10px 24px',
              borderRadius: '30px',
              border: 'none',
              background: activeTab === 'tv' ? '#ff3366' : '#1e1e1e',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            📺 Canales TV
          </button>
          <button
            onClick={() => {
              setActiveTab('series');
              setCurrentChannel(null);
            }}
            style={{
              padding: '10px 24px',
              borderRadius: '30px',
              border: 'none',
              background: activeTab === 'series' ? '#ff3366' : '#1e1e1e',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            🎬 Series
          </button>
        </div>
      </header>

      <div className="app-main">
        {activeTab === 'tv' ? (
          <>
            <aside className="sidebar">
              <ChannelList
                channels={channels}
                currentChannel={currentChannel}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
            </aside>
            <main className="player-area">
              <VideoPlayer channel={currentChannel} onError={handleVideoError} />
              <div className="current-channel-info">
                <span className="label">🎬 Reproduciendo:</span>
                <span className="name">
                  {currentChannel ? currentChannel.name : 'Ninguno'}
                </span>
              </div>
            </main>
          </>
        ) : (
          <main style={{ flex: 1, minHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {/* Reproductor de series (si hay una seleccionada) */}
            {seriesUrl && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  background: '#111',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#1a1a1a',
                    borderBottom: '1px solid #333'
                  }}>
                    <div>
                      <span style={{ color: '#ff3366', fontWeight: 'bold' }}>🎬 Reproduciendo:</span>
                      <span style={{ marginLeft: '8px', color: '#fff' }}>{seriesTitle || 'Serie'}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSeriesUrl(null);
                        setSeriesTitle(null);
                      }}
                      style={{
                        background: '#333',
                        border: 'none',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        cursor: 'pointer'
                      }}
                    >
                      ✖ Cerrar
                    </button>
                  </div>
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
                    {seriesUrl.includes('youtube.com') || seriesUrl.includes('youtu.be') ? (
                      <iframe
                        ref={iframeRef}
                        src={getYouTubeEmbedUrl(seriesUrl) || seriesUrl}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none'
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Series Player"
                      />
                    ) : (
                      // Para Plex, Pluto, etc. - usar video nativo
                      <video
                        src={seriesUrl}
                        controls
                        autoPlay
                        style={{ width: '100%', height: '100%', background: '#000' }}
                        onError={() => {
                          console.error('Error reproduciendo:', seriesUrl);
                          alert('No se pudo reproducir el contenido. Verificá la URL.');
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Sección de series */}
            <SeriesSection onPlaySerie={handlePlaySerie} />
          </main>
        )}
      </div>

      <footer className="app-footer">
        <p>
          {activeTab === 'tv' 
            ? 'Canales actualizados desde iptv-org | Usá las flechas para navegar'
            : '🎬 Pegá cualquier URL de YouTube, Plex o Pluto TV | Series recomendadas disponibles'}
        </p>
      </footer>
    </div>
  );
}

export default App;