export type CategorySlug =
  | "suplementos"
  | "roupas"
  | "calcados"
  | "eletronicos"
  | "casa"
  | "beleza-e-saude"
  | "esportes";

export interface Category {
  slug: CategorySlug;
  name: string;
  subcategories: string[];
  image: string;
}

export interface Review {
  author: string;
  rating: number;
  date: string;
  text: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: CategorySlug;
  subcategory: string;
  description: string;
  price: number;
  salePrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  images: string[];
  variants: { label: string; options: string[] }[];
  colors?: string[];
  sizes?: string[];
  specs: Record<string, string>;
  tags: ("bestseller" | "new" | "deal")[];
  reviews: Review[];
  /** Origem: "own" (estoque próprio) ou id de um provedor parceiro */
  source: "own" | string;
}
