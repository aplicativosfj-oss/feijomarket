import { describe, expect, it } from "vitest";
import { buildOrder, type CreateOrderInput } from "@/lib/orders";
import { formatPhoneBR, waNumber } from "@/components/admin/AdminOrders";

const rows = [
  { id: "a", name: "Whey", price: "120.00", sale_price: "100.00", stock: 3 },
  { id: "b", name: "Caneca", price: "30.00", sale_price: null, stock: 1 },
];
const base: CreateOrderInput = {
  items: [{ productId: "a", qty: 1 }],
  customer: { name: "Maria Silva", email: "maria@example.com", phone: "(68) 99999-0000" },
  address: {},
  deliveryMethod: "retirada",
  paymentMethod: "card",
};

describe("buildOrder", () => {
  it("usa o preço promocional do banco e aplica cupom e desconto do Pix", () => {
    const o = buildOrder(
      { ...base, items: [{ productId: "a", qty: 2 }], paymentMethod: "pix", coupon: "BEMVINDO10" },
      rows,
      "FM1",
    );
    expect(o.subtotal).toBe(200);
    expect(o.discount).toBe(20);
    expect(o.total).toBe(171); // (200 - 20) * 0,95
    expect(o.items[0]).toMatchObject({ productId: "a", unitPrice: 100, qty: 2 });
  });

  it("recusa quando a soma das linhas do mesmo produto passa do estoque", () => {
    const items = [
      { productId: "a", qty: 2, variant: { Sabor: "Chocolate" } },
      { productId: "a", qty: 2, variant: { Sabor: "Baunilha" } },
    ];
    expect(() => buildOrder({ ...base, items }, rows, "FM2")).toThrow(
      "Estoque insuficiente para Whey.",
    );
  });

  it("recusa produto que não existe mais", () => {
    expect(() => buildOrder({ ...base, items: [{ productId: "x", qty: 1 }] }, rows, "FM3")).toThrow(
      "não existe mais",
    );
  });

  it("só permite entrega acima do valor mínimo", () => {
    expect(() =>
      buildOrder(
        { ...base, items: [{ productId: "b", qty: 1 }], deliveryMethod: "entrega" },
        rows,
        "FM4",
      ),
    ).toThrow("Entrega disponível");
  });
});

describe("WhatsApp do cliente", () => {
  it("normaliza o celular para o wa.me e formata para leitura", () => {
    expect(waNumber("(68) 99203-1340")).toBe("5568992031340");
    expect(waNumber("+55 68 99203-1340")).toBe("5568992031340");
    expect(formatPhoneBR("68992031340")).toBe("(68) 99203-1340");
  });
});
