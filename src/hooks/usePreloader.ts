/**
 * Hook para pre-cargar todos los videos de una secuencia antes de reproducirlos.
 *
 * Descarga cada video como Blob via fetch(), crea una Blob URL,
 * y la asigna al SequenceItem. Esto permite reproducción instantánea
 * sin latencia de red.
 *
 * Incluye:
 * - Cache por filename (si "A.mp4" aparece 3 veces, se descarga 1 vez)
 * - Progreso de carga (loaded/total)
 * - Cleanup de Blob URLs al desmontar o limpiar
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SequenceItem, PreloadProgress } from '../types';

export function usePreloader() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<PreloadProgress>({ loaded: 0, total: 0, percent: 0 });
  const [error, setError] = useState<string | null>(null);

  /** Cache: filename → blobUrl (evita re-descargar el mismo video) */
  const blobCacheRef = useRef<Map<string, string>>(new Map());
  /** Todas las blob URLs creadas (para cleanup) */
  const allBlobUrlsRef = useRef<Set<string>>(new Set());
  /** Abort controller para cancelar descargas en progreso */
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Pre-carga todos los videos de una secuencia.
   * Retorna una nueva secuencia con blobUrl populated en cada item.
   */
  const preloadSequence = useCallback(async (
    sequence: SequenceItem[]
  ): Promise<SequenceItem[]> => {
    // Cancelar cualquier pre-carga anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Filtrar solo items que necesitan video (tienen filename)
    const itemsWithVideo = sequence.filter(item => item.filename && item.type !== 'pause' && item.type !== 'missing');

    // Obtener filenames únicos para no descargar duplicados
    const uniqueFilenames = new Set(itemsWithVideo.map(item => item.filename!));
    const total = uniqueFilenames.size;

    setIsLoading(true);
    setError(null);
    setProgress({ loaded: 0, total, percent: 0 });

    console.log(`[Preloader] Iniciando pre-carga de ${total} videos únicos...`, Array.from(uniqueFilenames));

    let loaded = 0;

    // Descargar cada video único
    const downloadPromises = Array.from(uniqueFilenames).map(async (filename) => {
      // Si ya está en cache, no re-descargar
      if (blobCacheRef.current.has(filename)) {
        console.log(`[Preloader] ${filename} ya está en caché.`);
        loaded++;
        const percent = total > 0 ? Math.round((loaded / total) * 100) : 100;
        setProgress({ loaded, total, percent });
        return;
      }

      try {
        console.log(`[Preloader] Descargando: ${filename}...`);
        const response = await fetch(filename, { signal: controller.signal });

        if (!response.ok) {
          const errorMsg = `No se pudo cargar: ${filename} (HTTP ${response.status} ${response.statusText})`;
          console.error(`[Preloader] ${errorMsg}`);
          loaded++;
          const percent = total > 0 ? Math.round((loaded / total) * 100) : 100;
          setProgress({ loaded, total, percent });
          return;
        }

        const blob = await response.blob();
        console.log(`[Preloader] Blob creado para ${filename} (${blob.size} bytes, type: ${blob.type})`);
        
        const blobUrl = URL.createObjectURL(blob);
        console.log(`[Preloader] Blob URL generada para ${filename}: ${blobUrl}`);

        blobCacheRef.current.set(filename, blobUrl);
        allBlobUrlsRef.current.add(blobUrl);

        loaded++;
        const percent = total > 0 ? Math.round((loaded / total) * 100) : 100;
        setProgress({ loaded, total, percent });
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          console.log(`[Preloader] Descarga de ${filename} cancelada.`);
          return;
        }
        console.error(`[Preloader] Error fatal descargando ${filename}:`, err);
        loaded++;
        const percent = total > 0 ? Math.round((loaded / total) * 100) : 100;
        setProgress({ loaded, total, percent });
      }
    });

    await Promise.all(downloadPromises);

    // Verificar si fue cancelado
    if (controller.signal.aborted) {
      console.log('[Preloader] Pre-carga abortada.');
      setIsLoading(false);
      return sequence;
    }

    // Construir nueva secuencia con blobUrls
    const preloadedSequence = sequence.map(item => {
      if (item.filename && blobCacheRef.current.has(item.filename)) {
        return {
          ...item,
          blobUrl: blobCacheRef.current.get(item.filename),
        };
      }
      return item;
    });

    console.log('[Preloader] Pre-carga completada exitosamente.');
    setIsLoading(false);
    return preloadedSequence;
  }, []);

  /**
   * Libera todas las Blob URLs para liberar memoria.
   */
  const cleanup = useCallback(() => {
    // Cancelar descargas en progreso
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Revocar todas las blob URLs
    allBlobUrlsRef.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    allBlobUrlsRef.current.clear();
    blobCacheRef.current.clear();

    setIsLoading(false);
    setProgress({ loaded: 0, total: 0, percent: 0 });
    setError(null);
  }, []);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      allBlobUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  return {
    isLoading,
    progress,
    error,
    preloadSequence,
    cleanup,
  };
}
