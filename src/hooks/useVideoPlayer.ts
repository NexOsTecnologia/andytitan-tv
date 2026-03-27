import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface UseVideoPlayerProps {
  url: string;
  type: 'hls';  // Solo HLS, eliminamos DASH
  onError?: (error: Error) => void;
  onPlaying?: () => void;
}

export const useVideoPlayer = ({ url, type, onError, onPlaying }: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setIsLoading(true);
    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.pause();
    video.removeAttribute('src');
    video.load();

    const isHLS = url.includes('.m3u8') || url.includes('.m3u');

    if (isHLS && Hls.isSupported()) {
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
    } else {
      // Stream directo
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
    };
  }, [url, type]);

  return { videoRef, isLoading, error };
};