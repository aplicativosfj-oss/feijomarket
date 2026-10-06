/**
 * Camada de dados do catálogo.
 * Começa com os dados locais (usados na renderização no servidor e como fotos de reserva)
 * e é substituída pelos dados do banco assim que `setCatalogData` é chamado (ver catalog-sync).
 * A interface síncrona é mantida para não alterar os componentes da vitrine.
 */
import { CATEGORIES as LOCAL_CATEGORIES, PRODUCTS as LOCAL_PRODUCTS } from "@/data/products";
import type { Category, Product } from "@/data/types";

let products: Product[] = LOCAL_PRODUCTS;
let categories: Category[] = LOCAL_CATEGORIES;
let brands: string[] = computeBrands(products);

function computeBrands(list: Product[]): string[] {
  return Array.from(new Set(list.map((p) => p.brand))).sort();
}

/** Substitui o catálogo em memória pelos dados vindos do banco. */
export function setCatalogData(next: { products: Product[]; categories: Category[] }): void {
  products = next.products;
  categories = next.categories;
  brands = computeBrands(products);
}

export const effectivePrice = (p: Product) => p.salePrice ?? p.price;
export const discountPct = (p: Product) => (p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0);

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const catalog = {
  categories: () => categories,
  category: (slug: string) => categories.find((c) => c.slug === slug),
  brands: () => brands,
  all: () => products,
  bySlug: (slug: string) => products.find((p) => p.slug === slug),
  byTag: (tag: Product["tags"][number], limit = 8) => products.filter((p) => p.tags.includes(tag)).slice(0, limit),
  related: (p: Product, limit = 4) => products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, limit),
  search: (q: string, limit = 50) => {
    const n = normalize(q.trim());
    if (!n) return [];
    return products
      .filter((p) => normalize(`${p.name} ${p.brand} ${p.subcategory} ${p.category}`).includes(n))
      .slice(0, limit);
  },
};

export interface CatalogFilters {
  minPrice?: number;
  maxPrice?: number;
  brands: string[];
  minRating: number;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  sub?: string;
}

export type SortKey = "relevance" | "price-asc" | "price-desc" | "rating" | "discount";

export function applyFilters(list: Product[], f: CatalogFilters, sort: SortKey) {
  const out = list.filter((p) => {
    const price = effectivePrice(p);
    if (f.minPrice != null && price < f.minPrice) return false;
    if (f.maxPrice != null && price > f.maxPrice) return false;
    if (f.brands.length && !f.brands.includes(p.brand)) return false;
    if (p.rating < f.minRating) return false;
    if (f.sizes.length && !p.sizes?.some((s) => f.sizes.includes(s))) return false;
    if (f.colors.length && !p.colors?.some((c) => f.colors.includes(c))) return false;
    if (f.inStock && p.stock <= 0) return false;
    if (f.sub && p.subcategory !== f.sub) return false;
    return true;
  });
  const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
    relevance: (a, b) => b.reviewCount - a.reviewCount,
    "price-asc": (a, b) => effectivePrice(a) - effectivePrice(b),
    "price-desc": (a, b) => effectivePrice(b) - effectivePrice(a),
    rating: (a, b) => b.rating - a.rating,
    discount: (a, b) => discountPct(b) - discountPct(a),
  };
  return out.sort(sorters[sort]);
}
