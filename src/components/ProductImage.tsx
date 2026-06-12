import React, { useState, useEffect } from 'react';
import type { Product } from '../types/product';
import { PlaceholderProductImage } from './PlaceholderProductImage';
import './ProductImage.css';

interface ProductImageProps {
  product: Product;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'quiz';
}

/**
 * Mostra l'immagine del prodotto se disponibile, altrimenti un placeholder grafico.
 * Gestisce errori di caricamento immagine con fallback al placeholder.
 * Supporta la variante "quiz" per mostrare l'immagine oscurata (con fallback alla normale).
 */
export const ProductImage: React.FC<ProductImageProps> = ({
  product,
  className = '',
  size = 'md',
  variant = 'default',
}) => {
  const getBaseUrl = (pathUrl: string) => {
    if (!pathUrl) return '';
    if (pathUrl.startsWith('http://') || pathUrl.startsWith('https://')) return pathUrl;
    const base = import.meta.env.BASE_URL || '/';
    const cleanPath = pathUrl.replace(/^\/+/, '');
    return `${base}${cleanPath}`;
  };

  const getInitialSrc = () => {
    const raw = variant === 'quiz' && product.quizImageUrl ? product.quizImageUrl : product.imageUrl;
    return getBaseUrl(raw);
  };

  const [imgSrc, setImgSrc] = useState(getInitialSrc);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(getInitialSrc());
    setFallbackAttempted(false);
    setHasError(false);
  }, [product.id, variant]);

  const handleImageError = () => {
    const quizUrl = product.quizImageUrl ? getBaseUrl(product.quizImageUrl) : '';
    if (variant === 'quiz' && quizUrl && imgSrc === quizUrl && !fallbackAttempted) {
      console.warn(`[ProductImage] Errore caricamento quizImageUrl per ${product.id}, provo imageUrl originale: ${product.imageUrl}`);
      setImgSrc(getBaseUrl(product.imageUrl));
      setFallbackAttempted(true);
    } else {
      setHasError(true);
    }
  };

  const isPlaceholder = product.imageStatus === 'placeholder' || hasError;

  if (isPlaceholder) {
    return (
      <PlaceholderProductImage
        brand={product.brand}
        productName={product.productName}
        category={product.category}
        className={`product-image product-image--${size} ${className}`}
      />
    );
  }

  return (
    <div className={`product-image product-image--${size} ${variant === 'quiz' ? 'product-image--quiz' : ''} ${className}`}>
      <img
        src={imgSrc}
        alt={`Pacchetto ${product.fullName}`}
        className="product-image__img"
        onError={handleImageError}
        loading={variant === 'quiz' ? 'eager' : 'lazy'}
      />
      {product.imageStatus === 'needs_review' && (
        <span className="product-image__review-badge" title="Immagine da verificare">
          ⚠️
        </span>
      )}
    </div>
  );
};
