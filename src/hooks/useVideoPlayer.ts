import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import * as dashjs from 'dashjs';

interface UseVideoPlayerProps {
  url: string;
  type: 'hls' | 'dash';
  onError?: (error: Error) => void;
  onPlaying?: () => void;
}

export const useVideoPlayer = ({ url, type, onError, onPlaying }: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashRef = useRef<dashjs.MediaPlayer | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setIsLoading(true);
    setError(null);

    // Limpiar reproductores anteriores
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (dashRef.current) {
      dashRef.current.reset();
      dashRef.current = null;
    }

    video.pause();
    video.removeAttribute('src');
    video.load();

    // Reproducción según tipo
    if (type === 'hls' && Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30
      });
      
      hls.loadSource(url);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play()
          .then(() => {
            setIsLoading(false);
            onPlaying?.();
          })
          .catch((err) => {
            setError('Error al reproducir');
            onError?.(err);
            setIsLoading(false);
          });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Error de red');
          onError?.(new Error(data.type));
          setIsLoading(false);
        }
      });
    } 
    else if (type === 'dash' && dashjs) {
      const dash = dashjs.MediaPlayer().create();
      dash.initialize(video, url, true);
      dashRef.current = dash;

      dash.on(dashjs.MediaPlayer.events.CAN_PLAY, () => {
        video.play()
          .then(() => {
            setIsLoading(false);
            onPlaying?.();
          })
          .catch((err) => {
            setError('Error al reproducir');
            onError?.(err);
            setIsLoading(false);
          });
      });

      dash.on(dashjs.MediaPlayer.events.ERROR, (e: any) => {
        setError('Error DASH');
        onError?.(new Error(e.toString()));
        setIsLoading(false);
      });
    }
    else {
      // Fallback directo
      video.src = url;
      video.play()
        .then(() => {
          setIsLoading(false);
          onPlaying?.();
        })
        .catch((err) => {
          setError('Formato no soportado');
          onError?.(err);
          setIsLoading(false);
        });
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      if (dashRef.current) dashRef.current.reset();
    };
  }, [url, type]);

  return { videoRef, isLoading, error };
};