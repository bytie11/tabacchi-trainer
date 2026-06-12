import React, { useState, useMemo } from 'react';
import { products, getAllBrands, getAllCategories } from '../data/products';
import { getFilteredProducts } from '../utils/filters';
import {
  getLearningProgress,
  markAsLearned,
  markAsToReview,
  removeFromLearned,
  removeFromToReview,
} from '../utils/storage';
import { ProductFilters } from '../components/ProductFilters';
import { ProductImage } from '../components/ProductImage';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import type { ProductCategory } from '../types/product';
import './LearningPage.css';

export const LearningPage: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [progress, setProgress] = useState(() => getLearningProgress());
  
  // Stati dei filtri di apprendimento
  const [showLearned, setShowLearned] = useState(true);
  const [showToReview, setShowToReview] = useState(true);
  const [showNew, setShowNew] = useState(true);

  // Tiene traccia di quali carte sono girate (sul retro)
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const allCategories = useMemo(() => getAllCategories(), []);
  const allBrands = useMemo(() => getAllBrands(), []);

  // Filtra i prodotti
  const filteredProducts = useMemo(() => {
    const baseFiltered = getFilteredProducts(products, {
      categories: selectedCategories,
      brands: selectedBrands,
    });

    return baseFiltered.filter((product) => {
      const isLearned = progress.learned.includes(product.id);
      const isToReview = progress.toReview.includes(product.id);
      const isNew = !isLearned && !isToReview;

      if (isLearned && !showLearned) return false;
      if (isToReview && !showToReview) return false;
      if (isNew && !showNew) return false;

      return true;
    });
  }, [selectedCategories, selectedBrands, progress, showLearned, showToReview, showNew]);

  // Gestione Flip della carta
  const handleCardClick = (productId: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Azioni di apprendimento
  const handleLearned = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita il flip cliccando sul bottone
    if (progress.learned.includes(productId)) {
      removeFromLearned(productId);
    } else {
      markAsLearned(productId);
    }
    setProgress(getLearningProgress());
  };

  const handleToReview = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita il flip cliccando sul bottone
    if (progress.toReview.includes(productId)) {
      removeFromToReview(productId);
    } else {
      markAsToReview(productId);
    }
    setProgress(getLearningProgress());
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setShowLearned(true);
    setShowToReview(true);
    setShowNew(true);
  };

  return (
    <div className="learning-page">
      <header className="learning-header">
        <h1 className="learning-page__title">Learning Flashcards</h1>
        <p className="learning-page__subtitle">
          Clicca sulle carte per girarle e memorizzare i dettagli del prodotto.
        </p>
      </header>

      {/* Contatore progressi globale */}
      <section className="learning-stats-bar" aria-label="Progressi di apprendimento">
        <div className="learning-stats-bar__item">
          <span className="learning-stats-bar__num">{products.length}</span>
          <span className="learning-stats-bar__label">Prodotti totali</span>
        </div>
        <div className="learning-stats-bar__item">
          <span className="learning-stats-bar__num learning-stats-bar__num--learned">
            {progress.learned.length}
          </span>
          <span className="learning-stats-bar__label">Imparati</span>
        </div>
        <div className="learning-stats-bar__item">
          <span className="learning-stats-bar__num learning-stats-bar__num--review">
            {progress.toReview.length}
          </span>
          <span className="learning-stats-bar__label">Da ripassare</span>
        </div>
      </section>

      {/* Sezione Filtri ed Opzioni Stato */}
      <div className="learning-controls">
        <div className="learning-controls__filters">
          <h3 className="learning-controls__section-title">Filtri Categoria e Marca</h3>
          <ProductFilters
            categories={allCategories}
            brands={allBrands}
            selectedCategories={selectedCategories}
            selectedBrands={selectedBrands}
            onCategoryChange={setSelectedCategories}
            onBrandChange={setSelectedBrands}
            onReset={handleResetFilters}
          />
        </div>

        <div className="learning-status-filters">
          <h3 className="learning-controls__section-title">Stato Apprendimento</h3>
          <div className="learning-status-filters__chips">
            <button
              className={`learning-status-chip learning-status-chip--new ${showNew ? 'active' : ''}`}
              onClick={() => setShowNew(!showNew)}
              type="button"
            >
              🆕 Nuovi ({products.length - progress.learned.length - progress.toReview.length})
            </button>
            <button
              className={`learning-status-chip learning-status-chip--learned ${showLearned ? 'active' : ''}`}
              onClick={() => setShowLearned(!showLearned)}
              type="button"
            >
              ✅ Imparati ({progress.learned.length})
            </button>
            <button
              className={`learning-status-chip learning-status-chip--review ${showToReview ? 'active' : ''}`}
              onClick={() => setShowToReview(!showToReview)}
              type="button"
            >
              🔄 Da ripassare ({progress.toReview.length})
            </button>
          </div>
        </div>
      </div>

      {/* Griglia delle Flashcards */}
      <section className="learning-grid-section" aria-label="Griglia flashcard">
        {filteredProducts.length === 0 ? (
          <EmptyState
            title="Nessun prodotto corrisponde ai filtri"
            description="Modifica la selezione delle categorie, delle marche o dello stato di apprendimento."
            action={
              <Button variant="secondary" onClick={handleResetFilters}>
                Ripristina filtri
              </Button>
            }
          />
        ) : (
          <div className="learning-grid">
            {filteredProducts.map((product) => {
              const isFlipped = !!flippedCards[product.id];
              const isLearned = progress.learned.includes(product.id);
              const isToReview = progress.toReview.includes(product.id);

              return (
                <div
                  key={product.id}
                  className={`flashcard-container ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => handleCardClick(product.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(product.id);
                    }
                  }}
                  aria-label={`Flashcard ${product.fullName}. Clicca per visualizzare i dettagli sul retro.`}
                >
                  <div className="flashcard">
                    {/* LATO FRONTE */}
                    <div className="flashcard__side flashcard__side--front">
                      <div className="flashcard__status-badges">
                        {isLearned && <Badge label="Imparato" variant="success" size="sm" />}
                        {isToReview && <Badge label="Da ripassare" variant="warning" size="sm" />}
                      </div>
                      <div className="flashcard__image-container">
                        <ProductImage product={product} size="md" />
                      </div>
                      <div className="flashcard__front-footer">
                        <span className="flashcard__brand">{product.brand}</span>
                        <h3 className="flashcard__name">{product.productName}</h3>
                        <Badge label="" variant="category" category={product.category} size="sm" />
                      </div>
                    </div>

                    {/* LATO RETRO */}
                    <div className="flashcard__side flashcard__side--back">
                      <div className="flashcard__back-header">
                        <span className="flashcard__brand">{product.brand}</span>
                        <h3 className="flashcard__name">{product.productName}</h3>
                        <Badge label="" variant="category" category={product.category} size="sm" />
                      </div>

                      <div className="flashcard__details">
                        <div className="flashcard__detail-item">
                          <span className="flashcard__detail-label">Nome Completo:</span>
                          <span className="flashcard__detail-value">{product.fullName}</span>
                        </div>
                        {product.subcategory && (
                          <div className="flashcard__detail-item">
                            <span className="flashcard__detail-label">Sottocategoria:</span>
                            <span className="flashcard__detail-value">{product.subcategory}</span>
                          </div>
                        )}
                        {product.variant && (
                          <div className="flashcard__detail-item">
                            <span className="flashcard__detail-label">Variante:</span>
                            <span className="flashcard__detail-value">{product.variant}</span>
                          </div>
                        )}
                        {product.flavor && (
                          <div className="flashcard__detail-item">
                            <span className="flashcard__detail-label">Aroma:</span>
                            <span className="flashcard__detail-value">{product.flavor}</span>
                          </div>
                        )}
                        {product.format && (
                          <div className="flashcard__detail-item">
                            <span className="flashcard__detail-label">Formato:</span>
                            <span className="flashcard__detail-value">{product.format}</span>
                          </div>
                        )}
                        {product.notes && (
                          <div className="flashcard__detail-item flashcard__detail-item--notes">
                            <span className="flashcard__detail-label">Note:</span>
                            <p className="flashcard__detail-value">{product.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Bottoni di Azione */}
                      <div className="flashcard__actions">
                        <Button
                          variant={isLearned ? 'success' : 'ghost'}
                          size="sm"
                          onClick={(e) => handleLearned(product.id, e)}
                          title={isLearned ? 'Rimuovi da imparati' : 'Segna come imparato'}
                          aria-label={isLearned ? 'Rimuovi da imparati' : 'Segna come imparato'}
                        >
                          {isLearned ? '✓ Imparato' : 'Imparato'}
                        </Button>
                        <Button
                          variant={isToReview ? 'danger' : 'ghost'}
                          size="sm"
                          onClick={(e) => handleToReview(product.id, e)}
                          title={isToReview ? 'Rimuovi da ripassare' : 'Segna da ripassare'}
                          aria-label={isToReview ? 'Rimuovi da ripassare' : 'Segna da ripassare'}
                        >
                          {isToReview ? '🔄 Da ripassare' : 'Ripassa'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default LearningPage;
