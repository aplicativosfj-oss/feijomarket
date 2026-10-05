/**
 * Camada de dados do catálogo. Hoje lê dados mock locais; para migrar ao banco,
 * substitua o corpo destas funções por consultas — a interface permanece igual.
 */
import { CATEGORIES, PRODUCTS, BRANDS } from "@/data/products";
import type { Product } from "@/data/types";

export const effectivePrice = (p: Product) => p.salePrice ?? p.price;
export const discountPct = (p: Product) => (p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0);

export const catalog = {
  categories: () => CATEGORIES,
  category: (slug: string) => CATEGORIES.find((c) => c.slug === slug),
  brands: () => BRANDS,
  all: () => PRODUCTS,
  bySlug: (slug: string) => PRODUCTS.find((p) => p.slug === slug),
  byTag: (tag: Product["tags"][number], limit = 8) => PRODUCTS.filter((p) => p.tags.includes(tag)).slice(0, limit),
  related: (p: Product, limit = 4) =>
    PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, limit),
  search: (q: string, limit = 50) => {
    const n = q.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!n) return [];
    return PRODUCTS.filter((p) =>
      `${p.name} ${p.brand} ${p.subcategory} ${p.category}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(n),
    ).slice(0, limit);
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
