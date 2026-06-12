import React from 'react';
import { CATEGORY_LABELS } from '../types/product';
import type { ProductCategory } from '../types/product';
import './Badge.css';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'category' | 'brand' | 'status' | 'success' | 'error' | 'warning';
  category?: ProductCategory;
  size?: 'sm' | 'md';
}

const CATEGORY_COLOR_MAP: Record<ProductCategory, string> = {
  sigarette: 'var(--color-cat-sigarette)',
  prodotti_senza_combustione: 'var(--color-cat-senza-combustione)',
  trinciato: 'var(--color-cat-trinciato)',
  sigari: 'var(--color-cat-sigari)',
  sigaretti: 'var(--color-cat-sigaretti)',
  cartine: 'var(--color-cat-cartine)',
  filtri: 'var(--color-cat-filtri)',
  accessori: 'var(--color-cat-accessori)',
  altro: 'var(--color-cat-altro)',
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', category, size = 'md' }) => {
  const style: React.CSSProperties = {};

  if (variant === 'category' && category) {
    const color = CATEGORY_COLOR_MAP[category];
    style.backgroundColor = `color-mix(in srgb, ${color} 15%, transparent)`;
    style.color = color;
    style.borderColor = `color-mix(in srgb, ${color} 30%, transparent)`;
  }

  return (
    <span
      className={`badge badge--${variant} badge--${size}`}
      style={style}
    >
      {variant === 'category' && category ? CATEGORY_LABELS[category] : label}
    </span>
  );
};
