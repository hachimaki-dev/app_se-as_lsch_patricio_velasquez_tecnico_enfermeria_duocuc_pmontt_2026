/**
 * Hook para manejar la traducción de texto a secuencia de videos.
 */

import { useState, useCallback, useEffect } from 'react';
import type { AssetManifest, SequenceItem } from '../types';
import { loadManifest } from '../engine/manifest';
import { translateTextToSequence, getSequenceStats } from '../engine/translator';

export function useTranslation() {
  const [manifest, setManifest] = useState<AssetManifest | null>(null);
  const [sequence, setSequence] = useState<SequenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar manifest al montar
  useEffect(() => {
    loadManifest()
      .then(m => {
        setManifest(m);
        setIsLoading(false);
      })
      .catch(err => {
        setError('No se pudo cargar la configuración de videos');
        setIsLoading(false);
        console.error(err);
      });
  }, []);

  // Traducir texto a secuencia
  const translate = useCallback(
    (text: string) => {
      if (!manifest) {
        setError('Manifest no cargado');
        return [];
      }

      const result = translateTextToSequence(text, manifest);
      setSequence(result);
      return result;
    },
    [manifest]
  );

  // Limpiar secuencia
  const clearSequence = useCallback(() => {
    setSequence([]);
  }, []);

  // Estadísticas de la secuencia actual
  const stats = sequence.length > 0 ? getSequenceStats(sequence) : null;

  return {
    manifest,
    sequence,
    stats,
    isLoading,
    error,
    translate,
    clearSequence,
  };
}
