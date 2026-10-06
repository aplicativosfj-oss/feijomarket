/**
 * Criação de pedidos no servidor: preços e estoque vêm do banco (nunca do navegador).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { COUPONS, STORE } from "@/config/store";

const orderInput = z.object({
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
const round2 = (n: number) => Math.round(n * 100) / 100;

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: rows, error } = await supabaseAdmin
      .from("products")
      .select("id, name, price, sale_price, stock")
      .in("id", ids);
    if (error) {
      console.error("createOrder products", error);
      throw new Error("Não foi possível conferir os produtos. Tente novamente.");
    }
    const byId = new Map((rows ?? []).map((r) => [r.id, r]));

    const items = data.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p) throw new Error("Um produto do carrinho não existe mais.");
      if (p.stock < i.qty) throw new Error(`Estoque insuficiente para ${p.name}.`);
      const unit = p.sale_price != null && Number(p.sale_price) > 0 ? Number(p.sale_price) : Number(p.price);
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
    const total = round2(data.paymentMethod === "pix" ? afterDiscount * (1 - STORE.pixDiscount) : afterDiscount);

    const code = `FM${Date.now().toString().slice(-8)}`;
    const { error: insErr } = await supabaseAdmin.from("orders").insert({
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
    });
    if (insErr) {
      console.error("createOrder insert", insErr);
      throw new Error("Não foi possível registrar o pedido. Tente novamente.");
    }
    // Baixa de estoque (melhor esforço; o admin pode corrigir no painel).
    await Promise.all(
      items.map((i) => {
        const p = byId.get(i.productId)!;
        return supabaseAdmin.from("products").update({ stock: Math.max(0, p.stock - i.qty) }).eq("id", i.productId);
      }),
    );
    return { code, total };
  });
