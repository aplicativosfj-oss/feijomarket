import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/shop";
import { effectivePrice } from "@/services/catalog";
import { formatBRL } from "@/lib/format";
import { STORE } from "@/config/store";

export function CartLines({ compact }: { compact?: boolean }) {
  const { lines, setQty, remove } = useShop();
  return (
    <ul className="divide-y divide-border">
      {lines.map((l) => (
        <li key={l.key} className="flex gap-3 py-4">
          <img src={l.product.images[0]} alt="" className={compact ? "h-20 w-20 rounded-xl object-cover" : "h-24 w-24 rounded-xl object-cover"} />
          <div className="flex flex-1 flex-col">
            <Link to="/produto/$slug" params={{ slug: l.product.slug }} className="line-clamp-2 text-sm font-semibold hover:text-accent">
              {l.product.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {Object.entries(l.options).map(([k, v]) => `${k}: ${v}`).join(" · ")}
            </span>
            <div className="mt-auto flex items-center justify-between pt-2">
              <div className="flex items-center rounded-full border border-border">
                <button aria-label="Diminuir quantidade" onClick={() => setQty(l.key, l.qty - 1)} className="grid h-8 w-8 place-items-center"><Minus className="h-3 w-3" /></button>
                <span className="w-6 text-center text-sm tabular-nums">{l.qty}</span>
                <button aria-label="Aumentar quantidade" onClick={() => setQty(l.key, Math.min(l.product.stock, l.qty + 1))} className="grid h-8 w-8 place-items-center"><Plus className="h-3 w-3" /></button>
              </div>
              <span className="font-semibold">{formatBRL(effectivePrice(l.product) * l.qty)}</span>
              <button aria-label="Remover item" onClick={() => remove(l.key)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CartDrawer() {
  const { drawerOpen, setDrawerOpen, lines, subtotal } = useShop();
  const missing = STORE.freeShippingFrom - subtotal;
  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display">Seu carrinho</SheetTitle>
        </SheetHeader>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Seu carrinho está vazio</p>
            <Button onClick={() => setDrawerOpen(false)} asChild><Link to="/">Continuar comprando</Link></Button>
          </div>
        ) : (
          <>
            <div className="px-4">
              <div className="rounded-xl bg-accent-soft p-3 text-xs">
                {missing > 0 ? <>Faltam <b>{formatBRL(missing)}</b> para frete grátis</> : <b>Você ganhou frete grátis!</b>}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                  <div className="h-full bg-accent transition-all" style={{ width: `${Math.min(100, (subtotal / STORE.freeShippingFrom) * 100)}%` }} />
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4"><CartLines compact /></div>
            <div className="space-y-3 border-t border-border p-4">
              <div className="flex justify-between font-semibold"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
              <Button variant="accent" size="lg" className="w-full" asChild onClick={() => setDrawerOpen(false)}>
                <Link to="/checkout">Finalizar compra</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild onClick={() => setDrawerOpen(false)}>
                <Link to="/carrinho">Ver carrinho completo</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
