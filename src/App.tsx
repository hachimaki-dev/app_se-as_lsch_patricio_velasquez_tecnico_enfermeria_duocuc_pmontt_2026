import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { useTranslation } from './hooks/useTranslation';
import { usePlayback } from './hooks/usePlayback';
import { usePreloader } from './hooks/usePreloader';
import { TextInput } from './components/TextInput/TextInput';
import { VideoPlayer } from './components/VideoPlayer/VideoPlayer';
import { PlaybackQueue } from './components/PlaybackQueue/PlaybackQueue';
import { SpeedControl } from './components/SpeedControl/SpeedControl';
import { StatusIndicator } from './components/StatusIndicator/StatusIndicator';
import type { PlaybackStatus } from './types';

function App() {
  const {
    sequence,
    stats,
    isLoading: isTranslating,
    error: translationError,
    translate,
    clearSequence,
  } = useTranslation();

  const {
    videoRef,
    status: playbackStatus,
    currentIndex,
    sequence: playbackSequence,
    speed,
    play,
    pause,
    resume,
    stop,
    repeat,
    changeSpeed,
  } = usePlayback();

  const {
    isLoading: isPreloading,
    progress: preloadProgress,
    error: preloaderError,
    preloadSequence,
    cleanup: cleanupBlobs,
  } = usePreloader();

  // Estado unificado para la UI
  const [appStatus, setAppStatus] = useState<PlaybackStatus>('idle');

  // Sincronizar appStatus con playbackStatus cuando estamos reproduciendo
  useEffect(() => {
    if (playbackStatus !== 'idle') {
      setAppStatus(playbackStatus);
    }
  }, [playbackStatus]);

  const handleTranslate = useCallback(
    async (text: string) => {
      stop();
      cleanupBlobs();
      setAppStatus('idle');

      const result = translate(text);
      if (result.length > 0) {
        console.log('[App] Secuencia generada:', result);
        setAppStatus('loading');
        await preloadSequence(result);
        console.log('[App] Pre-carga finalizada. Listo para reproducir.');
        setAppStatus('ready');
      }
    },
    [translate, preloadSequence, stop, cleanupBlobs]
  );

  const handlePlay = useCallback(() => {
    if (appStatus === 'ready' && sequence.length > 0) {
      console.log('[App] Iniciando reproducción de secuencia pre-cargada...');
      // Usar la secuencia que ya tiene los blobUrls
      // Para esto necesitamos que preloadSequence devuelva la secuencia actualizada
      // O guardarla en un estado. Como usePreloader ya maneja el estado interno,
      // pero el App necesita la secuencia final.
      
      // Vamos a re-obtener la secuencia pre-cargada
      preloadSequence(sequence).then(preloaded => {
        play(preloaded);
      });
    }
  }, [appStatus, sequence, play, preloadSequence]);

  const handleClear = useCallback(() => {
    stop();
    cleanupBlobs();
    clearSequence();
    setAppStatus('idle');
  }, [stop, cleanupBlobs, clearSequence]);

  const isPlaying = appStatus === 'playing' || appStatus === 'paused';
  const isLoading = isTranslating || isPreloading;
  const error = translationError || preloaderError;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🤟</span>
          <div>
            <div className="logo-text">SeñasApp</div>
            <div className="logo-subtitle">Traductor de Lengua de Señas</div>
          </div>
        </div>
        <StatusIndicator status={appStatus} />
      </header>

      {/* Main */}
      <main className="main">
        {/* Error */}
        {error && (
          <div className="error-alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Video Player */}
        <section className="section">
          <VideoPlayer
            videoRef={videoRef}
            status={appStatus}
            currentIndex={currentIndex}
            sequence={playbackSequence.length > 0 ? playbackSequence : sequence}
            preloadProgress={preloadProgress}
            onPause={pause}
            onResume={resume}
            onStop={handleClear}
            onRepeat={repeat}
          />
        </section>

        {/* Playback Queue */}
        {(playbackSequence.length > 0 || sequence.length > 0) && (
          <section className="section">
            <div className="section-card">
              <PlaybackQueue
                sequence={playbackSequence.length > 0 ? playbackSequence : sequence}
                currentIndex={currentIndex}
                isActive={isPlaying}
              />

              {/* Stats */}
              {stats && (
                <div className="stats-bar">
                  {stats.phrases > 0 && (
                    <span className="stat-item phrases">
                      <span className="stat-value">{stats.phrases}</span> frase{stats.phrases > 1 ? 's' : ''}
                    </span>
                  )}
                  {stats.words > 0 && (
                    <span className="stat-item words">
                      <span className="stat-value">{stats.words}</span> palabra{stats.words > 1 ? 's' : ''}
                    </span>
                  )}
                  {stats.letters > 0 && (
                    <span className="stat-item letters">
                      <span className="stat-value">{stats.letters}</span> letra{stats.letters > 1 ? 's' : ''}
                    </span>
                  )}
                  {stats.missing > 0 && (
                    <span className="stat-item missing">
                      <span className="stat-value">{stats.missing}</span> sin video
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Speed Control */}
        <section className="section">
          <div className="section-card">
            <SpeedControl speed={speed} onSpeedChange={changeSpeed} />
          </div>
        </section>

        {/* Text Input */}
        <section className="section">
          <TextInput
            onTranslate={handleTranslate}
            onClear={handleClear}
            onPlay={handlePlay}
            isPlaying={isPlaying}
            isLoading={isLoading}
            isReady={appStatus === 'ready'}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        SeñasApp — Prototipo de traducción a Lengua de Señas
      </footer>
    </div>
  );
}

export default App;
