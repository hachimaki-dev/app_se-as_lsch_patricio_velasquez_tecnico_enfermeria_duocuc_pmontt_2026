import { useRef, useEffect } from 'react';
import type { SequenceItem } from '../../types';
import styles from './PlaybackQueue.module.css';

interface PlaybackQueueProps {
  sequence: SequenceItem[];
  currentIndex: number;
  isActive: boolean;
}

function TypeIcon({ type, className }: { type: string; className: string }) {
  if (type === 'phrase') return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
  );
  if (type === 'word') return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z"/>
    </svg>
  );
  if (type === 'letter') return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8"/>
    </svg>
  );
  if (type === 'missing') return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  );
  return null;
}

export function PlaybackQueue({ sequence, currentIndex, isActive }: PlaybackQueueProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al chip activo
  useEffect(() => {
    if (!scrollRef.current || currentIndex < 0) return;

    const container = scrollRef.current;
    const activeChip = container.children[currentIndex] as HTMLElement;
    if (activeChip) {
      activeChip.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentIndex]);

  if (sequence.length === 0) return null;

  // Filtrar solo items visibles (no pausas solas)
  const visibleItems = sequence.filter(s => s.type !== 'pause');

  return (
    <div className={styles['playback-queue']}>
      <span className={styles['queue-label']}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        Secuencia ({visibleItems.length} clips)
      </span>

      <div className={styles['queue-scroll']} ref={scrollRef}>
        {sequence.map((item) => {
          const isCurrentItem = isActive && item.index === currentIndex;
          const isDone = isActive && item.index < currentIndex;

          if (item.type === 'pause') {
            return (
              <div
                key={item.index}
                className={`${styles['queue-chip']} ${styles.pause} ${isDone ? styles.done : ''}`}
              >
                •
              </div>
            );
          }

          return (
            <div
              key={item.index}
              className={`
                ${styles['queue-chip']}
                ${styles[item.type]}
                ${isCurrentItem ? styles.active : ''}
                ${isDone ? styles.done : ''}
              `}
            >
              {item.blobUrl && !isCurrentItem && !isDone && (
                <svg className={styles['preloaded-indicator']} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              <TypeIcon
                type={item.type}
                className={`${styles['queue-chip-icon']} ${styles[item.type]}`}
              />
              {item.originalText}
            </div>
          );
        })}
      </div>
    </div>
  );
}
