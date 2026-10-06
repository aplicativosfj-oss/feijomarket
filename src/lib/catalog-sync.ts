/**
 * Carrega produtos e categorias do banco e atualiza o catálogo em memória.
 * Fotos vazias no banco usam a foto local do produto (ou da categoria) como reserva.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES as LOCAL_CATEGORIES, PRODUCTS as LOCAL_PRODUCTS } from "@/data/products";
import type { Category, Product } from "@/data/types";
import { setCatalogData } from "@/services/catalog";

const localById = new Map(LOCAL_PRODUCTS.map((p) => [p.id, p]));
const localCatImg = new Map(LOCAL_CATEGORIES.map((c) => [c.slug, c.image]));
const FALLBACK_IMG = LOCAL_CATEGORIES[0]?.image ?? "";
const TAGS = new Set(["bestseller", "new", "deal"]);

type Json = unknown;
const asVariants = (v: Json): Product["variants"] =>
  Array.isArray(v)
    ? v.filter((x): x is { label: string; options: string[] } =>
        !!x && typeof x === "object" && typeof (x as { label?: unknown }).label === "string" && Array.isArray((x as { options?: unknown }).options))
    : [];
const asSpecs = (v: Json): Record<string, string> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, String(val)]))
    : {};

export async function fetchCatalog(): Promise<{ products: Product[]; categories: Category[] }> {
  const [prodRes, catRes] = await Promise.all([
    supabase.from("products").select("*").order("id"),
    supabase.from("categories").select("*").order("sort_order"),
  ]);
  if (prodRes.error) throw prodRes.error;
  if (catRes.error) throw catRes.error;

  const categories: Category[] = (catRes.data ?? []).map((c) => ({
    slug: c.slug,
    name: c.name,
    subcategories: c.subcategories ?? [],
    image: c.image_url || localCatImg.get(c.slug) || FALLBACK_IMG,
  }));
  const catImg = new Map(categories.map((c) => [c.slug, c.image]));

  const products: Product[] = (prodRes.data ?? []).map((r) => {
    const local = localById.get(r.id);
    const images = r.image_url
      ? [r.image_url]
      : local?.images ?? [catImg.get(r.category) ?? FALLBACK_IMG];
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      brand: r.brand,
      category: r.category,
      subcategory: r.subcategory,
      description: r.description,
      price: Number(r.price),
      salePrice: r.sale_price != null && Number(r.sale_price) > 0 ? Number(r.sale_price) : undefined,
      stock: r.stock,
      rating: Number(r.rating),
      reviewCount: r.review_count,
      images,
      variants: asVariants(r.variants),
      colors: r.colors ?? undefined,
      sizes: r.sizes ?? undefined,
      specs: asSpecs(r.specs),
      tags: (r.tags ?? []).filter((t): t is Product["tags"][number] => TAGS.has(t)),
      reviews: local?.reviews ?? [],
      source: r.source,
    };
  });
  return { products, categories };
}

/** Usado na raiz do app: devolve um número que muda quando o catálogo do banco chega. */
export function useCatalogSync(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    fetchCatalog()
      .then((data) => {
        if (!active || data.products.length === 0) return;
        setCatalogData(data);
        setVersion((v) => v + 1);
      })
      .catch((err: unknown) => console.error("Falha ao carregar catálogo do banco", err));
    return () => {
      active = false;
    };
  }, []);
  return version;
}
