/**
 * Utilità per la generazione e gestione dei quiz
 *
 * Contiene le funzioni per creare sessioni di quiz,
 * generare opzioni di risposta e calcolare i risultati.
 */

import type { Product, QuizDifficulty, QuizQuestion, QuizSession } from '../types/product';

/**
 * Mescola un array usando l'algoritmo Fisher-Yates.
 * Non modifica l'array originale, restituisce una nuova copia mescolata.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Genera le opzioni a scelta multipla per una domanda del quiz.
 *
 * Strategia in base alla difficoltà:
 * - facile: i distrattori sono di categorie diverse dal prodotto corretto
 * - media: i distrattori sono della stessa categoria
 * - difficile: i distrattori sono dello stesso brand o molto simili
 *
 * Restituisce un array di 4 prodotti (1 corretto + 3 distrattori), mescolati.
 * Se il pool non è sufficiente, riempie con prodotti casuali dal pool generale.
 *
 * @param correctProduct - Il prodotto corretto (risposta esatta)
 * @param productPool - L'intero pool di prodotti disponibili
 * @param difficulty - Il livello di difficoltà
 * @returns Array di 4 prodotti mescolati
 */
export function generateMultipleChoiceOptions(
  correctProduct: Product,
  productPool: Product[],
  difficulty: QuizDifficulty
): Product[] {
  const NUM_OPTIONS = 4;
  const NUM_DISTRACTORS = NUM_OPTIONS - 1;

  // Escludi il prodotto corretto dal pool
  const availablePool = productPool.filter((p) => p.id !== correctProduct.id);

  if (availablePool.length === 0) {
    // Caso limite: solo un prodotto disponibile
    return [correctProduct];
  }

  let distractors: Product[] = [];

  if (difficulty === 'facile') {
    // Facile: distrattori di categorie diverse
    const differentCategory = availablePool.filter(
      (p) => p.category !== correctProduct.category
    );
    distractors = shuffleArray(differentCategory).slice(0, NUM_DISTRACTORS);
  } else if (difficulty === 'media') {
    // Media: distrattori della stessa categoria
    const sameCategory = availablePool.filter(
      (p) => p.category === correctProduct.category
    );
    distractors = shuffleArray(sameCategory).slice(0, NUM_DISTRACTORS);
  } else {
    // Difficile: distrattori dello stesso brand, poi stessa categoria
    const sameBrand = availablePool.filter(
      (p) => p.brand === correctProduct.brand
    );
    distractors = shuffleArray(sameBrand).slice(0, NUM_DISTRACTORS);

    // Se non ci sono abbastanza prodotti dello stesso brand,
    // aggiungi prodotti della stessa categoria
    if (distractors.length < NUM_DISTRACTORS) {
      const usedIds = new Set(distractors.map((d) => d.id));
      const sameCategory = availablePool.filter(
        (p) => p.category === correctProduct.category && !usedIds.has(p.id)
      );
      const additional = shuffleArray(sameCategory).slice(
        0,
        NUM_DISTRACTORS - distractors.length
      );
      distractors = [...distractors, ...additional];
    }
  }

  // Se ancora non abbiamo abbastanza distrattori, riempi dal pool generale
  if (distractors.length < NUM_DISTRACTORS) {
    const usedIds = new Set([correctProduct.id, ...distractors.map((d) => d.id)]);
    const remaining = availablePool.filter((p) => !usedIds.has(p.id));
    const fallback = shuffleArray(remaining).slice(
      0,
      NUM_DISTRACTORS - distractors.length
    );
    distractors = [...distractors, ...fallback];
  }

  // Componi le opzioni: prodotto corretto + distrattori, poi mescola
  const options = shuffleArray([correctProduct, ...distractors]);
  return options;
}

/**
 * Genera una sessione di quiz completa.
 *
 * @param products - Array di prodotti da cui generare le domande
 * @param count - Numero di domande desiderato
 * @param difficulty - Livello di difficoltà
 * @returns Una QuizSession pronta per essere utilizzata
 */
export function generateQuizSession(
  products: Product[],
  count: number,
  difficulty: QuizDifficulty
): QuizSession {
  if (products.length === 0) {
    return {
      questions: [],
      currentIndex: 0,
      answers: [],
      score: 0,
      streak: 0,
      maxStreak: 0,
      isComplete: true,
    };
  }

  // Limita il numero di domande al numero di prodotti disponibili
  const actualCount = Math.min(count, products.length);

  // Seleziona i prodotti per le domande (mescolati, senza duplicati)
  const selectedProducts = shuffleArray(products).slice(0, actualCount);

  // Genera le domande
  const questions: QuizQuestion[] = selectedProducts.map((product) => {
    const options = generateMultipleChoiceOptions(product, products, difficulty);
    const correctIndex = options.findIndex((opt) => opt.id === product.id);

    return {
      product,
      options,
      correctIndex,
    };
  });

  return {
    questions,
    currentIndex: 0,
    answers: new Array(questions.length).fill(null),
    score: 0,
    streak: 0,
    maxStreak: 0,
    isComplete: false,
  };
}

/**
 * Calcola la percentuale di accuratezza.
 *
 * @param correct - Numero di risposte corrette
 * @param total - Numero totale di domande
 * @returns Percentuale da 0 a 100 (arrotondata a 1 decimale), o 0 se total è 0
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 1000) / 10;
}
