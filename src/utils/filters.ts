/**
 * Utilità per il filtraggio dei prodotti
 *
 * Contiene le funzioni per filtrare, cercare e ottenere
 * i valori disponibili per i filtri dell'interfaccia.
 */

import type { Product, ProductCategory, QuizFilters } from '../types/product';

/**
 * Filtra i prodotti in base ai filtri specificati.
 * I filtri sono tutti opzionali: se non specificati, non vengono applicati.
 *
 * @param products - Array completo di prodotti
 * @param filters - Filtri parziali da applicare
 * @returns Array filtrato di prodotti
 */
export function getFilteredProducts(
  products: Product[],
  filters: Partial<QuizFilters>
): Product[] {
  return products.filter((product) => {
    // Filtro per categorie (se specificato e non vuoto)
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(product.category)) {
        return false;
      }
    }

    // Filtro per brand (se specificato e non vuoto)
    if (filters.brands && filters.brands.length > 0) {
      if (!filters.brands.includes(product.brand)) {
        return false;
      }
    }

    // Filtro per tag (se specificato e non vuoto)
    // Il prodotto deve avere ALMENO uno dei tag specificati
    if (filters.tags && filters.tags.length > 0) {
      const productTags = product.tags ?? [];
      const hasMatchingTag = filters.tags.some((tag) => productTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Filtro per immagini: escludi placeholder se richiesto
    if (filters.onlyWithImages) {
      if (product.imageStatus !== 'available') {
        return false;
      }
    }

    // Includi placeholder solo se esplicitamente richiesto
    // (default: includi tutti se il campo non è specificato)
    if (filters.includeplaceholders === false) {
      if (product.imageStatus === 'placeholder') {
        return false;
      }
    }

    return true;
  });
}

/**
 * Restituisce tutti i brand unici presenti nell'array di prodotti,
 * ordinati alfabeticamente.
 */
export function getAvailableBrands(products: Product[]): string[] {
  const brands = new Set(products.map((p) => p.brand));
  return Array.from(brands).sort();
}

/**
 * Restituisce tutte le categorie effettivamente presenti nell'array di prodotti.
 */
export function getAvailableCategories(products: Product[]): ProductCategory[] {
  const categories = new Set(products.map((p) => p.category));
  return Array.from(categories) as ProductCategory[];
}

/**
 * Restituisce tutti i tag unici presenti nell'array di prodotti,
 * ordinati alfabeticamente.
 */
export function getAvailableTags(products: Product[]): string[] {
  const tags = new Set<string>();
  for (const product of products) {
    if (product.tags) {
      for (const tag of product.tags) {
        tags.add(tag);
      }
    }
  }
  return Array.from(tags).sort();
}

/**
 * Verifica se un prodotto corrisponde a una query di ricerca testuale.
 * La ricerca è case-insensitive e controlla:
 * - brand
 * - productName
 * - fullName
 * - aliases
 * - tags
 * - notes
 * - variant
 * - subcategory
 * - flavor
 *
 * @param product - Il prodotto da verificare
 * @param query - La stringa di ricerca
 * @returns true se il prodotto corrisponde alla query
 */
export function matchesSearch(product: Product, query: string): boolean {
  if (!query || query.trim().length === 0) {
    return true; // Nessuna query = tutti i risultati
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Campi in cui cercare
  const searchableFields: string[] = [
    product.brand,
    product.productName,
    product.fullName,
    product.variant ?? '',
    product.subcategory ?? '',
    product.flavor ?? '',
    product.notes ?? '',
    ...(product.aliases ?? []),
    ...(product.tags ?? []),
  ];

  // Controlla se almeno un campo contiene la query
  return searchableFields.some((field) =>
    field.toLowerCase().includes(normalizedQuery)
  );
}
