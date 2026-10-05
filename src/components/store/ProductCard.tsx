import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/data/types";
import { discountPct } from "@/services/catalog";
import { useShop } from "@/lib/shop";
import { PriceBlock, Stars } from "./bits";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { add, favorites, toggleFavorite } = useShop();
  const fav = favorites.includes(product.id);
  const off = discountPct(product);
  const out = product.stock <= 0;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-card">
      <Link to="/produto/$slug" params={{ slug: product.slug }} className="relative block aspect-square overflow-hidden bg-secondary">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          width={600}
          height={600}
          className={cn("h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", out && "opacity-50 grayscale")}
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {off > 0 && <span className="rounded-full bg-promo px-2.5 py-1 text-xs font-bold text-promo-foreground">-{off}%</span>}
          {product.tags.includes("new") && <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">Novo</span>}
          {out && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">Esgotado</span>}
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleFavorite(product.id)}
        aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        aria-pressed={fav}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 backdrop-blur transition hover:scale-110"
      >
        <Heart className={cn("h-4 w-4", fav && "fill-promo text-promo")} />
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.brand}</span>
        <Link to="/produto/$slug" params={{ slug: product.slug }} className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 hover:text-accent">
          {product.name}
        </Link>
        <Stars rating={product.rating} count={product.reviewCount} size={12} />
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <PriceBlock price={product.price} salePrice={product.salePrice} />
          <button
            type="button"
            disabled={out}
            onClick={() => add(product, Object.fromEntries(product.variants.map((v) => [v.label, v.options[0]])))}
            aria-label={`Adicionar ${product.name} ao carrinho`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
