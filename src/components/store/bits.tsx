import { useEffect, useState } from "react";
import { Star, Truck } from "lucide-react";
import { formatBRL, installments, pixPrice, shippingQuote } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Stars({ rating, count, size = 14 }: { rating: number; count?: number; size?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Nota ${rating} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(i <= Math.round(rating) ? "fill-star text-star" : "fill-muted text-muted")}
        />
      ))}
      {count != null && <span className="ml-1 text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}

export function PriceBlock({ price, salePrice, large }: { price: number; salePrice?: number; large?: boolean }) {
  const eff = salePrice ?? price;
  const inst = installments(eff);
  return (
    <div className="space-y-0.5">
      {salePrice && <div className="text-xs text-muted-foreground line-through">{formatBRL(price)}</div>}
      <div className={cn("font-display font-bold tracking-tight", large ? "text-3xl" : "text-lg")}>{formatBRL(eff)}</div>
      <div className="text-xs text-muted-foreground">
        ou {inst.n}x de {formatBRL(inst.value)} sem juros
      </div>
      {large && (
        <div className="text-sm font-semibold text-accent">{formatBRL(pixPrice(eff))} no Pix (5% off)</div>
      )}
    </div>
  );
}

export function Countdown({ className }: { className?: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      setLeft(Math.max(0, end.getTime() - now.getTime()));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const parts = left == null ? ["--", "--", "--"] : [3600000, 60000, 1000].map((d, i) =>
    String(Math.floor((left / d) % (i === 0 ? 24 : 60))).padStart(2, "0"),
  );
  return (
    <div className={cn("flex items-center gap-1.5 font-display", className)} aria-label="Tempo restante da oferta" role="timer">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="rounded-lg bg-promo px-2.5 py-1.5 text-lg font-bold tabular-nums text-promo-foreground">{p}</span>
          {i < 2 && <span className="font-bold">:</span>}
        </span>
      ))}
    </div>
  );
}

export function ShippingCalc({ subtotal, free }: { subtotal: number; free?: boolean }) {
  const [cep, setCep] = useState("");
  const [result, setResult] = useState<ReturnType<typeof shippingQuote>>(null);
  const [err, setErr] = useState("");
  return (
    <div className="space-y-2">
      <label htmlFor="cep-calc" className="flex items-center gap-2 text-sm font-semibold">
        <Truck className="h-4 w-4" /> Calcular frete
      </label>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const q = shippingQuote(cep, subtotal);
          setErr(q ? "" : "Digite um CEP válido com 8 dígitos");
          setResult(q);
        }}
      >
        <Input
          id="cep-calc"
          inputMode="numeric"
          placeholder="00000-000"
          maxLength={9}
          value={cep}
          onChange={(e) => setCep(e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2"))}
          className="rounded-full"
        />
        <Button type="submit" variant="outline">OK</Button>
      </form>
      {err && <p className="text-xs text-destructive">{err}</p>}
      {result && (
        <ul className="space-y-1 text-sm">
          {result.map((r) => (
            <li key={r.id} className="flex justify-between rounded-lg bg-secondary px-3 py-2">
              <span>{r.name} · <span className="text-muted-foreground">{r.days}</span></span>
              <span className="font-semibold">{free || r.price === 0 ? "Grátis" : formatBRL(r.price)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
