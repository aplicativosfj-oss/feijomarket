import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Check, CheckCircle2, CreditCard, FileText, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useShop } from "@/lib/shop";
import { formatBRL, installments, shippingQuote } from "@/lib/format";
import { CouponBox, Totals } from "@/components/store/OrderSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STORE } from "@/config/store";
import { payments, type PaymentMethod, type PaymentResult } from "@/services/payments";
import { effectivePrice } from "@/services/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: `Finalizar compra — ${STORE.name}` },
      { name: "description", content: "Checkout seguro com Pix, cartão e boleto." },
      { property: "og:title", content: `Checkout — ${STORE.name}` },
      { property: "og:description", content: "Finalize sua compra com segurança." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const STEPS = ["Dados", "Endereço", "Frete", "Pagamento", "Confirmação"];

const personal = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  cpf: z.string().regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido"),
  phone: z.string().regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone inválido"),
});
const address = z.object({
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  street: z.string().trim().min(2, "Obrigatório").max(150),
  number: z.string().trim().min(1, "Obrigatório").max(10),
  complement: z.string().max(60).optional(),
  district: z.string().trim().min(2, "Obrigatório").max(80),
  city: z.string().trim().min(2, "Obrigatório").max(80),
  state: z.string().trim().length(2, "UF"),
});
const card = z.object({
  number: z.string().transform((s) => s.replace(/\s/g, "")).pipe(z.string().regex(/^\d{16}$/, "Número inválido")),
  holder: z.string().trim().min(3, "Nome impresso no cartão"),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "MM/AA"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV"),
});

type Form = Record<string, string>;

function Field({ id, label, value, onChange, error, className, ...rest }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cn("h-11 rounded-xl", error && "border-destructive")} {...rest} />
      {error && <p id={`${id}-err`} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function errorsOf(r: z.SafeParseReturnType<unknown, unknown>) {
  if (r.success) return {};
  return Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
}

function CheckoutPage() {
  const shop = useShop();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Form>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ship, setShip] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [cardData, setCardData] = useState<Form>({});
  const [loadingCep, setLoadingCep] = useState(false);
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<{ orderId: string; pay: PaymentResult; total: number } | null>(null);

  const set = (k: string) => (v: string) => setData((d) => ({ ...d, [k]: v }));
  const quotes = data.cep ? shippingQuote(data.cep, shop.subtotal) : null;
  const shipOpt = quotes?.find((q) => q.id === ship);
  const shippingPrice = shipOpt ? (shop.freeShippingCoupon ? 0 : shipOpt.price) : null;
  const base = shop.subtotal - shop.discount + (shippingPrice ?? 0);
  const total = method === "pix" ? base - (shop.subtotal - shop.discount) * STORE.pixDiscount : base;

  const lookupCep = async (raw: string) => {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const j = await res.json();
      if (j.erro) throw new Error();
      setData((d) => ({ ...d, street: j.logradouro || d.street || "", district: j.bairro || d.district || "", city: j.localidade, state: j.uf }));
    } catch {
      toast.error("CEP não encontrado. Preencha o endereço manualmente.");
    } finally {
      setLoadingCep(false);
    }
  };

  const next = () => {
    let errs: Record<string, string> = {};
    if (step === 0) errs = errorsOf(personal.safeParse(data));
    if (step === 1) errs = errorsOf(address.safeParse(data));
    if (step === 2 && !ship) errs = { ship: "Escolha uma opção de frete" };
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep((s) => s + 1);
  };

  const pay = async () => {
    if (method === "card") {
      const errs = errorsOf(card.safeParse(cardData));
      setErrors(errs);
      if (Object.keys(errs).length) return;
    }
    setPaying(true);
    const orderId = `FS${Date.now().toString().slice(-8)}`;
    try {
      const r = await payments.charge({ orderId, amount: total, method });
      setResult({ orderId, pay: r, total });
      shop.clear();
      setStep(4);
    } catch {
      toast.error("Não foi possível processar o pagamento. Tente novamente.");
    } finally {
      setPaying(false);
    }
  };

  if (shop.lines.length === 0 && !result)
    return (
      <div className="container-store py-24 text-center">
        <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
        <Button asChild className="mt-6"><Link to="/">Voltar à loja</Link></Button>
      </div>
    );

  return (
    <div className="container-store py-8">
      <h1 className="mb-6 text-3xl font-bold">Finalizar compra</h1>
      <ol className="mb-10 flex gap-2 overflow-x-auto" aria-label="Etapas do checkout">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2" aria-current={i === step ? "step" : undefined}>
            <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold", i < step ? "bg-accent text-accent-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("hidden text-sm sm:block", i === step ? "font-semibold" : "text-muted-foreground")}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      {step === 4 && result ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8 text-center animate-fade-up">
          <CheckCircle2 className="mx-auto h-16 w-16 text-accent" />
          <h2 className="mt-4 text-2xl font-bold">Pedido {result.orderId} recebido!</h2>
          <p className="mt-2 text-muted-foreground">Enviamos a confirmação para {data.email}. Total: <b>{formatBRL(result.total)}</b></p>
          {result.pay.pixCode && (
            <div className="mt-6 space-y-2 rounded-2xl bg-secondary p-4 text-left">
              <p className="text-sm font-semibold">Pix copia e cola (modo teste)</p>
              <code className="block break-all text-xs">{result.pay.pixCode}</code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(result.pay.pixCode!); toast.success("Código copiado"); }}>Copiar código</Button>
            </div>
          )}
          {result.pay.boletoLine && (
            <div className="mt-6 rounded-2xl bg-secondary p-4 text-left">
              <p className="text-sm font-semibold">Linha digitável (modo teste)</p>
              <code className="block break-all text-xs">{result.pay.boletoLine}</code>
            </div>
          )}
          {result.pay.status === "approved" && <p className="mt-4 font-semibold text-accent">Pagamento aprovado (modo teste)</p>}
          <Button asChild className="mt-8" size="lg"><Link to="/">Continuar comprando</Link></Button>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="name" label="Nome completo" autoComplete="name" value={data.name ?? ""} onChange={set("name")} error={errors.name} className="sm:col-span-2" />
                <Field id="email" label="E-mail" type="email" autoComplete="email" value={data.email ?? ""} onChange={set("email")} error={errors.email} />
                <Field id="cpf" label="CPF" inputMode="numeric" placeholder="000.000.000-00" value={data.cpf ?? ""} onChange={set("cpf")} error={errors.cpf} />
                <Field id="phone" label="Celular" type="tel" autoComplete="tel" placeholder="(11) 99999-9999" value={data.phone ?? ""} onChange={set("phone")} error={errors.phone} />
              </div>
            )}
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-6">
                <div className="relative sm:col-span-2">
                  <Field id="cep" label="CEP" inputMode="numeric" placeholder="00000-000" maxLength={9} value={data.cep ?? ""}
                    onChange={(v) => { const f = v.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2"); set("cep")(f); if (f.length === 9) lookupCep(f); }} error={errors.cep} />
                  {loadingCep && <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin" />}
                </div>
                <Field id="street" label="Rua" autoComplete="address-line1" value={data.street ?? ""} onChange={set("street")} error={errors.street} className="sm:col-span-4" />
                <Field id="number" label="Número" value={data.number ?? ""} onChange={set("number")} error={errors.number} className="sm:col-span-2" />
                <Field id="complement" label="Complemento" value={data.complement ?? ""} onChange={set("complement")} className="sm:col-span-4" />
                <Field id="district" label="Bairro" value={data.district ?? ""} onChange={set("district")} error={errors.district} className="sm:col-span-2" />
                <Field id="city" label="Cidade" value={data.city ?? ""} onChange={set("city")} error={errors.city} className="sm:col-span-3" />
                <Field id="state" label="UF" maxLength={2} value={data.state ?? ""} onChange={(v) => set("state")(v.toUpperCase())} error={errors.state} />
              </div>
            )}
            {step === 2 && (
              <fieldset className="space-y-3">
                <legend className="mb-3 font-semibold">Escolha o frete para {data.cep}</legend>
                {quotes?.map((q) => (
                  <label key={q.id} className={cn("flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition", ship === q.id ? "border-accent bg-accent-soft" : "border-border")}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name="ship" checked={ship === q.id} onChange={() => setShip(q.id)} className="accent-current" />
                      <span><b>{q.name}</b> <span className="block text-xs text-muted-foreground">{q.days}</span></span>
                    </span>
                    <b>{shop.freeShippingCoupon || q.price === 0 ? "Grátis" : formatBRL(q.price)}</b>
                  </label>
                ))}
                {errors.ship && <p className="text-xs text-destructive">{errors.ship}</p>}
              </fieldset>
            )}
            {step === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Forma de pagamento">
                  {([["pix", "Pix", QrCode], ["card", "Cartão", CreditCard], ["boleto", "Boleto", FileText]] as const).map(([k, l, Icon]) => (
                    <button key={k} role="radio" aria-checked={method === k} onClick={() => setMethod(k)} className={cn("flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition", method === k ? "border-accent bg-accent-soft" : "border-border")}>
                      <Icon className="h-6 w-6" /> {l}
                    </button>
                  ))}
                </div>
                {method === "pix" && <p className="rounded-xl bg-secondary p-4 text-sm">Pague com Pix e ganhe <b>5% de desconto</b>. O código é gerado após confirmar o pedido.</p>}
                {method === "boleto" && <p className="rounded-xl bg-secondary p-4 text-sm">O boleto vence em 3 dias úteis. O pedido é liberado após a compensação.</p>}
                {method === "card" && (
                  <div className="grid gap-4 sm:grid-cols-4">
                    <Field id="cc" label="Número do cartão" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" maxLength={19} value={cardData.number ?? ""} onChange={(v) => setCardData({ ...cardData, number: v.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ") })} error={errors.number} className="sm:col-span-4" />
                    <Field id="holder" label="Nome no cartão" autoComplete="cc-name" value={cardData.holder ?? ""} onChange={(v) => setCardData({ ...cardData, holder: v })} error={errors.holder} className="sm:col-span-2" />
                    <Field id="exp" label="Validade" placeholder="MM/AA" maxLength={5} value={cardData.expiry ?? ""} onChange={(v) => setCardData({ ...cardData, expiry: v.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2") })} error={errors.expiry} />
                    <Field id="cvv" label="CVV" inputMode="numeric" maxLength={4} value={cardData.cvv ?? ""} onChange={(v) => setCardData({ ...cardData, cvv: v })} error={errors.cvv} />
                    <p className="text-xs text-muted-foreground sm:col-span-4">Até {installments(total).n}x de {formatBRL(installments(total).value)} sem juros · Modo teste: nenhum valor real é cobrado.</p>
                  </div>
                )}
              </div>
            )}
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Voltar</Button>
              {step < 3 ? (
                <Button onClick={next} size="lg">Continuar</Button>
              ) : (
                <Button onClick={pay} size="lg" variant="accent" disabled={paying}>{paying && <Loader2 className="animate-spin" />} Confirmar pedido · {formatBRL(total)}</Button>
              )}
            </div>
          </div>

          <aside className="h-fit space-y-5 rounded-3xl border border-border bg-card p-6 lg:sticky lg:top-40">
            <h2 className="text-lg font-semibold">Resumo</h2>
            <ul className="space-y-3">
              {shop.lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3 text-sm">
                  <img src={l.product.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <span className="flex-1 line-clamp-2">{l.qty}× {l.product.name}</span>
                  <span className="font-medium">{formatBRL(effectivePrice(l.product) * l.qty)}</span>
                </li>
              ))}
            </ul>
            <CouponBox />
            <Totals shipping={shippingPrice} />
            {method === "pix" && step === 3 && <p className="text-sm font-semibold text-accent">Total no Pix: {formatBRL(total)}</p>}
          </aside>
        </div>
      )}
    </div>
  );
}
