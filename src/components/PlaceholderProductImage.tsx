import React from 'react';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../types/product';
import type { ProductCategory } from '../types/product';
import './PlaceholderProductImage.css';

interface PlaceholderProductImageProps {
  brand: string;
  productName: string;
  category: ProductCategory;
  className?: string;
}

/**
 * Genera un placeholder visivo gradevole quando manca l'immagine del prodotto.
 * Mostra brand, nome, categoria e una nota che indica la necessità di aggiungere la foto.
 */
export const PlaceholderProductImage: React.FC<PlaceholderProductImageProps> = ({
  brand,
  productName,
  category,
  className = '',
}) => {
  const icon = CATEGORY_ICONS[category] || '📦';
  const label = CATEGORY_LABELS[category] || category;

  return (
    <div
      className={`placeholder-image ${className}`}
      role="img"
      aria-label={`Placeholder per ${brand} ${productName}`}
    >
      <div className="placeholder-image__pattern" />
      <div className="placeholder-image__content">
        <span className="placeholder-image__icon">{icon}</span>
        <span className="placeholder-image__brand">{brand}</span>
        <span className="placeholder-image__name">{productName}</span>
        <span className="placeholder-image__category">{label}</span>
        <span className="placeholder-image__note">📷 foto da inserire</span>
      </div>
    </div>
  );
};
