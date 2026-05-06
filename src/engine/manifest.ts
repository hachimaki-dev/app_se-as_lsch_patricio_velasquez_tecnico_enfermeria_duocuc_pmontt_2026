/**
 * Módulo de manifest de assets.
 * 
 * Carga y gestiona el mapeo de tokens a archivos de video.
 * Soporta frases, palabras y letras con prioridad en ese orden.
 */

import type { AssetManifest } from '../types';
import { normalizeForLookup } from './normalizer';

let cachedManifest: AssetManifest | null = null;

/**
 * Carga el manifest de assets desde el archivo JSON.
 * Cachea el resultado para evitar múltiples fetches.
 */
export async function loadManifest(): Promise<AssetManifest> {
  if (cachedManifest) return cachedManifest;

  try {
    const response = await fetch('/manifest.json');
    if (!response.ok) {
      throw new Error(`Error cargando manifest: ${response.status}`);
    }
    cachedManifest = await response.json();
    return cachedManifest!;
  } catch (error) {
    console.error('Error cargando manifest de assets:', error);
    // Retornar manifest vacío como fallback
    return {
      version: '0.0',
      basePath: '/videos/',
      tokens: { phrases: {}, words: {}, letters: {} },
    };
  }
}

/**
 * Busca una frase completa en el manifest.
 * Retorna el filename si existe, null si no.
 */
export function findPhrase(manifest: AssetManifest, text: string): string | null {
  const normalized = normalizeForLookup(text);
  const filename = manifest.tokens.phrases[normalized];
  return filename || null;
}

/**
 * Busca una palabra individual en el manifest.
 * Retorna el filename si existe, null si no.
 */
export function findWord(manifest: AssetManifest, text: string): string | null {
  const normalized = normalizeForLookup(text);
  const filename = manifest.tokens.words[normalized];
  return filename || null;
}

/**
 * Busca una letra individual en el manifest.
 * Retorna el filename si existe, null si no.
 */
export function findLetter(manifest: AssetManifest, char: string): string | null {
  const normalized = normalizeForLookup(char);
  const filename = manifest.tokens.letters[normalized];
  return filename || null;
}

/**
 * Construye la URL completa de un archivo de video.
 */
export function getVideoUrl(manifest: AssetManifest, filename: string): string {
  const basePath = manifest.basePath.endsWith('/') 
    ? manifest.basePath 
    : manifest.basePath + '/';
  return `${basePath}${encodeURIComponent(filename)}`;
}

/**
 * Invalida el cache del manifest para forzar recarga.
 */
export function invalidateManifestCache(): void {
  cachedManifest = null;
}
