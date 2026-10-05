export const STORE = {
  name: "Franc Store",
  tagline: "Performance, tecnologia e estilo em um só lugar",
  whatsapp: "5500000000000", // TODO: substituir pelo número real
  email: "contato@francstore.com.br", // TODO: substituir
  freeShippingFrom: 299,
  maxInstallments: 10,
  pixDiscount: 0.05,
} as const;

export const COUPONS: Record<string, { type: "percent" | "fixed" | "shipping"; value: number; label: string }> = {
  BEMVINDO10: { type: "percent", value: 10, label: "10% de desconto" },
  FRANC50: { type: "fixed", value: 50, label: "R$ 50 de desconto" },
  FRETEGRATIS: { type: "shipping", value: 0, label: "Frete grátis" },
};
