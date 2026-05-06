import type { PlaybackSpeed } from '../../types';
import styles from './SpeedControl.module.css';

interface SpeedControlProps {
  speed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

const SPEED_OPTIONS: { value: PlaybackSpeed; label: string }[] = [
  { value: 0.5, label: '0.5×' },
  { value: 0.75, label: '0.75×' },
  { value: 1, label: '1×' },
  { value: 1.25, label: '1.25×' },
  { value: 1.5, label: '1.5×' },
  { value: 2, label: '2×' },
  { value: 3, label: '3×' },
  { value: 5, label: '5×' },
];

export function SpeedControl({ speed, onSpeedChange }: SpeedControlProps) {
  return (
    <div className={styles['speed-control']}>
      <span className={styles['speed-label']}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Velocidad
      </span>
      <div className={styles['speed-options']}>
        {SPEED_OPTIONS.map(option => (
          <button
            key={option.value}
            className={`${styles['speed-btn']} ${speed === option.value ? styles.active : ''}`}
            onClick={() => onSpeedChange(option.value)}
            id={`speed-${option.value}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
