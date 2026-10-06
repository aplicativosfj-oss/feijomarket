import { STORE } from "@/config/store";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (v: number) => brl.format(v);

export function installments(price: number) {
  const n = Math.min(STORE.maxInstallments, Math.max(1, Math.floor(price / 30)));
  return { n, value: price / n };
}

export const pixPrice = (price: number) => price * (1 - STORE.pixDiscount);

/** Entrega local em Feijó (AC): grátis a partir do mínimo; abaixo disso, só retirada na loja. */
export function shippingQuote(cep: string, subtotal: number) {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const pickup = { id: "retirada", name: "Retirada na loja (Feijó)", days: "Combine pelo WhatsApp", price: 0 };
  if (subtotal >= STORE.freeShippingFrom) {
    return [{ id: "entrega", name: "Entrega grátis em Feijó", days: "Combine o horário pelo WhatsApp", price: 0 }, pickup];
  }
  return [pickup];
}
