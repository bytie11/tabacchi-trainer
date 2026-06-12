import React from 'react';
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

  return (
    <div className="product-filters">
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
          <Button variant="ghost" size="sm" onClick={onReset}>
            Rimuovi filtri
          </Button>
        </div>
      )}
    </div>
  );
};
