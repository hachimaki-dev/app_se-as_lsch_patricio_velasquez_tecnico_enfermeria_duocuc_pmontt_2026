import type { RefObject } from 'react';
import type { PlaybackStatus, SequenceItem, PreloadProgress } from '../../types';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: PlaybackStatus;
  currentIndex: number;
  sequence: SequenceItem[];
  preloadProgress?: PreloadProgress;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRepeat: () => void;
}

export function VideoPlayer({
  videoRef,
  status,
  currentIndex,
  sequence,
  preloadProgress,
  onPause,
  onResume,
  onStop,
  onRepeat,
}: VideoPlayerProps) {
  const currentItem = currentIndex >= 0 && currentIndex < sequence.length
    ? sequence[currentIndex]
    : null;

  const playableItems = sequence.filter(s => s.type !== 'pause');
  const currentPlayableIndex = currentItem && currentItem.type !== 'pause'
    ? playableItems.findIndex(s => s.index === currentItem.index)
    : -1;

  const progress = playableItems.length > 0 && currentPlayableIndex >= 0
    ? ((currentPlayableIndex + 1) / playableItems.length) * 100
    : 0;

  const isActive = status === 'playing' || status === 'paused';
  const showMissing = currentItem?.type === 'missing' && status === 'playing';
  const isLoading = status === 'loading';

  return (
    <div className={styles['video-player-container']}>
      <div className={styles['video-wrapper']}>
        {status === 'idle' ? (
          <div className={styles['video-placeholder']}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M10 8l6 4-6 4V8z" />
            </svg>
            <span>Escribe un mensaje y presiona Traducir</span>
          </div>
        ) : isLoading ? (
          <div className={styles['loading-overlay']}>
            <div className={styles['loader-ring']} />
            <div className={styles['loading-info']}>
              <span className={styles['loading-title']}>Preparando videos...</span>
              {preloadProgress && (
                <>
                  <div className={styles['preload-bar-bg']}>
                    <div 
                      className={styles['preload-bar-fill']} 
                      style={{ width: `${preloadProgress.percent}%` }}
                    />
                  </div>
                  <span className={styles['loading-count']}>
                    {preloadProgress.loaded} / {preloadProgress.total} clips
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className={styles['video-element']}
              playsInline
              preload="auto"
            />
            {showMissing && (
              <div className={styles['missing-overlay']}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className={styles['missing-letter']}>{currentItem?.originalText}</div>
                <span>Sin video disponible</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Barra de progreso de reproducción */}
      <div className={styles['progress-bar']}>
        <div
          className={styles['progress-fill']}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Info del clip actual */}
      <div className={styles['video-info']}>
        {currentItem && currentItem.type !== 'pause' ? (
          <>
            <span className={styles['current-token']}>
              {currentItem.originalText}
              <span className={`${styles['token-type-badge']} ${styles[currentItem.type]}`}>
                {currentItem.type === 'phrase' ? 'frase' :
                 currentItem.type === 'word' ? 'palabra' :
                 currentItem.type === 'letter' ? 'letra' :
                 'sin video'}
              </span>
            </span>
            <span className={styles['clip-counter']}>
              {currentPlayableIndex + 1} / {playableItems.length}
            </span>
          </>
        ) : (
          <span className={styles['current-token']} style={{ color: 'var(--text-muted)' }}>
            {status === 'finished' ? '✓ Reproducción completada' : 
             status === 'ready' ? 'Listo para reproducir' :
             status === 'loading' ? 'Descargando...' :
             'Esperando...'}
          </span>
        )}
      </div>

      {/* Controles de reproducción */}
      {(isActive || status === 'finished' || status === 'ready') && (
        <div className={styles['playback-controls']}>
          {/* Stop */}
          <button
            className={styles['control-btn']}
            onClick={onStop}
            title="Detener"
            id="btn-stop"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>

          {/* Play/Pause */}
          {(status !== 'finished' && status !== 'ready') && (
            <button
              className={`${styles['control-btn']} ${styles.primary}`}
              onClick={status === 'playing' ? onPause : onResume}
              title={status === 'playing' ? 'Pausar' : 'Reanudar'}
              id="btn-playpause"
            >
              {status === 'playing' ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          )}

          {/* Repetir */}
          <button
            className={styles['control-btn']}
            onClick={onRepeat}
            title="Repetir"
            id="btn-repeat"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
