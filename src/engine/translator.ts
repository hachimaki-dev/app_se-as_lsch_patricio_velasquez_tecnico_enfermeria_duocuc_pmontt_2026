/**
 * Motor de traducción principal.
 * 
 * Convierte texto del usuario en una secuencia de items reproducibles.
 * 
 * Prioridad de resolución:
 * 1. Frase completa (multi-palabra)
 * 2. Palabra individual
 * 3. Letras individuales
 * 4. Fallback a "missing"
 * 
 * Algoritmo greedy: intenta el match más largo primero,
 * luego va reduciendo hasta encontrar un match.
 */

import type { AssetManifest, SequenceItem } from '../types';
import { findPhrase, findWord, findLetter, getVideoUrl } from './manifest';
import { normalizeForLookup, stripPunctuation } from './normalizer';

/**
 * Función principal del traductor.
 * Convierte un texto de entrada en una secuencia de clips de video.
 */
export function translateTextToSequence(
  inputText: string,
  manifest: AssetManifest
): SequenceItem[] {
  const sequence: SequenceItem[] = [];
  let globalIndex = 0;

  // Limpiar texto de puntuación y espacios extras
  const cleanedText = stripPunctuation(inputText).replace(/\s+/g, ' ').trim();

  if (!cleanedText) return [];

  // Dividir en palabras
  const words = cleanedText.split(' ');

  // Resolver usando greedy longest-match para frases
  let i = 0;
  while (i < words.length) {
    let matched = false;

    // Intentar match de frase, desde la más larga posible hasta 2 palabras
    for (let len = Math.min(words.length - i, 5); len >= 2; len--) {
      const phraseWords = words.slice(i, i + len);
      const phraseText = phraseWords.join(' ');
      const phraseFilename = findPhrase(manifest, phraseText);

      if (phraseFilename) {
        sequence.push({
          type: 'phrase',
          originalText: phraseText,
          filename: getVideoUrl(manifest, phraseFilename),
          displayFilename: phraseFilename,
          index: globalIndex++,
        });

        // Agregar pausa después de la frase (si no es el último item)
        if (i + len < words.length) {
          sequence.push({
            type: 'pause',
            originalText: ' ',
            index: globalIndex++,
          });
        }

        i += len;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // No se encontró frase, intentar como palabra individual
    const word = words[i];
    const wordFilename = findWord(manifest, word);

    if (wordFilename) {
      sequence.push({
        type: 'word',
        originalText: word,
        filename: getVideoUrl(manifest, wordFilename),
        displayFilename: wordFilename,
        index: globalIndex++,
      });
    } else {
      // No hay video para la palabra completa, deletrear letra por letra
      const letters = word.split('');
      for (const letter of letters) {
        const normalizedLetter = normalizeForLookup(letter);
        
        // Ignorar caracteres vacíos después de normalización
        if (!normalizedLetter) continue;

        const letterFilename = findLetter(manifest, letter);

        if (letterFilename) {
          sequence.push({
            type: 'letter',
            originalText: letter,
            filename: getVideoUrl(manifest, letterFilename),
            displayFilename: letterFilename,
            index: globalIndex++,
          });
        } else {
          // Carácter no soportado
          sequence.push({
            type: 'missing',
            originalText: letter,
            index: globalIndex++,
          });
        }
      }
    }

    // Agregar pausa entre palabras (si no es la última)
    if (i < words.length - 1) {
      sequence.push({
        type: 'pause',
        originalText: ' ',
        index: globalIndex++,
      });
    }

    i++;
  }

  return sequence;
}

/**
 * Filtra la secuencia para obtener solo items reproducibles (con video).
 */
export function getPlayableItems(sequence: SequenceItem[]): SequenceItem[] {
  return sequence.filter(item => item.type !== 'missing');
}

/**
 * Cuenta cuántos items tienen video vs missing.
 */
export function getSequenceStats(sequence: SequenceItem[]) {
  const total = sequence.filter(s => s.type !== 'pause').length;
  const withVideo = sequence.filter(s => s.filename).length;
  const missing = sequence.filter(s => s.type === 'missing').length;
  const phrases = sequence.filter(s => s.type === 'phrase').length;
  const words = sequence.filter(s => s.type === 'word').length;
  const letters = sequence.filter(s => s.type === 'letter').length;

  return { total, withVideo, missing, phrases, words, letters };
}
