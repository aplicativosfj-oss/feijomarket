import { useState } from "react";
import { Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useShop } from "@/lib/shop";
import { formatBRL } from "@/lib/format";
import { COUPONS } from "@/config/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CouponBox() {
  const { coupon, applyCoupon, removeCoupon } = useShop();
  const [code, setCode] = useState("");
  if (coupon)
    return (
      <div className="flex items-center justify-between rounded-xl bg-accent-soft px-3 py-2 text-sm">
        <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> <b>{coupon}</b> · {COUPONS[coupon].label}</span>
        <button aria-label="Remover cupom" onClick={removeCoupon}><X className="h-4 w-4" /></button>
      </div>
    );
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (applyCoupon(code)) toast.success("Cupom aplicado!"); else toast.error("Cupom inválido"); }}>
      <Input aria-label="Cupom de desconto" placeholder="Cupom de desconto" value={code} onChange={(e) => setCode(e.target.value)} className="rounded-full" />
      <Button type="submit" variant="outline">Aplicar</Button>
    </form>
  );
}

export function Totals({ shipping }: { shipping?: number | null }) {
  const { subtotal, discount } = useShop();
  const total = subtotal - discount + (shipping ?? 0);
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatBRL(subtotal)}</dd></div>
      {discount > 0 && <div className="flex justify-between text-accent"><dt>Desconto</dt><dd>−{formatBRL(discount)}</dd></div>}
      <div className="flex justify-between"><dt className="text-muted-foreground">Frete</dt><dd>{shipping == null ? "A calcular" : shipping === 0 ? "Grátis" : formatBRL(shipping)}</dd></div>
      <div className="flex justify-between border-t border-border pt-3 text-lg font-bold"><dt>Total</dt><dd>{formatBRL(total)}</dd></div>
    </dl>
  );
}
