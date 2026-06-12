import React, { useState } from 'react';
import { CATEGORY_LABELS } from '../types/product';
import type { ProductCategory } from '../types/product';
import { Button } from './Button';
import './ProductFilters.css';

interface ProductFiltersProps {
  categories: ProductCategory[];
  brands: string[];
  selectedCategories: ProductCategory[];
  selectedBrands: string[];
  onCategoryChange: (categories: ProductCategory[]) => void;
  onBrandChange: (brands: string[]) => void;
  onReset: () => void;
  showImageFilter?: boolean;
  onlyWithImages?: boolean;
  onImageFilterChange?: (v: boolean) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  brands,
  selectedCategories,
  selectedBrands,
  onCategoryChange,
  onBrandChange,
  onReset,
  showImageFilter = false,
  onlyWithImages = false,
  onImageFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCategory = (cat: ProductCategory) => {
    if (selectedCategories.includes(cat)) {
      onCategoryChange(selectedCategories.filter((c) => c !== cat));
    } else {
      onCategoryChange([...selectedCategories, cat]);
    }
  };

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandChange(selectedBrands.filter((b) => b !== brand));
    } else {
      onBrandChange([...selectedBrands, brand]);
    }
  };

  const hasFilters = selectedCategories.length > 0 || selectedBrands.length > 0 || onlyWithImages;
  const activeFiltersCount = selectedCategories.length + selectedBrands.length + (onlyWithImages ? 1 : 0);

  return (
    <div className="product-filters">
      {/* Mobile Collapse Toggle Button */}
      <button
        type="button"
        className={`product-filters__mobile-toggle ${isOpen ? 'is-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="product-filters__mobile-toggle-text">
          🔍 Filtri attivi: <strong>{activeFiltersCount}</strong>
        </span>
        <span className="product-filters__mobile-toggle-icon">
          {isOpen ? '▲ Chiudi' : '▼ Espandi'}
        </span>
      </button>

      {/* Filters Content Area */}
      <div className={`product-filters__content ${isOpen ? 'is-open' : ''}`}>
        <div className="product-filters__section">
          <h4 className="product-filters__title">Categoria</h4>
          <div className="product-filters__chips">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`product-filters__chip ${selectedCategories.includes(cat) ? 'product-filters__chip--active' : ''}`}
                onClick={() => toggleCategory(cat)}
                type="button"
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="product-filters__section">
          <h4 className="product-filters__title">Marca</h4>
          <div className="product-filters__chips">
            {brands.map((brand) => (
              <button
                key={brand}
                className={`product-filters__chip ${selectedBrands.includes(brand) ? 'product-filters__chip--active' : ''}`}
                onClick={() => toggleBrand(brand)}
                type="button"
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {showImageFilter && onImageFilterChange && (
          <div className="product-filters__section">
            <label className="product-filters__toggle">
              <input
                type="checkbox"
                checked={onlyWithImages}
                onChange={(e) => onImageFilterChange(e.target.checked)}
              />
              <span>Solo prodotti con immagine</span>
            </label>
          </div>
        )}

        {hasFilters && (
          <div className="product-filters__actions">
            <Button variant="ghost" size="sm" onClick={onReset} className="product-filters__reset-btn">
              Rimuovi filtri
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

