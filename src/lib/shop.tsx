import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { COUPONS } from "@/config/store";
import { PRODUCTS } from "@/data/products";
import { effectivePrice } from "@/services/catalog";
import type { Product } from "@/data/types";

export interface CartLine {
  key: string;
  productId: string;
  qty: number;
  options: Record<string, string>;
}

interface ShopState {
  lines: (CartLine & { product: Product })[];
  count: number;
  subtotal: number;
  discount: number;
  coupon: string | null;
  freeShippingCoupon: boolean;
  add: (p: Product, options?: Record<string, string>, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

const Ctx = createContext<ShopState | null>(null);
const KEY = "franc-shop-v1";

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setCart(d.cart ?? []);
        setFavorites(d.favorites ?? []);
        setCoupon(d.coupon ?? null);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify({ cart, favorites, coupon }));
  }, [cart, favorites, coupon, loaded]);

  const add = useCallback((p: Product, options: Record<string, string> = {}, qty = 1) => {
    if (p.stock <= 0) return void toast.error("Produto indisponível no momento");
    const key = `${p.id}|${JSON.stringify(options)}`;
    setCart((c) => {
      const ex = c.find((l) => l.key === key);
      if (ex) return c.map((l) => (l.key === key ? { ...l, qty: Math.min(p.stock, l.qty + qty) } : l));
      return [...c, { key, productId: p.id, qty, options }];
    });
    toast.success("Adicionado ao carrinho", { description: p.name });
  }, []);

  const value = useMemo<ShopState>(() => {
    const lines = cart
      .map((l) => ({ ...l, product: PRODUCTS.find((p) => p.id === l.productId)! }))
      .filter((l) => l.product);
    const subtotal = lines.reduce((s, l) => s + effectivePrice(l.product) * l.qty, 0);
    const c = coupon ? COUPONS[coupon] : null;
    const discount = !c ? 0 : c.type === "percent" ? subtotal * (c.value / 100) : c.type === "fixed" ? Math.min(subtotal, c.value) : 0;
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal,
      discount,
      coupon,
      freeShippingCoupon: c?.type === "shipping",
      add,
      setQty: (key, qty) => setCart((cs) => cs.map((l) => (l.key === key ? { ...l, qty: Math.max(1, qty) } : l))),
      remove: (key) => setCart((cs) => cs.filter((l) => l.key !== key)),
      clear: () => {
        setCart([]);
        setCoupon(null);
      },
      applyCoupon: (code) => {
        const k = code.trim().toUpperCase();
        if (!COUPONS[k]) return false;
        setCoupon(k);
        return true;
      },
      removeCoupon: () => setCoupon(null),
      drawerOpen,
      setDrawerOpen,
      favorites,
      toggleFavorite: (id) =>
        setFavorites((f) => {
          const has = f.includes(id);
          toast(has ? "Removido dos favoritos" : "Salvo nos favoritos");
          return has ? f.filter((x) => x !== id) : [...f, id];
        }),
    };
  }, [cart, coupon, drawerOpen, favorites, add]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShop fora do ShopProvider");
  return v;
}
