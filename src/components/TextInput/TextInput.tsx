import { useState } from 'react';
import styles from './TextInput.module.css';

interface TextInputProps {
  onTranslate: (text: string) => void;
  onClear: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  isReady: boolean;
  onPlay: () => void;
  disabled?: boolean;
}

export function TextInput({
  onTranslate,
  onClear,
  isPlaying,
  isLoading,
  isReady,
  onPlay,
}: TextInputProps) {
  const [text, setText] = useState('');

  const handleTranslate = () => {
    const trimmed = text.trim();
    if (trimmed) {
      onTranslate(trimmed);
    }
  };

  const handleClear = () => {
    setText('');
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isReady) {
        onPlay();
      } else if (!isLoading && !isPlaying) {
        handleTranslate();
      }
    }
  };

  const canTranslate = !!text.trim() && !isLoading && !isPlaying && !isReady;

  return (
    <div className={styles['text-input-container']}>
      <label className={styles['text-input-label']}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        Escribe tu mensaje
      </label>

      <div className={styles['textarea-wrapper']}>
        <textarea
          id="text-input"
          className={styles['text-input-textarea']}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe una palabra, frase o mensaje corto..."
          maxLength={200}
          disabled={isPlaying || isLoading}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <span className={styles['char-counter']}>
          {text.length}/200
        </span>
      </div>

      <div className={styles['button-group']}>
        {/* Botón Traducir: genera la secuencia + pre-carga */}
        {!isReady && (
          <button
            id="btn-translate"
            className={`${styles.btn} ${styles['btn-primary']}`}
            onClick={handleTranslate}
            disabled={!canTranslate}
          >
            {isLoading ? (
              <>
                <div className={styles['btn-spinner']} />
                Cargando...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                Traducir
              </>
            )}
          </button>
        )}

        {/* Botón Reproducir: solo cuando está listo */}
        {isReady && (
          <button
            id="btn-play"
            className={`${styles.btn} ${styles['btn-play']}`}
            onClick={onPlay}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Reproducir
          </button>
        )}

        <button
          id="btn-clear"
          className={`${styles.btn} ${styles['btn-secondary']}`}
          onClick={handleClear}
          disabled={!text && !isPlaying && !isReady}
          title="Limpiar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
