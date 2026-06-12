import React, { useState, useCallback } from 'react';
import { getQuizStats, resetQuizStats, getLearningProgress, removeFromToReview } from '../utils/storage';
import { products } from '../data/products';
import { CATEGORY_LABELS } from '../types/product';
import type { ProductCategory } from '../types/product';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import './StatsPage.css';

export const StatsPage: React.FC = () => {
  const [stats, setStats] = useState(() => getQuizStats());
  const [learning, setLearning] = useState(() => getLearningProgress());

  const accuracy =
    stats.totalQuestions > 0
      ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
      : 0;

  // ── Category bar data, sorted by most wrong first ──
  const categoryEntries = Object.entries(stats.categoryStats)
    .map(([key, val]) => ({
      key,
      label: CATEGORY_LABELS[key as ProductCategory] ?? key,
      correct: val.correct,
      wrong: val.wrong,
      total: val.correct + val.wrong,
    }))
    .sort((a, b) => b.wrong - a.wrong);

  // ── Brand bar data, sorted by most wrong first ──
  const brandEntries = Object.entries(stats.brandStats)
    .filter(([, val]) => val.correct + val.wrong > 0)
    .map(([key, val]) => ({
      key,
      label: key,
      correct: val.correct,
      wrong: val.wrong,
      total: val.correct + val.wrong,
    }))
    .sort((a, b) => b.wrong - a.wrong);

  // ── To-review products ──
  const reviewProducts = learning.toReview
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as typeof products;

  // ── Learned count ──
  const learnedCount = learning.learned.length;
  const totalProducts = products.length;
  const learnedPercent =
    totalProducts > 0 ? Math.round((learnedCount / totalProducts) * 100) : 0;

  // ── Handlers ──
  const handleRemoveFromReview = useCallback((productId: string) => {
    removeFromToReview(productId);
    setLearning(getLearningProgress());
  }, []);

  const handleReset = useCallback(() => {
    const confirmed = window.confirm(
      'Sei sicuro di voler resettare tutte le statistiche? Questa azione è irreversibile.'
    );
    if (confirmed) {
      resetQuizStats();
      setStats(getQuizStats());
    }
  }, []);

  return (
    <div className="stats-page">
      <h1 className="stats-page__title">Statistiche</h1>

      {/* ── Summary Cards ── */}
      <div className="stats-summary">
        <div className="stats-card">
          <span className="stats-card__icon">🎯</span>
          <span className="stats-card__value">{stats.totalQuizzes}</span>
          <span className="stats-card__label">Quiz completati</span>
        </div>
        <div className="stats-card">
          <span className="stats-card__icon">✅</span>
          <span className="stats-card__value">{stats.correctAnswers}</span>
          <span className="stats-card__label">Risposte corrette</span>
        </div>
        <div className="stats-card">
          <span className="stats-card__icon">❌</span>
          <span className="stats-card__value">{stats.wrongAnswers}</span>
          <span className="stats-card__label">Risposte errate</span>
        </div>
        <div className="stats-card">
          <span className="stats-card__icon">📊</span>
          <span className="stats-card__value">{accuracy}%</span>
          <span className="stats-card__label">Accuracy</span>
        </div>
        <div className="stats-card">
          <span className="stats-card__icon">🔥</span>
          <span className="stats-card__value">{stats.bestStreak}</span>
          <span className="stats-card__label">Miglior streak</span>
        </div>
      </div>

      {/* ── Categorie ── */}
      <section className="stats-section">
        <h2 className="stats-section__title">Categorie</h2>
        {categoryEntries.length > 0 ? (
          <div className="stats-bar-list">
            {categoryEntries.map((entry) => (
              <div className="stats-bar-item" key={entry.key}>
                <div className="stats-bar__header">
                  <span className="stats-bar__name">{entry.label}</span>
                  <div className="stats-bar__counts">
                    <span className="stats-bar__count--correct">
                      ✓ {entry.correct}
                    </span>
                    <span className="stats-bar__count--wrong">
                      ✗ {entry.wrong}
                    </span>
                  </div>
                </div>
                <div className="stats-bar__track">
                  <div
                    className="stats-bar__fill--correct"
                    style={{
                      width: `${(entry.correct / entry.total) * 100}%`,
                    }}
                  />
                  <div
                    className="stats-bar__fill--wrong"
                    style={{
                      width: `${(entry.wrong / entry.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="stats-empty">
            <span className="stats-empty__icon">📭</span>
            Nessuna statistica per categoria disponibile. Completa un quiz per iniziare!
          </div>
        )}
      </section>

      {/* ── Marche ── */}
      <section className="stats-section">
        <h2 className="stats-section__title">Marche</h2>
        {brandEntries.length > 0 ? (
          <div className="stats-bar-list">
            {brandEntries.map((entry) => (
              <div className="stats-bar-item" key={entry.key}>
                <div className="stats-bar__header">
                  <span className="stats-bar__name">{entry.label}</span>
                  <div className="stats-bar__counts">
                    <span className="stats-bar__count--correct">
                      ✓ {entry.correct}
                    </span>
                    <span className="stats-bar__count--wrong">
                      ✗ {entry.wrong}
                    </span>
                  </div>
                </div>
                <div className="stats-bar__track">
                  <div
                    className="stats-bar__fill--correct"
                    style={{
                      width: `${(entry.correct / entry.total) * 100}%`,
                    }}
                  />
                  <div
                    className="stats-bar__fill--wrong"
                    style={{
                      width: `${(entry.wrong / entry.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="stats-empty">
            <span className="stats-empty__icon">📭</span>
            Nessuna statistica per marca disponibile. Completa un quiz per iniziare!
          </div>
        )}
      </section>

      {/* ── Prodotti da ripassare ── */}
      <section className="stats-section">
        <h2 className="stats-section__title">Prodotti da ripassare</h2>
        {reviewProducts.length > 0 ? (
          <div className="stats-review-list">
            {reviewProducts.map((product) => (
              <div className="stats-review-item" key={product.id}>
                <div className="stats-review-item__info">
                  <span className="stats-review-item__name">
                    {product.fullName}
                  </span>
                  <div className="stats-review-item__meta">
                    <span className="stats-review-item__brand">
                      {product.brand}
                    </span>
                    <Badge
                      label=""
                      variant="category"
                      category={product.category}
                      size="sm"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFromReview(product.id)}
                  aria-label={`Rimuovi ${product.fullName} dalla lista di ripasso`}
                >
                  Rimuovi
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="stats-empty">
            <span className="stats-empty__icon">🎉</span>
            Nessun prodotto da ripassare. Ottimo lavoro!
          </div>
        )}
      </section>

      {/* ── Prodotti imparati ── */}
      <section className="stats-section">
        <h2 className="stats-section__title">Prodotti imparati</h2>
        <div className="stats-learned">
          <div className="stats-learned__header">
            <span className="stats-learned__count">{learnedCount}</span>
            <span className="stats-learned__total">
              su {totalProducts} prodotti
            </span>
          </div>
          <div className="stats-learned__bar-track">
            <div
              className="stats-learned__bar-fill"
              style={{ width: `${learnedPercent}%` }}
            />
          </div>
          <span className="stats-learned__percentage">
            {learnedPercent}% completato
          </span>
        </div>
      </section>

      {/* ── Reset ── */}
      <div className="stats-reset">
        <Button variant="danger" onClick={handleReset}>
          Resetta statistiche
        </Button>
        <p className="stats-reset__note">
          Cancella tutti i dati dei quiz. I progressi di apprendimento non verranno eliminati.
        </p>
      </div>
    </div>
  );
};
