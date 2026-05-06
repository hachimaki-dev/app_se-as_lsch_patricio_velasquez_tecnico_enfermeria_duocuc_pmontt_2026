/**
 * Tipos principales para SeñasApp
 */

/** Tipo de cada elemento en la secuencia de reproducción */
export type SequenceItemType = "phrase" | "word" | "letter" | "pause" | "missing";

/** Un elemento individual en la cola de reproducción */
export interface SequenceItem {
  /** Tipo de resolución del token */
  type: SequenceItemType;
  /** Texto original que el usuario escribió */
  originalText: string;
  /** Ruta al archivo de video (relativa a public/) */
  filename?: string;
  /** Nombre del archivo para display */
  displayFilename?: string;
  /** Blob URL del video pre-cargado (en memoria, listo para reproducir) */
  blobUrl?: string;
  /** Índice de reproducción */
  index: number;
}

/** Estado del reproductor */
export type PlaybackStatus = "idle" | "loading" | "ready" | "playing" | "paused" | "finished";

/** Velocidad de reproducción (delay entre clips en ms) */
export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2 | 3 | 5;

/** Progreso de pre-carga */
export interface PreloadProgress {
  /** Número de clips ya descargados */
  loaded: number;
  /** Total de clips a descargar */
  total: number;
  /** Porcentaje (0-100) */
  percent: number;
}

/** Configuración de un token en el manifest */
export interface TokenEntry {
  /** Clave normalizada para búsqueda */
  key: string;
  /** Nombre real del archivo de video */
  filename: string;
  /** Texto de display legible */
  displayName: string;
}

/** Estructura del manifest de assets */
export interface AssetManifest {
  version: string;
  basePath: string;
  tokens: {
    phrases: Record<string, string>;
    words: Record<string, string>;
    letters: Record<string, string>;
  };
}
