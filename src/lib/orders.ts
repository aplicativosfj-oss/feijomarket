/**
 * Cálculo do pedido a partir dos preços e do estoque do banco (função pura, testável).
 */
import { z } from "zod";
import { COUPONS, STORE } from "@/config/store";

export const orderInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(40),
        qty: z.number().int().min(1).max(99),
        variant: z.record(z.string().max(40), z.string().max(60)).optional(),
      }),
    )
    .min(1)
    .max(50),
  customer: z.object({
    name: z.string().trim().min(3).max(100),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(8).max(20),
    cpf: z.string().trim().max(14).optional(),
  }),
  address: z.record(z.string().max(30), z.string().max(150)).default({}),
  deliveryMethod: z.enum(["entrega", "retirada"]),
  paymentMethod: z.enum(["pix", "card", "boleto"]),
  coupon: z.string().max(30).nullable().optional(),
});

export type CreateOrderInput = z.infer<typeof orderInput>;

export interface ProductRow {
  id: string;
  name: string;
  price: number | string;
  sale_price: number | string | null;
  stock: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Monta o pedido (itens, descontos, total) ou lança um erro legível para o cliente. */
export function buildOrder(data: CreateOrderInput, rows: ProductRow[], code: string) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const wanted = new Map<string, number>();
  for (const i of data.items) wanted.set(i.productId, (wanted.get(i.productId) ?? 0) + i.qty);

  const items = data.items.map((i) => {
    const p = byId.get(i.productId);
    if (!p) throw new Error("Um produto do carrinho não existe mais.");
    if (p.stock < (wanted.get(i.productId) ?? i.qty))
      throw new Error(`Estoque insuficiente para ${p.name}.`);
    const unit =
      p.sale_price != null && Number(p.sale_price) > 0 ? Number(p.sale_price) : Number(p.price);
    return { productId: p.id, name: p.name, qty: i.qty, unitPrice: unit, variant: i.variant ?? {} };
  });

  const subtotal = round2(items.reduce((s, i) => s + i.unitPrice * i.qty, 0));
  if (data.deliveryMethod === "entrega" && subtotal < STORE.freeShippingFrom) {
    throw new Error("Entrega disponível só a partir do valor mínimo. Escolha retirada na loja.");
  }
  const c = data.coupon ? COUPONS[data.coupon] : undefined;
  let discount = 0;
  if (c?.type === "percent") discount = (subtotal * c.value) / 100;
  if (c?.type === "fixed") discount = Math.min(c.value, subtotal);
  discount = round2(discount);
  const shipping = 0; // entrega local grátis acima do mínimo; retirada sem custo
  const afterDiscount = subtotal - discount;
  const total = round2(
    data.paymentMethod === "pix" ? afterDiscount * (1 - STORE.pixDiscount) : afterDiscount,
  );

  return {
    code,
    customer_name: data.customer.name,
    customer_email: data.customer.email,
    customer_phone: data.customer.phone,
    address: { ...data.address, cpf: data.customer.cpf ?? "" },
    delivery_method: data.deliveryMethod,
    payment_method: data.paymentMethod,
    items,
    subtotal,
    discount,
    shipping,
    total,
  };
}
