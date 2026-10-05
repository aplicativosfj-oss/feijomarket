import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/data/types";
import { applyFilters, type CatalogFilters, type SortKey } from "@/services/catalog";
import { ProductCardSkeleton, ProductGrid } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stars } from "./bits";
import { cn } from "@/lib/utils";

const PAGE = 12;
const EMPTY: CatalogFilters = { brands: [], minRating: 0, sizes: [], colors: [], inStock: false };
const PRICE_RANGES = [
  { label: "Até R$ 100", min: 0, max: 100 },
  { label: "R$ 100 a R$ 300", min: 100, max: 300 },
  { label: "R$ 300 a R$ 1.000", min: 300, max: 1000 },
  { label: "Acima de R$ 1.000", min: 1000, max: undefined },
];

function toggle<T>(arr: T[], v: T) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function FilterPanel({ products, f, setF, subs }: { products: Product[]; f: CatalogFilters; setF: (f: CatalogFilters) => void; subs?: string[] }) {
  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
  const sizes = Array.from(new Set(products.flatMap((p) => p.sizes ?? [])));
  const colors = Array.from(new Set(products.flatMap((p) => p.colors ?? [])));
  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <fieldset className="space-y-2.5 border-b border-border pb-5">
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
  const Check = ({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) => (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      {children}
    </label>
  );
  return (
    <div className="space-y-5">
      {subs && subs.length > 0 && (
        <Group title="Subcategoria">
          <div className="flex flex-wrap gap-2">
            {subs.map((s) => (
              <button
                key={s}
                onClick={() => setF({ ...f, sub: f.sub === s ? undefined : s })}
                className={cn("rounded-full border px-3 py-1 text-xs", f.sub === s ? "border-accent bg-accent text-accent-foreground" : "border-border")}
              >
                {s}
              </button>
            ))}
          </div>
        </Group>
      )}
      <Group title="Preço">
        {PRICE_RANGES.map((r) => {
          const on = f.minPrice === r.min && f.maxPrice === r.max;
          return (
            <Check key={r.label} checked={on} onChange={() => setF({ ...f, minPrice: on ? undefined : r.min, maxPrice: on ? undefined : r.max })}>
              {r.label}
            </Check>
          );
        })}
      </Group>
      {brands.length > 1 && (
        <Group title="Marca">
          {brands.map((b) => (
            <Check key={b} checked={f.brands.includes(b)} onChange={() => setF({ ...f, brands: toggle(f.brands, b) })}>{b}</Check>
          ))}
        </Group>
      )}
      <Group title="Avaliação">
        {[4.5, 4, 0].map((r) => (
          <Check key={r} checked={f.minRating === r} onChange={() => setF({ ...f, minRating: r })}>
            {r === 0 ? "Todas" : <span className="flex items-center gap-1"><Stars rating={r} size={12} /> ou mais</span>}
          </Check>
        ))}
      </Group>
      {sizes.length > 0 && (
        <Group title="Tamanho">
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button key={s} onClick={() => setF({ ...f, sizes: toggle(f.sizes, s) })} className={cn("h-9 min-w-9 rounded-lg border px-2 text-xs", f.sizes.includes(s) ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {s}
              </button>
            ))}
          </div>
        </Group>
      )}
      {colors.length > 0 && (
        <Group title="Cor">
          {colors.map((c) => (
            <Check key={c} checked={f.colors.includes(c)} onChange={() => setF({ ...f, colors: toggle(f.colors, c) })}>{c}</Check>
          ))}
        </Group>
      )}
      <Group title="Disponibilidade">
        <Check checked={f.inStock} onChange={() => setF({ ...f, inStock: !f.inStock })}>Somente em estoque</Check>
      </Group>
      <Button variant="ghost" size="sm" onClick={() => setF(EMPTY)}><X /> Limpar filtros</Button>
    </div>
  );
}

export function Catalog({ products, subs }: { products: Product[]; subs?: string[] }) {
  const [f, setF] = useState<CatalogFilters>(EMPTY);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [visible, setVisible] = useState(PAGE);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => setVisible(PAGE), [f, sort, products]);
  const list = useMemo(() => applyFilters([...products], f, sort), [products, f, sort]);

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block" aria-label="Filtros">
        <FilterPanel products={products} f={f} setF={setF} subs={subs} />
      </aside>
      <div>
        <div className="mb-5 flex items-center justify-between gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden"><SlidersHorizontal /> Filtros</Button>
            </SheetTrigger>
            <SheetContent side="left" className="overflow-y-auto">
              <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
              <div className="px-4 pb-6"><FilterPanel products={products} f={f} setF={setF} subs={subs} /></div>
            </SheetContent>
          </Sheet>
          <p className="hidden text-sm text-muted-foreground lg:block">{list.length} produtos</p>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-52 rounded-full" aria-label="Ordenar por"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Mais relevantes</SelectItem>
              <SelectItem value="price-asc">Menor preço</SelectItem>
              <SelectItem value="price-desc">Maior preço</SelectItem>
              <SelectItem value="rating">Melhor avaliados</SelectItem>
              <SelectItem value="discount">Maior desconto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!ready ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="font-semibold">Nenhum produto encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">Tente remover alguns filtros.</p>
          </div>
        ) : (
          <>
            <ProductGrid products={list.slice(0, visible)} />
            {visible < list.length && (
              <div className="mt-10 text-center">
                <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + PAGE)}>
                  Carregar mais ({list.length - visible} restantes)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
