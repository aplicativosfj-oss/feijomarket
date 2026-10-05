import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, User } from "lucide-react";
import { STORE } from "@/config/store";
import { catalog, effectivePrice } from "@/services/catalog";
import { useShop } from "@/lib/shop";
import { formatBRL } from "@/lib/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function SearchBox({ onDone }: { onDone?: () => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const results = q.length >= 2 ? catalog.search(q, 6) : [];
  const suggestions = ["whey", "creatina", "tênis corrida", "fone bluetooth", "smartwatch"];

  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const go = (term: string) => {
    setOpen(false);
    onDone?.();
    navigate({ to: "/busca", search: { q: term } });
  };

  return (
    <div ref={ref} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) go(q.trim());
        }}
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar produtos, marcas..."
          aria-label="Buscar produtos"
          className="h-11 w-full rounded-full border border-input bg-secondary pl-11 pr-4 text-sm outline-none transition focus:border-accent focus:bg-background"
        />
      </form>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-card animate-fade-up">
          {results.length > 0 ? (
            <ul>
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/produto/$slug"
                    params={{ slug: p.slug }}
                    onClick={() => {
                      setOpen(false);
                      onDone?.();
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary"
                  >
                    <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <span className="flex-1 truncate text-sm">{p.name}</span>
                    <span className="text-sm font-semibold">{formatBRL(effectivePrice(p))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {q.length >= 2 ? "Nada encontrado. Experimente:" : "Buscas populares"}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => go(s)} className="rounded-full bg-secondary px-3 py-1 text-xs hover:bg-accent-soft">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const d = localStorage.getItem("franc-theme") === "dark";
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);
  return (
    <button
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={() => {
        const d = !dark;
        setDark(d);
        document.documentElement.classList.toggle("dark", d);
        localStorage.setItem("franc-theme", d ? "dark" : "light");
      }}
      className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export function SiteHeader() {
  const { count, setDrawerOpen, favorites } = useShop();
  const [menuOpen, setMenuOpen] = useState(false);
  const cats = catalog.categories();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="bg-surface-dark py-2 text-center text-xs font-medium text-surface-dark-foreground">
        Frete grátis acima de {formatBRL(STORE.freeShippingFrom)} · 5% off no Pix · Use <b className="text-accent">BEMVINDO10</b>
      </div>
      <div className="container-store flex h-16 items-center gap-3 md:h-20 md:gap-6">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button aria-label="Abrir menu" className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="font-display">{STORE.name}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4 px-4">
              <SearchBox onDone={() => setMenuOpen(false)} />
              <nav className="flex flex-col">
                {cats.map((c) => (
                  <Link
                    key={c.slug}
                    to="/categoria/$slug"
                    params={{ slug: c.slug }}
                    onClick={() => setMenuOpen(false)}
                    className="border-b border-border py-3 text-sm font-medium"
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        <Link to="/" className="font-display text-xl font-extrabold tracking-tight md:text-2xl" aria-label={`${STORE.name} — início`}>
          {STORE.name.split(" ")[0]}
          <span className="text-accent">.</span>
          <span className="font-medium text-muted-foreground">{STORE.name.split(" ").slice(1).join(" ")}</span>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Link to="/favoritos" aria-label={`Favoritos (${favorites.length})`} className="relative hidden h-10 w-10 place-items-center rounded-full hover:bg-secondary sm:grid">
            <Heart className="h-5 w-5" />
            {favorites.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-promo" />}
          </Link>
          <button aria-label="Minha conta (em breve)" className="hidden h-10 w-10 place-items-center rounded-full hover:bg-secondary sm:grid" title="Em breve">
            <User className="h-5 w-5" />
          </button>
          <button
            aria-label={`Abrir carrinho, ${count} itens`}
            onClick={() => setDrawerOpen(true)}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      <nav aria-label="Categorias" className="container-store hidden h-11 items-center gap-7 text-sm font-medium lg:flex">
        {cats.map((c) => (
          <Link
            key={c.slug}
            to="/categoria/$slug"
            params={{ slug: c.slug }}
            className="text-muted-foreground transition hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            {c.name}
          </Link>
        ))}
        <Link to="/busca" search={{ q: "", ofertas: true }} className="ml-auto font-semibold text-promo">
          Ofertas
        </Link>
      </nav>
    </header>
  );
}
