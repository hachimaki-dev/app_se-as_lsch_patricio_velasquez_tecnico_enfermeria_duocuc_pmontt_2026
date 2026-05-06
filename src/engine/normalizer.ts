/**
 * Módulo de normalización de texto para búsqueda de assets.
 * 
 * Reglas:
 * - Convierte a minúsculas
 * - Remueve acentos para búsqueda (á→a, é→e, í→i, ó→o, ú→u, ñ→n)
 * - Elimina signos de puntuación
 * - Preserva espacios simples
 * - El texto original siempre se mantiene para display
 */

/** Mapa de caracteres acentuados a sus equivalentes sin acento */
const ACCENT_MAP: Record<string, string> = {
  'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
  'ü': 'u', 'ñ': 'n',
  'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
  'Ü': 'u', 'Ñ': 'n',
};

/**
 * Remueve acentos de un texto para búsqueda.
 * No modifica el texto original, solo genera una versión normalizada.
 */
export function removeAccents(text: string): string {
  return text.split('').map(char => ACCENT_MAP[char] || char).join('');
}

/**
 * Elimina signos de puntuación del texto.
 * Conserva letras, números y espacios.
 */
export function stripPunctuation(text: string): string {
  return text.replace(/[¿¡?!.,;:()[\]{}"'`~@#$%^&*+=<>|\\/_-]/g, '');
}

/**
 * Normaliza un texto completo para búsqueda en el manifest.
 * Pipeline: minúsculas → sin puntuación → sin acentos → trim → espacios simples
 */
export function normalizeForLookup(text: string): string {
  let normalized = text.toLowerCase();
  normalized = stripPunctuation(normalized);
  normalized = removeAccents(normalized);
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

/**
 * Divide un texto en palabras, conservando la relación con el texto original.
 * Retorna un array de { original, normalized }.
 */
export function tokenizeText(text: string): Array<{ original: string; normalized: string }> {
  // Primero, limpiar puntuación y espacios extras
  const cleaned = stripPunctuation(text).replace(/\s+/g, ' ').trim();
  
  if (!cleaned) return [];
  
  const words = cleaned.split(' ');
  return words.map(word => ({
    original: word,
    normalized: removeAccents(word.toLowerCase()),
  }));
}
