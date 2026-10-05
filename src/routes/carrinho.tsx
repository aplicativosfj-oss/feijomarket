import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useShop } from "@/lib/shop";
import { CartLines } from "@/components/store/CartDrawer";
import { CouponBox, Totals } from "@/components/store/OrderSummary";
import { ShippingCalc } from "@/components/store/bits";
import { Button } from "@/components/ui/button";
import { STORE } from "@/config/store";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: `Carrinho — ${STORE.name}` },
      { name: "description", content: "Revise seus itens, aplique cupons e calcule o frete." },
      { property: "og:title", content: `Carrinho — ${STORE.name}` },
      { property: "og:description", content: "Seu carrinho de compras." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, freeShippingCoupon } = useShop();
  if (lines.length === 0)
    return (
      <div className="container-store flex flex-col items-center gap-4 py-24 text-center">
        <ShoppingBag className="h-14 w-14 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
        <Button asChild size="lg"><Link to="/">Começar a comprar</Link></Button>
      </div>
    );
  return (
    <div className="container-store py-8">
      <h1 className="mb-8 text-3xl font-bold">Carrinho</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-border bg-card px-5"><CartLines /></div>
        <aside className="h-fit space-y-5 rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-40">
          <h2 className="text-lg font-semibold">Resumo do pedido</h2>
          <CouponBox />
          <ShippingCalc subtotal={subtotal} free={freeShippingCoupon} />
          <Totals />
          <Button asChild variant="accent" size="lg" className="w-full"><Link to="/checkout">Finalizar compra</Link></Button>
        </aside>
      </div>
    </div>
  );
}
