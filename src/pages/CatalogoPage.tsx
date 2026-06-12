import React, { useState, useMemo } from 'react';
import { products, getAllBrands, getAllCategories } from '../data/products';
import { getFilteredProducts, matchesSearch } from '../utils/filters';
import { SearchInput } from '../components/SearchInput';
import { ProductFilters } from '../components/ProductFilters';
import { ProductImage } from '../components/ProductImage';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import type { ProductCategory } from '../types/product';
import './CatalogoPage.css';

export const CatalogoPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const allCategories = useMemo(() => getAllCategories(), []);
  const allBrands = useMemo(() => getAllBrands(), []);

  const filteredProducts = useMemo(() => {
    // 1. Applica i filtri strutturati (brand, categoria, solo con immagini)
    const filtered = getFilteredProducts(products, {
      categories: selectedCategories,
      brands: selectedBrands,
      onlyWithImages: onlyWithImages,
    });

    // 2. Applica la ricerca testuale
    if (!searchQuery) return filtered;
    return filtered.filter((p) => matchesSearch(p, searchQuery));
  }, [searchQuery, selectedCategories, selectedBrands, onlyWithImages]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setOnlyWithImages(false);
  };

  return (
    <div className="catalogo-page">
      <header className="catalogo-header">
        <h1 className="catalogo-page__title">Catalogo Prodotti</h1>
        <p className="catalogo-page__subtitle">
          Consulta e ricerca tutti i prodotti nel database
        </p>
      </header>

      {/* Sezione di Ricerca e Controlli Vista */}
      <div className="catalogo-controls">
        <div className="catalogo-controls__search">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cerca per marca, nome, tag, note..."
            id="catalogo-search"
          />
        </div>
        <div className="catalogo-controls__view-toggle" role="group" aria-label="Visualizzazione">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            title="Vista Griglia"
            aria-label="Vista Griglia"
          >
            🖼️ Griglia
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            title="Vista Lista"
            aria-label="Vista Lista"
          >
            📄 Lista
          </Button>
        </div>
      </div>

      {/* Griglia Layout Principale: Filtri a sinistra (desktop) + Prodotti a destra */}
      <div className="catalogo-layout">
        <aside className="catalogo-layout__sidebar">
          <div className="catalogo-sidebar-box">
            <h3 className="catalogo-sidebar-box__title">Filtri</h3>
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
        </aside>

        <section className="catalogo-layout__content" aria-label="Elenco prodotti">
          <div className="catalogo-results-info">
            <span className="catalogo-results-info__count">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'prodotto trovato' : 'prodotti trovati'}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState
              title="Nessun prodotto corrisponde ai filtri"
              description="Prova a modificare la ricerca o i filtri selezionati per trovare quello che cerchi."
              action={
                <Button variant="secondary" onClick={handleResetFilters}>
                  Ripristina tutti i filtri
                </Button>
              }
            />
          ) : viewMode === 'grid' ? (
            <div className="catalogo-grid">
              {filteredProducts.map((product) => (
                <article key={product.id} className="catalogo-card">
                  <div className="catalogo-card__image-wrapper">
                    <ProductImage product={product} size="md" />
                  </div>
                  <div className="catalogo-card__info">
                    <span className="catalogo-card__brand">{product.brand}</span>
                    <h3 className="catalogo-card__title">{product.productName}</h3>
                    <div className="catalogo-card__badges">
                      <Badge label="" variant="category" category={product.category} size="sm" />
                      {product.variant && (
                        <Badge label={product.variant} variant="default" size="sm" />
                      )}
                    </div>
                    {/* Stato Foto */}
                    <div className="catalogo-card__photo-status" style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
                      {product.imageStatus === 'available' ? (
                        <Badge label="Foto disponibile" variant="success" size="sm" />
                      ) : product.imageStatus === 'needs_review' ? (
                        <Badge label="Da verificare" variant="error" size="sm" />
                      ) : (
                        <Badge label="Foto da inserire" variant="warning" size="sm" />
                      )}
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px', wordBreak: 'break-all' }}>
                        {product.imageStatus === 'available' ? product.imageUrl : `Atteso: ${product.id}.webp`}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="catalogo-list-wrapper">
              <table className="catalogo-list catalogo-list-table">
                <thead>
                  <tr>
                    <th scope="col" className="col-image">Foto</th>
                    <th scope="col" className="col-name">Prodotto</th>
                    <th scope="col" className="col-brand">Marca</th>
                    <th scope="col" className="col-category">Categoria</th>
                    <th scope="col" className="col-variant">Variante/Formato</th>
                    <th scope="col" className="col-status">Stato Foto</th>
                    <th scope="col" className="col-notes">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="col-image">
                        <ProductImage product={product} size="sm" />
                      </td>
                      <td className="col-name">
                        <div className="col-name__title">{product.productName}</div>
                        <div className="col-name__fullname">{product.fullName}</div>
                      </td>
                      <td className="col-brand">{product.brand}</td>
                      <td className="col-category">
                        <Badge label="" variant="category" category={product.category} size="sm" />
                      </td>
                      <td className="col-variant">
                        <div className="col-variant__details">
                          {product.variant && <span>Variante: {product.variant}</span>}
                          {product.format && <span>Formato: {product.format}</span>}
                          {product.flavor && <span>Aroma: {product.flavor}</span>}
                        </div>
                      </td>
                      <td className="col-status">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {product.imageStatus === 'available' ? (
                            <Badge label="Foto disponibile" variant="success" size="sm" />
                          ) : product.imageStatus === 'needs_review' ? (
                            <Badge label="Da verificare" variant="error" size="sm" />
                          ) : (
                            <Badge label="Foto da inserire" variant="warning" size="sm" />
                          )}
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                            {product.imageStatus === 'available' ? product.imageUrl : `${product.id}.webp`}
                          </span>
                        </div>
                      </td>
                      <td className="col-notes">
                        <span className="col-notes__text" title={product.notes}>
                          {product.notes || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="catalogo-list-mobile">
                {filteredProducts.map((product) => (
                  <div className="catalogo-mobile-row" key={product.id}>
                    <div className="catalogo-mobile-row__image">
                      <ProductImage product={product} size="sm" />
                    </div>
                    <div className="catalogo-mobile-row__details">
                      <div className="catalogo-mobile-row__header">
                        <span className="catalogo-mobile-row__brand">{product.brand}</span>
                        {product.imageStatus === 'available' ? (
                          <Badge label="Disponibile" variant="success" size="sm" />
                        ) : product.imageStatus === 'needs_review' ? (
                          <Badge label="Verifica" variant="error" size="sm" />
                        ) : (
                          <Badge label="Mancante" variant="warning" size="sm" />
                        )}
                      </div>
                      <h4 className="catalogo-mobile-row__title">{product.productName}</h4>
                      <div className="catalogo-mobile-row__footer">
                        <Badge label="" variant="category" category={product.category} size="sm" />
                        {product.variant && (
                          <span className="catalogo-mobile-row__variant">{product.variant}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CatalogoPage;
