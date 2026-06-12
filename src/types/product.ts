/**
 * Definizioni dei tipi per Tabacchi Trainer
 *
 * Questo file contiene tutti i tipi, interfacce e costanti
 * utilizzati nell'applicazione.
 */

// --- Categorie prodotto ---

export type ProductCategory =
  | 'sigarette'
  | 'prodotti_senza_combustione'
  | 'trinciato'
  | 'sigari'
  | 'sigaretti'
  | 'cartine'
  | 'filtri'
  | 'accessori'
  | 'altro';

export type ImageStatus = 'available' | 'placeholder' | 'needs_review';

export type QuizDifficulty = 'facile' | 'media' | 'difficile';

// --- Modello prodotto ---

export interface Product {
  id: string;
  brand: string;
  productName: string;
  fullName: string;
  category: ProductCategory;
  subcategory?: string;
  variant?: string;
  flavor?: string;
  format?: string;
  nicotineInfo?: string;
  imageUrl: string;
  quizImageUrl?: string;
  imageSource?: string;
  imageStatus: ImageStatus;
  aliases?: string[];
  tags?: string[];
  notes?: string;
}

// --- Quiz ---

export interface QuizFilters {
  categories: ProductCategory[];
  brands: string[];
  tags: string[];
  includeplaceholders: boolean;
  onlyWithImages: boolean;
  onlyWithDarkenedImages?: boolean;
  useDarkenedImages?: boolean;
  difficulty: QuizDifficulty;
}

export interface QuizQuestion {
  product: Product;
  options: Product[];
  correctIndex: number;
}

export interface QuizSession {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: (number | null)[];
  score: number;
  streak: number;
  maxStreak: number;
  isComplete: boolean;
}

export interface QuizStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  bestStreak: number;
  brandStats: Record<string, { correct: number; wrong: number }>;
  categoryStats: Record<string, { correct: number; wrong: number }>;
  productStats: Record<string, { correct: number; wrong: number }>;
  lastQuizDate?: string;
}

// --- Apprendimento ---

export interface LearningProgress {
  learned: string[]; // id dei prodotti appresi
  toReview: string[]; // id dei prodotti da ripassare
}

export interface LearningFilters {
  categories: ProductCategory[];
  brands: string[];
  tags: string[];
  imageStatus: ImageStatus[];
  showLearned: boolean;
  showToReview: boolean;
  showNew: boolean;
}

// --- Preferenze utente ---

export interface UserPreferences {
  lastMode?: string;
  quizFilters?: Partial<QuizFilters>;
  learningFilters?: Partial<LearningFilters>;
}

// --- Costanti con etichette in italiano ---

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  sigarette: 'Sigarette',
  prodotti_senza_combustione: 'Prodotti senza combustione',
  trinciato: 'Trinciato',
  sigari: 'Sigari',
  sigaretti: 'Sigaretti',
  cartine: 'Cartine',
  filtri: 'Filtri',
  accessori: 'Accessori',
  altro: 'Altro',
};

export const CATEGORY_ICONS: Record<ProductCategory, string> = {
  sigarette: '🚬',
  prodotti_senza_combustione: '🔋',
  trinciato: '🌿',
  sigari: '👔',
  sigaretti: '📏',
  cartine: '📄',
  filtri: '🔘',
  accessori: '🔧',
  altro: '📦',
};
