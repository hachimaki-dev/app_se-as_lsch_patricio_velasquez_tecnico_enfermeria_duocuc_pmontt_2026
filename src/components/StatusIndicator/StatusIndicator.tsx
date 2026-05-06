import type { PlaybackStatus } from '../../types';
import styles from './StatusIndicator.module.css';

interface StatusIndicatorProps {
  status: PlaybackStatus;
}

const STATUS_LABELS: Record<PlaybackStatus, string> = {
  idle: 'Listo',
  loading: 'Preparando',
  ready: 'Listo para play',
  playing: 'Reproduciendo',
  paused: 'En pausa',
  finished: 'Finalizado',
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className={`${styles['status-indicator']} ${styles[status]}`} id="status-indicator">
      <span className={styles['status-dot']} />
      {STATUS_LABELS[status]}
    </div>
  );
}
