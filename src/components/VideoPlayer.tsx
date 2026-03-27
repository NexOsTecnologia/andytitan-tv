import React from 'react';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { Channel } from '../types';
import './VideoPlayer.css';

interface VideoPlayerProps {
  channel: Channel | null;
  onError?: (error: Error) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onError }) => {
  // Convertir URL DASH a HLS si es necesario
  const getStreamUrl = () => {
    if (!channel?.url) return '';
    // Si es DASH, intentar convertir a HLS
    if (channel.type === 'dash') {
      return channel.url.replace('.mpd', '.m3u8');
    }
    return channel.url;
  };

  const { videoRef, isLoading, error } = useVideoPlayer({
    url: getStreamUrl(),
    type: 'hls',  // Siempre HLS
    onError,
    onPlaying: () => console.log('Playing:', channel?.name)
  });

  if (!channel) {
    return (
      <div className="video-player-container">
        <div className="no-channel">
          <div className="no-channel-icon">📺</div>
          <p>Seleccioná un canal para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      <video
        ref={videoRef}
        className="video-element"
        controls
        autoPlay
        playsInline
      />
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span>Cargando {channel.name}...</span>
        </div>
      )}
      {error && (
        <div className="error-overlay">
          <div className="error-icon">⚠️</div>
          <span>No se pudo cargar {channel.name}</span>
          <small>Probá con otro canal</small>
        </div>
      )}
    </div>
  );
};