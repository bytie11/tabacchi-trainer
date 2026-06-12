import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { products, getAllBrands, getAllCategories } from '../data/products';
import { getFilteredProducts } from '../utils/filters';
import { generateQuizSession, calculateAccuracy } from '../utils/quiz';
import { updateQuizStats } from '../utils/storage';
import { ProductFilters } from '../components/ProductFilters';
import { ProductImage } from '../components/ProductImage';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import type { QuizDifficulty, QuizSession, ProductCategory } from '../types/product';
import './QuizPage.css';

type QuizState = 'setup' | 'playing' | 'results';

const DIFFICULTY_OPTIONS: { value: QuizDifficulty; label: string; desc: string }[] = [
  { value: 'facile', label: 'Facile 🟢', desc: 'Opzioni di categorie diverse' },
  { value: 'media', label: 'Media 🟡', desc: 'Opzioni della stessa categoria' },
  { value: 'difficile', label: 'Difficile 🔴', desc: 'Opzioni dello stesso brand o simili' },
];

const COUNT_OPTIONS = [
  { value: 10, label: '10 Domande' },
  { value: 20, label: '20 Domande' },
  { value: 50, label: '50 Domande' },
  { value: 999, label: 'Tutte le domande' },
];

export const QuizPage: React.FC = () => {
  const navigate = useNavigate();

  // --- Stati di Setup ---
  const [gameState, setGameState] = useState<QuizState>('setup');
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('media');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [onlyWithDarkenedImages, setOnlyWithDarkenedImages] = useState(false);
  const [useDarkenedImages, setUseDarkenedImages] = useState(() => {
    const saved = localStorage.getItem('tabacchi-trainer-quiz-use-darkened');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleUseDarkenedChange = (val: boolean) => {
    setUseDarkenedImages(val);
    localStorage.setItem('tabacchi-trainer-quiz-use-darkened', JSON.stringify(val));
  };

  // --- Stati di Gameplay ---
  const [session, setSession] = useState<QuizSession | null>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  
  // Statistiche della sessione corrente
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    wrong: 0,
    maxStreak: 0,
    currentStreak: 0,
    brandStats: {} as Record<string, { correct: number; wrong: number }>,
    categoryStats: {} as Record<string, { correct: number; wrong: number }>,
    productStats: {} as Record<string, { correct: number; wrong: number }>,
  });

  const allCategories = useMemo(() => getAllCategories(), []);
  const allBrands = useMemo(() => getAllBrands(), []);

  // Pool di prodotti filtrati per il quiz
  const quizPool = useMemo(() => {
    let pool = getFilteredProducts(products, {
      categories: selectedCategories,
      brands: selectedBrands,
      onlyWithImages: onlyWithImages,
    });
    if (onlyWithDarkenedImages) {
      pool = pool.filter((p) => !!p.quizImageUrl);
    }
    return pool;
  }, [selectedCategories, selectedBrands, onlyWithImages, onlyWithDarkenedImages]);

  const canStartQuiz = quizPool.length >= 4;

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setOnlyWithImages(false);
    setOnlyWithDarkenedImages(false);
  };

  // --- Avvia Quiz ---
  const handleStartQuiz = () => {
    if (!canStartQuiz) return;

    const newSession = generateQuizSession(quizPool, questionCount, difficulty);
    setSession(newSession);
    setSelectedAnswerIndex(null);
    setSessionStats({
      correct: 0,
      wrong: 0,
      maxStreak: 0,
      currentStreak: 0,
      brandStats: {},
      categoryStats: {},
      productStats: {},
    });
    setGameState('playing');
  };

  // --- Risposta ---
  const handleAnswerSelect = (index: number) => {
    if (selectedAnswerIndex !== null || !session) return;

    setSelectedAnswerIndex(index);
    const currentQuestion = session.questions[session.currentIndex];
    const isCorrect = index === currentQuestion.correctIndex;
    const correctProduct = currentQuestion.product;

    setSessionStats((prev) => {
      const nextStreak = isCorrect ? prev.currentStreak + 1 : 0;
      
      const bStats = { ...prev.brandStats };
      const brand = correctProduct.brand;
      bStats[brand] = bStats[brand] || { correct: 0, wrong: 0 };
      if (isCorrect) bStats[brand].correct++; else bStats[brand].wrong++;

      const cStats = { ...prev.categoryStats };
      const cat = correctProduct.category;
      cStats[cat] = cStats[cat] || { correct: 0, wrong: 0 };
      if (isCorrect) cStats[cat].correct++; else cStats[cat].wrong++;

      const pStats = { ...prev.productStats };
      const pid = correctProduct.id;
      pStats[pid] = pStats[pid] || { correct: 0, wrong: 0 };
      if (isCorrect) pStats[pid].correct++; else pStats[pid].wrong++;

      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        wrong: prev.wrong + (isCorrect ? 0 : 1),
        currentStreak: nextStreak,
        maxStreak: Math.max(prev.maxStreak, nextStreak),
        brandStats: bStats,
        categoryStats: cStats,
        productStats: pStats,
      };
    });
  };

  // --- Domanda Successiva / Conclusione ---
  const handleNextQuestion = () => {
    if (!session) return;

    if (session.currentIndex < session.questions.length - 1) {
      setSelectedAnswerIndex(null);
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentIndex: prev.currentIndex + 1,
        };
      });
    } else {
      // Fine del quiz: salva su localStorage ed entra in result state
      updateQuizStats(
        sessionStats.correct,
        sessionStats.wrong,
        sessionStats.maxStreak,
        sessionStats.brandStats,
        sessionStats.categoryStats,
        sessionStats.productStats
      );
      setGameState('results');
    }
  };

  // --- Risultati finali ---
  const finalAccuracy = useMemo(() => {
    return calculateAccuracy(sessionStats.correct, sessionStats.correct + sessionStats.wrong);
  }, [sessionStats.correct, sessionStats.wrong]);

  const scoreEmoji = useMemo(() => {
    if (finalAccuracy >= 90) return { icon: '🏆', text: 'Esperto Eccellente!' };
    if (finalAccuracy >= 70) return { icon: '🎯', text: 'Ottimo Lavoro!' };
    if (finalAccuracy >= 50) return { icon: '💪', text: 'Buon Impegno!' };
    return { icon: '📚', text: 'Continua a studiare!' };
  }, [finalAccuracy]);

  // =========================================================================
  // RENDER SETUP STATE
  // =========================================================================
  if (gameState === 'setup') {
    return (
      <div className="quiz-page quiz-page--setup">
        <header className="quiz-header">
          <h1 className="quiz-page__title">Quiz Allenamento</h1>
          <p className="quiz-page__subtitle">
            Configura il quiz per metterti alla prova sul riconoscimento dei pacchetti.
          </p>
        </header>

        <div className="quiz-setup-grid">
          {/* Colonna Sinistra: Filtri Categoria/Marca */}
          <div className="quiz-setup-section">
            <h3 className="quiz-setup-section__title">1. Filtra prodotti</h3>
            <ProductFilters
              categories={allCategories}
              brands={allBrands}
              selectedCategories={selectedCategories}
              selectedBrands={selectedBrands}
              onCategoryChange={setSelectedCategories}
              onBrandChange={setSelectedBrands}
              onReset={handleResetFilters}
              showImageFilter={true}
              onlyWithImages={onlyWithImages}
              onImageFilterChange={setOnlyWithImages}
            />
          </div>

          {/* Colonna Destra: Opzioni sessione */}
          <div className="quiz-setup-options">
            <div className="quiz-setup-section">
              <h3 className="quiz-setup-section__title">2. Difficoltà</h3>
              <div className="quiz-difficulty-selector">
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`quiz-difficulty-card ${difficulty === opt.value ? 'active' : ''}`}
                    onClick={() => setDifficulty(opt.value)}
                    type="button"
                  >
                    <span className="quiz-difficulty-card__label">{opt.label}</span>
                    <span className="quiz-difficulty-card__desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="quiz-setup-section">
              <h3 className="quiz-setup-section__title">3. Numero Domande</h3>
              <div className="quiz-count-selector">
                {COUNT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`quiz-count-chip ${questionCount === opt.value ? 'active' : ''}`}
                    onClick={() => setQuestionCount(opt.value)}
                    type="button"
                  >
                    {opt.value === 999 ? `Tutte (${quizPool.length})` : opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="quiz-setup-section">
              <h3 className="quiz-setup-section__title">4. Immagini Oscurate</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-1) 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', userSelect: 'none', fontSize: 'var(--font-size-sm)' }}>
                  <input
                    type="checkbox"
                    checked={useDarkenedImages}
                    onChange={(e) => handleUseDarkenedChange(e.target.checked)}
                  />
                  <span>Usa immagini oscurate, se disponibili (più difficile)</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', userSelect: 'none', fontSize: 'var(--font-size-sm)' }}>
                  <input
                    type="checkbox"
                    checked={onlyWithDarkenedImages}
                    onChange={(e) => setOnlyWithDarkenedImages(e.target.checked)}
                  />
                  <span>Solo prodotti con immagine oscurata</span>
                </label>
              </div>
            </div>

            {/* Riassunto e Pulsante di Avvio */}
            <div className="quiz-setup-summary-card">
              <div className="quiz-setup-summary-info">
                <span>Prodotti disponibili:</span>
                <strong className={canStartQuiz ? 'text-success' : 'text-danger'}>
                  {quizPool.length}
                </strong>
              </div>

              {!canStartQuiz && (
                <div className="quiz-setup-error" role="alert">
                  ⚠️ Sono necessari almeno 4 prodotti per generare le opzioni del quiz. Riduci o rimuovi i filtri per procedere.
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canStartQuiz}
                onClick={handleStartQuiz}
              >
                Inizia Quiz 🚀
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER PLAYING STATE
  // =========================================================================
  if (gameState === 'playing' && session) {
    const currentQuestion = session.questions[session.currentIndex];
    const isAnswered = selectedAnswerIndex !== null;
    const progressPercent = ((session.currentIndex) / session.questions.length) * 100;

    return (
      <div className="quiz-page quiz-page--playing">
        {/* Barra di Avanzamento Superiore */}
        <div className="quiz-progress-wrapper">
          <div className="quiz-progress-info">
            <span className="quiz-progress-text">
              Domanda <strong>{session.currentIndex + 1}</strong> di {session.questions.length}
            </span>
            <div className="quiz-progress-stats">
              <span className="quiz-stat-pill quiz-stat-pill--correct">✓ {sessionStats.correct}</span>
              <span className="quiz-stat-pill quiz-stat-pill--wrong">✗ {sessionStats.wrong}</span>
              <span className="quiz-stat-pill quiz-stat-pill--streak">🔥 {sessionStats.currentStreak}</span>
            </div>
          </div>
          <div className="quiz-progress-track">
            <div className="quiz-progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Layout Domanda: Immagine a Sinistra, Opzioni a Destra */}
        <div className="quiz-game-layout">
          <div className="quiz-game-layout__image">
            <div className="quiz-image-box">
              <ProductImage product={currentQuestion.product} size="lg" variant={useDarkenedImages ? 'quiz' : 'default'} />
            </div>
          </div>

          <div className="quiz-game-layout__options">
            <h2 className="quiz-question-title">Qual è questo prodotto?</h2>

            <div className="quiz-options-list">
              {currentQuestion.options.map((option, idx) => {
                const isCorrectOption = idx === currentQuestion.correctIndex;
                const isSelectedOption = idx === selectedAnswerIndex;

                let optionClass = '';
                if (isAnswered) {
                  if (isCorrectOption) {
                    optionClass = 'option--correct';
                  } else if (isSelectedOption) {
                    optionClass = 'option--incorrect';
                  } else {
                    optionClass = 'option--disabled';
                  }
                }

                return (
                  <button
                    key={option.id}
                    className={`quiz-option-btn ${optionClass}`}
                    onClick={() => handleAnswerSelect(idx)}
                    disabled={isAnswered}
                    type="button"
                  >
                    <span className="quiz-option-btn__index">{['A', 'B', 'C', 'D'][idx]}</span>
                    <span className="quiz-option-btn__text">{option.fullName}</span>
                  </button>
                );
              })}
            </div>

            {/* Pannello Feedback Post-Risposta */}
            {isAnswered && (
              <div className="quiz-feedback-panel">
                <div className={`quiz-feedback-title ${selectedAnswerIndex === currentQuestion.correctIndex ? 'text-success' : 'text-danger'}`}>
                  {selectedAnswerIndex === currentQuestion.correctIndex
                    ? '🎉 Esatto!'
                    : `❌ Errato! La risposta corretta era: ${currentQuestion.product.fullName}`}
                </div>

                <div className="quiz-product-details-card">
                  <h4 className="quiz-details-title">Dettagli Prodotto</h4>
                  <div className="quiz-details-grid">
                    <div className="quiz-detail-col">
                      <span className="quiz-detail-lbl">Marca:</span>
                      <span className="quiz-detail-val">{currentQuestion.product.brand}</span>
                    </div>
                    <div className="quiz-detail-col">
                      <span className="quiz-detail-lbl">Categoria:</span>
                      <Badge label="" variant="category" category={currentQuestion.product.category} size="sm" />
                    </div>
                    {currentQuestion.product.variant && (
                      <div className="quiz-detail-col">
                        <span className="quiz-detail-lbl">Variante:</span>
                        <span className="quiz-detail-val">{currentQuestion.product.variant}</span>
                      </div>
                    )}
                    {currentQuestion.product.flavor && (
                      <div className="quiz-detail-col">
                        <span className="quiz-detail-lbl">Aroma:</span>
                        <span className="quiz-detail-val">{currentQuestion.product.flavor}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button variant="primary" size="lg" onClick={handleNextQuestion} fullWidth>
                  {session.currentIndex < session.questions.length - 1 ? 'Domanda Successiva ➔' : 'Vedi Risultati ➔'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER RESULTS STATE
  // =========================================================================
  return (
    <div className="quiz-page quiz-page--results">
      <div className="quiz-results-card">
        <span className="quiz-results-emoji" aria-hidden="true">
          {scoreEmoji.icon}
        </span>
        <h1 className="quiz-results-title">{scoreEmoji.text}</h1>
        <p className="quiz-results-subtitle">Hai completato il quiz!</p>

        {/* Tabella Punteggi */}
        <div className="quiz-results-stats-grid">
          <div className="quiz-result-stat-box">
            <span className="quiz-result-stat-val">{finalAccuracy}%</span>
            <span className="quiz-result-stat-lbl">Precisione</span>
          </div>
          <div className="quiz-result-stat-box">
            <span className="quiz-result-stat-val quiz-result-stat-val--correct">
              {sessionStats.correct}
            </span>
            <span className="quiz-result-stat-lbl">Corrette</span>
          </div>
          <div className="quiz-result-stat-box">
            <span className="quiz-result-stat-val quiz-result-stat-val--wrong">
              {sessionStats.wrong}
            </span>
            <span className="quiz-result-stat-lbl">Errate</span>
          </div>
          <div className="quiz-result-stat-box">
            <span className="quiz-result-stat-val">{sessionStats.maxStreak}</span>
            <span className="quiz-result-stat-lbl">Miglior Streak</span>
          </div>
        </div>

        {/* Pulsanti Finali */}
        <div className="quiz-results-actions">
          <Button variant="primary" size="lg" onClick={handleStartQuiz}>
            🔄 Ricomincia Quiz
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setGameState('setup')}>
            ⚙️ Cambia Impostazioni
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate('/')}>
            🏠 Torna alla Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
