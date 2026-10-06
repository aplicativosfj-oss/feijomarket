export const STORE = {
  name: "Feijó Market",
  tagline: "Tudo para o seu dia a dia, aqui em Feijó",
  whatsapp: "5568992031340",
  email: "contato@feijomarket.com.br", // TODO: substituir
  freeShippingFrom: 99.99, // entrega grátis em Feijó acima deste valor; abaixo, só retirada
  maxInstallments: 10,
  pixDiscount: 0.05,
} as const;

export const COUPONS: Record<string, { type: "percent" | "fixed" | "shipping"; value: number; label: string }> = {
  BEMVINDO10: { type: "percent", value: 10, label: "10% de desconto" },
  FRANC50: { type: "fixed", value: 50, label: "R$ 50 de desconto" },
  FRETEGRATIS: { type: "shipping", value: 0, label: "Frete grátis" },
};
