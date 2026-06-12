/**
 * Utilità per la persistenza dei dati in localStorage
 *
 * Tutte le funzioni gestiscono errori di lettura/scrittura
 * e dati corrotti con try/catch, restituendo valori di default sicuri.
 */

import type { LearningProgress, QuizStats, UserPreferences } from '../types/product';

// --- Chiavi di storage ---

export const STORAGE_KEYS = {
  QUIZ_STATS: 'tabacchi-trainer-quiz-stats',
  LEARNING_PROGRESS: 'tabacchi-trainer-learning-progress',
  USER_PREFERENCES: 'tabacchi-trainer-user-preferences',
} as const;

// --- Valori di default ---

function getDefaultQuizStats(): QuizStats {
  return {
    totalQuizzes: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    bestStreak: 0,
    brandStats: {},
    categoryStats: {},
    productStats: {},
  };
}

function getDefaultLearningProgress(): LearningProgress {
  return {
    learned: [],
    toReview: [],
  };
}

function getDefaultUserPreferences(): UserPreferences {
  return {};
}

// --- Funzioni helper per lettura/scrittura sicura ---

function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    // Dato corrotto o localStorage non disponibile
    console.warn(`[Tabacchi Trainer] Errore lettura "${key}" da localStorage. Uso valori di default.`);
    return defaultValue;
  }
}

function safeSetItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn(`[Tabacchi Trainer] Errore scrittura "${key}" in localStorage.`);
  }
}

// =============================================
// QUIZ STATS
// =============================================

/**
 * Legge le statistiche dei quiz da localStorage.
 * Restituisce statistiche vuote se non presenti o corrotte.
 */
export function getQuizStats(): QuizStats {
  return safeGetItem<QuizStats>(STORAGE_KEYS.QUIZ_STATS, getDefaultQuizStats());
}

/**
 * Aggiorna le statistiche dei quiz dopo una sessione completata.
 *
 * @param correct - Numero di risposte corrette nella sessione
 * @param wrong - Numero di risposte errate nella sessione
 * @param streak - La striscia massima raggiunta nella sessione
 * @param brandStats - Statistiche per brand nella sessione
 * @param categoryStats - Statistiche per categoria nella sessione
 * @param productStats - Statistiche per prodotto nella sessione
 */
export function updateQuizStats(
  correct: number,
  wrong: number,
  streak: number,
  brandStats: Record<string, { correct: number; wrong: number }>,
  categoryStats: Record<string, { correct: number; wrong: number }>,
  productStats: Record<string, { correct: number; wrong: number }>
): void {
  const current = getQuizStats();

  // Aggiorna i contatori generali
  current.totalQuizzes += 1;
  current.totalQuestions += correct + wrong;
  current.correctAnswers += correct;
  current.wrongAnswers += wrong;
  current.bestStreak = Math.max(current.bestStreak, streak);
  current.lastQuizDate = new Date().toISOString();

  // Merge delle statistiche per brand
  for (const [brand, stats] of Object.entries(brandStats)) {
    if (!current.brandStats[brand]) {
      current.brandStats[brand] = { correct: 0, wrong: 0 };
    }
    current.brandStats[brand].correct += stats.correct;
    current.brandStats[brand].wrong += stats.wrong;
  }

  // Merge delle statistiche per categoria
  for (const [category, stats] of Object.entries(categoryStats)) {
    if (!current.categoryStats[category]) {
      current.categoryStats[category] = { correct: 0, wrong: 0 };
    }
    current.categoryStats[category].correct += stats.correct;
    current.categoryStats[category].wrong += stats.wrong;
  }

  // Merge delle statistiche per prodotto
  for (const [productId, stats] of Object.entries(productStats)) {
    if (!current.productStats[productId]) {
      current.productStats[productId] = { correct: 0, wrong: 0 };
    }
    current.productStats[productId].correct += stats.correct;
    current.productStats[productId].wrong += stats.wrong;
  }

  safeSetItem(STORAGE_KEYS.QUIZ_STATS, current);
}

/**
 * Resetta tutte le statistiche dei quiz.
 */
export function resetQuizStats(): void {
  safeSetItem(STORAGE_KEYS.QUIZ_STATS, getDefaultQuizStats());
}

// =============================================
// LEARNING PROGRESS
// =============================================

/**
 * Legge il progresso di apprendimento da localStorage.
 */
export function getLearningProgress(): LearningProgress {
  return safeGetItem<LearningProgress>(
    STORAGE_KEYS.LEARNING_PROGRESS,
    getDefaultLearningProgress()
  );
}

/**
 * Segna un prodotto come "appreso".
 * Lo rimuove dalla lista "da ripassare" se presente.
 */
export function markAsLearned(productId: string): void {
  const progress = getLearningProgress();

  // Rimuovi da toReview se presente
  progress.toReview = progress.toReview.filter((id) => id !== productId);

  // Aggiungi a learned se non già presente
  if (!progress.learned.includes(productId)) {
    progress.learned.push(productId);
  }

  safeSetItem(STORAGE_KEYS.LEARNING_PROGRESS, progress);
}

/**
 * Segna un prodotto come "da ripassare".
 * Lo rimuove dalla lista "appresi" se presente.
 */
export function markAsToReview(productId: string): void {
  const progress = getLearningProgress();

  // Rimuovi da learned se presente
  progress.learned = progress.learned.filter((id) => id !== productId);

  // Aggiungi a toReview se non già presente
  if (!progress.toReview.includes(productId)) {
    progress.toReview.push(productId);
  }

  safeSetItem(STORAGE_KEYS.LEARNING_PROGRESS, progress);
}

/**
 * Rimuove un prodotto dalla lista "appresi".
 */
export function removeFromLearned(productId: string): void {
  const progress = getLearningProgress();
  progress.learned = progress.learned.filter((id) => id !== productId);
  safeSetItem(STORAGE_KEYS.LEARNING_PROGRESS, progress);
}

/**
 * Rimuove un prodotto dalla lista "da ripassare".
 */
export function removeFromToReview(productId: string): void {
  const progress = getLearningProgress();
  progress.toReview = progress.toReview.filter((id) => id !== productId);
  safeSetItem(STORAGE_KEYS.LEARNING_PROGRESS, progress);
}

// =============================================
// USER PREFERENCES
// =============================================

/**
 * Legge le preferenze utente da localStorage.
 */
export function getUserPreferences(): UserPreferences {
  return safeGetItem<UserPreferences>(
    STORAGE_KEYS.USER_PREFERENCES,
    getDefaultUserPreferences()
  );
}

/**
 * Aggiorna le preferenze utente (merge parziale).
 * I campi non specificati vengono mantenuti invariati.
 */
export function updateUserPreferences(prefs: Partial<UserPreferences>): void {
  const current = getUserPreferences();
  const updated = { ...current, ...prefs };
  safeSetItem(STORAGE_KEYS.USER_PREFERENCES, updated);
}
