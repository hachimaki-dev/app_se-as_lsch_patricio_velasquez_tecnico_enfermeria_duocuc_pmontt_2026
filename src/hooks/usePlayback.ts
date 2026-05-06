/**
 * Hook para manejar la reproducción secuencial de videos de señas.
 *
 * VERSIÓN 2: Usa Blob URLs pre-cargados para reproducción instantánea.
 * Los videos ya están en memoria cuando se llama a play(),
 * así que no hay latencia de red entre clips.
 *
 * Controla: play, pause, resume, stop, repeat, speed.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { PlaybackStatus, PlaybackSpeed, SequenceItem } from '../types';

/** Delay base entre clips en ms (se divide por la velocidad) */
const BASE_CLIP_DELAY = 200;
/** Duración de una pausa entre palabras en ms */
const PAUSE_DURATION = 250;
/** Duración para mostrar un item missing antes de avanzar */
const MISSING_DURATION = 500;

export function usePlayback() {
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [sequence, setSequence] = useState<SequenceItem[]>([]);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const sequenceRef = useRef<SequenceItem[]>([]);
  const currentIndexRef = useRef(-1);
  const speedRef = useRef<PlaybackSpeed>(1);

  // Mantener refs sincronizadas
  useEffect(() => { sequenceRef.current = sequence; }, [sequence]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => {
    speedRef.current = speed;
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  /** Limpia cualquier timeout pendiente */
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /** Avanza al siguiente item en la secuencia */
  const playNext = useCallback((index: number) => {
    if (!isPlayingRef.current) return;

    const seq = sequenceRef.current;

    if (index >= seq.length) {
      // Fin de la secuencia
      setStatus('finished');
      setCurrentIndex(seq.length - 1);
      isPlayingRef.current = false;
      return;
    }

    const item = seq[index];
    setCurrentIndex(index);

    if (item.type === 'pause') {
      const delay = PAUSE_DURATION / speedRef.current;
      timeoutRef.current = window.setTimeout(() => {
        playNext(index + 1);
      }, delay);
      return;
    }

    if (item.type === 'missing') {
      const delay = MISSING_DURATION / speedRef.current;
      timeoutRef.current = window.setTimeout(() => {
        playNext(index + 1);
      }, delay);
      return;
    }

    // Item con video — usar blobUrl (pre-cargado) o filename como fallback
    const videoSrc = item.blobUrl || item.filename;

    if (videoRef.current && videoSrc) {
      const video = videoRef.current;
      console.log(`[Playback] Reproduciendo clip ${index + 1}/${seq.length}: ${item.originalText}`);
      console.log(`[Playback] Source: ${videoSrc} (Type: ${item.blobUrl ? 'Blob URL' : 'File path'})`);

      // Limpiar listeners previos por seguridad
      video.onended = null;
      video.onerror = null;

      video.src = videoSrc;

      const startPlayback = () => {
        if (isPlayingRef.current) {
          console.log(`[Playback] Aplicando velocidad ${speedRef.current}x y reproduciendo...`);
          video.playbackRate = speedRef.current;
          video.play().catch(err => {
            console.error(`[Playback] Error en video.play():`, err);
          });
        }
      };

      video.onended = () => {
        video.onended = null;
        console.log(`[Playback] Clip finalizado: ${item.originalText}`);
        if (!isPlayingRef.current) return;
        const delay = BASE_CLIP_DELAY / speedRef.current;
        timeoutRef.current = window.setTimeout(() => {
          playNext(index + 1);
        }, delay);
      };

      video.onerror = () => {
        const error = video.error;
        let errorMsg = 'Error desconocido';
        if (error) {
          switch (error.code) {
            case 1: errorMsg = 'Abortado por el usuario (MEDIA_ERR_ABORTED)'; break;
            case 2: errorMsg = 'Error de red (MEDIA_ERR_NETWORK)'; break;
            case 3: errorMsg = 'Error de decodificación (MEDIA_ERR_DECODE)'; break;
            case 4: errorMsg = 'Formato no soportado o archivo no encontrado (MEDIA_ERR_SRC_NOT_SUPPORTED)'; break;
          }
        }
        
        console.error(`[Playback] ERROR REPRODUCIENDO ${item.displayFilename || videoSrc}:`, errorMsg, error);
        
        video.onerror = null;
        const delay = BASE_CLIP_DELAY / speedRef.current;
        timeoutRef.current = window.setTimeout(() => {
          playNext(index + 1);
        }, delay);
      };

      // Si el video ya tiene suficiente data (blob), reproducir directo
      if (video.readyState >= 3) {
        console.log(`[Playback] Video listo (readyState: ${video.readyState}), reproduciendo...`);
        startPlayback();
      } else {
        video.oncanplay = () => {
          video.oncanplay = null;
          console.log(`[Playback] Evento 'canplay' disparado, reproduciendo...`);
          startPlayback();
        };
        video.load();
      }
    } else {
      // Sin video, avanzar
      const delay = BASE_CLIP_DELAY / speedRef.current;
      timeoutRef.current = window.setTimeout(() => {
        playNext(index + 1);
      }, delay);
    }
  }, []);

  /** Inicia la reproducción de una secuencia PRE-CARGADA */
  const play = useCallback(
    (newSequence: SequenceItem[]) => {
      clearPendingTimeout();
      setSequence(newSequence);
      sequenceRef.current = newSequence;
      isPlayingRef.current = true;
      setStatus('playing');
      setCurrentIndex(0);
      currentIndexRef.current = 0;

      requestAnimationFrame(() => {
        playNext(0);
      });
    },
    [clearPendingTimeout, playNext]
  );

  /** Pausa la reproducción */
  const pause = useCallback(() => {
    if (status !== 'playing') return;
    clearPendingTimeout();
    isPlayingRef.current = false;
    setStatus('paused');

    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [status, clearPendingTimeout]);

  /** Reanuda la reproducción */
  const resume = useCallback(() => {
    if (status !== 'paused') return;
    isPlayingRef.current = true;
    setStatus('playing');

    const item = sequenceRef.current[currentIndexRef.current];

    if (item && (item.type === 'phrase' || item.type === 'word' || item.type === 'letter') && videoRef.current) {
      if (videoRef.current.paused && videoRef.current.src) {
        const video = videoRef.current;

        video.onended = () => {
          video.onended = null;
          if (!isPlayingRef.current) return;
          const delay = BASE_CLIP_DELAY / speedRef.current;
          timeoutRef.current = window.setTimeout(() => {
            playNext(currentIndexRef.current + 1);
          }, delay);
        };

        video.play().catch(console.error);
      } else {
        playNext(currentIndexRef.current + 1);
      }
    } else {
      playNext(currentIndexRef.current + 1);
    }
  }, [status, playNext]);

  /** Detiene la reproducción */
  const stop = useCallback(() => {
    clearPendingTimeout();
    isPlayingRef.current = false;
    setStatus('idle');
    setCurrentIndex(-1);
    setSequence([]);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.onended = null;
      videoRef.current.onerror = null;
      videoRef.current.oncanplay = null;
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, [clearPendingTimeout]);

  /** Repite la reproducción desde el inicio */
  const repeat = useCallback(() => {
    if (sequenceRef.current.length === 0) return;
    clearPendingTimeout();
    isPlayingRef.current = true;
    setStatus('playing');
    setCurrentIndex(0);
    currentIndexRef.current = 0;

    requestAnimationFrame(() => {
      playNext(0);
    });
  }, [clearPendingTimeout, playNext]);

  /** Cambia la velocidad de reproducción */
  const changeSpeed = useCallback((newSpeed: PlaybackSpeed) => {
    setSpeed(newSpeed);
    speedRef.current = newSpeed;
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      clearPendingTimeout();
      isPlayingRef.current = false;
    };
  }, [clearPendingTimeout]);

  return {
    videoRef,
    status,
    currentIndex,
    sequence,
    speed,
    play,
    pause,
    resume,
    stop,
    repeat,
    changeSpeed,
  };
}
