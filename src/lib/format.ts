import { STORE } from "@/config/store";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (v: number) => brl.format(v);

export function installments(price: number) {
  const n = Math.min(STORE.maxInstallments, Math.max(1, Math.floor(price / 30)));
  return { n, value: price / n };
}

export const pixPrice = (price: number) => price * (1 - STORE.pixDiscount);

export function shippingQuote(cep: string, subtotal: number) {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const region = Number(digits[0]);
  const base = region <= 3 ? 14.9 : region <= 6 ? 22.9 : 29.9;
  const free = subtotal >= STORE.freeShippingFrom;
  return [
    { id: "pac", name: "PAC", days: region <= 3 ? "4 a 6 dias úteis" : "7 a 10 dias úteis", price: free ? 0 : base },
    { id: "sedex", name: "SEDEX", days: region <= 3 ? "1 a 2 dias úteis" : "3 a 5 dias úteis", price: base * 1.9 },
  ];
}
