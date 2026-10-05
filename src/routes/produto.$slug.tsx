import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Share2, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { catalog, discountPct, effectivePrice } from "@/services/catalog";
import { useShop } from "@/lib/shop";
import { PriceBlock, ShippingCalc, Stars } from "@/components/store/bits";
import { ProductGrid } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STORE } from "@/config/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produto/$slug")({
  loader: ({ params }) => {
    const product = catalog.bySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: `Produto não encontrado — ${STORE.name}` }, { name: "robots", content: "noindex" }] };
    const p = loaderData.product;
    const t = `${p.name} — ${STORE.name}`;
    const d = p.description.slice(0, 155);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.description,
      sku: p.id,
      brand: { "@type": "Brand", name: p.brand },
      aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount },
      offers: {
        "@type": "Offer",
        priceCurrency: "BRL",
        price: effectivePrice(p).toFixed(2),
        availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    };
    return {
      meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "product" }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
  component: ProductPage,
});

function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      <div className="flex gap-2 md:flex-col">
        {images.map((src, i) => (
          <button key={i} onClick={() => setActive(i)} aria-label={`Ver imagem ${i + 1}`} className={cn("h-16 w-16 overflow-hidden rounded-xl border-2 md:h-20 md:w-20", i === active ? "border-accent" : "border-transparent")}>
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <div
        className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-3xl bg-secondary"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <img
          src={images[active]}
          alt={alt}
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-200"
          style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
      </div>
    </div>
  );
}

function ProductPage() {
  const { product: p } = Route.useLoaderData();
  const { add, favorites, toggleFavorite } = useShop();
  const navigate = useNavigate();
  const [opts, setOpts] = useState<Record<string, string>>(() => Object.fromEntries(p.variants.map((v) => [v.label, v.options[0]])));
  const [qty, setQty] = useState(1);
  const fav = favorites.includes(p.id);
  const cat = catalog.category(p.category)!;
  const out = p.stock <= 0;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: p.name, url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  return (
    <div className="container-store py-8">
      <nav aria-label="Trilha" className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link> /{" "}
        <Link to="/categoria/$slug" params={{ slug: cat.slug }} className="hover:text-foreground">{cat.name}</Link> /{" "}
        <span className="text-foreground">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <Gallery key={p.id} images={p.images} alt={p.name} />

        <div className="space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.brand}</div>
            <h1 className="mt-1 text-3xl font-bold md:text-4xl">{p.name}</h1>
            <div className="mt-3 flex items-center gap-3">
              <Stars rating={p.rating} count={p.reviewCount} />
              {discountPct(p) > 0 && <span className="rounded-full bg-promo px-2.5 py-0.5 text-xs font-bold text-promo-foreground">-{discountPct(p)}%</span>}
            </div>
          </div>

          <PriceBlock price={p.price} salePrice={p.salePrice} large />

          {p.variants.map((v) => (
            <div key={v.label}>
              <div className="mb-2 text-sm font-semibold">{v.label}: <span className="font-normal text-muted-foreground">{opts[v.label]}</span></div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={v.label}>
                {v.options.map((o) => (
                  <button key={o} role="radio" aria-checked={opts[v.label] === o} onClick={() => setOpts({ ...opts, [v.label]: o })}
                    className={cn("h-10 min-w-10 rounded-xl border px-3 text-sm transition", opts[v.label] === o ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground")}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="text-sm">
            {out ? <span className="font-semibold text-destructive">Produto esgotado</span>
              : p.stock < 20 ? <span className="font-semibold text-promo">Restam apenas {p.stock} unidades!</span>
              : <span className="font-semibold text-accent">Em estoque</span>}
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center rounded-full border border-border">
              <button aria-label="Diminuir" onClick={() => setQty(Math.max(1, qty - 1))} className="h-12 w-11">−</button>
              <span className="w-8 text-center tabular-nums">{qty}</span>
              <button aria-label="Aumentar" onClick={() => setQty(Math.min(p.stock || 1, qty + 1))} className="h-12 w-11">+</button>
            </div>
            <Button size="lg" variant="accent" disabled={out} className="flex-1" onClick={() => { add(p, opts, qty); navigate({ to: "/checkout" }); }}>Comprar</Button>
            <Button size="lg" variant="outline" disabled={out} className="flex-1" onClick={() => add(p, opts, qty)}>Adicionar ao carrinho</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => toggleFavorite(p.id)} aria-pressed={fav}><Heart className={cn(fav && "fill-promo text-promo")} /> {fav ? "Favoritado" : "Favoritar"}</Button>
            <Button variant="ghost" size="sm" onClick={share}><Share2 /> Compartilhar</Button>
          </div>

          <div className="rounded-2xl border border-border p-5"><ShippingCalc subtotal={effectivePrice(p) * qty} /></div>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Compra segura</span>
            <span className="flex items-center gap-1.5"><Truck className="h-4 w-4" /> Envio para todo o Brasil</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="desc" className="mt-16">
        <TabsList>
          <TabsTrigger value="desc">Descrição</TabsTrigger>
          <TabsTrigger value="specs">Ficha técnica</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações ({p.reviewCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="desc" className="max-w-3xl pt-4 leading-relaxed text-muted-foreground">{p.description}</TabsContent>
        <TabsContent value="specs" className="max-w-xl pt-4">
          <dl className="divide-y divide-border rounded-2xl border border-border">
            {Object.entries(p.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-3 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        </TabsContent>
        <TabsContent value="reviews" className="max-w-3xl space-y-4 pt-4">
          <div className="flex items-center gap-4"><span className="font-display text-5xl font-bold">{p.rating.toFixed(1)}</span><Stars rating={p.rating} count={p.reviewCount} size={18} /></div>
          {p.reviews.map((r, i) => (
            <div key={i} className="rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between"><span className="font-semibold">{r.author}</span><Stars rating={r.rating} size={12} /></div>
              <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <section className="mt-20">
        <h2 className="mb-8 text-2xl font-bold">Você também pode gostar</h2>
        <ProductGrid products={catalog.related(p)} />
      </section>
    </div>
  );
}
