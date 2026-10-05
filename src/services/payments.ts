/**
 * Camada de pagamento. Hoje simula aprovação (modo teste). Para produção,
 * troque `mockProvider` por uma implementação real (ex.: Stripe ou Mercado Pago)
 * executada no servidor — chaves secretas nunca ficam no navegador.
 */
export type PaymentMethod = "pix" | "card" | "boleto";

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
}

export interface PaymentResult {
  status: "approved" | "pending";
  pixCode?: string;
  boletoLine?: string;
}

export interface PaymentProvider {
  charge(req: PaymentRequest): Promise<PaymentResult>;
}

export const mockProvider: PaymentProvider = {
  async charge(req) {
    await new Promise((r) => setTimeout(r, 900));
    if (req.method === "pix") return { status: "pending", pixCode: `00020126TESTE${req.orderId}5204000053039865802BR` };
    if (req.method === "boleto") return { status: "pending", boletoLine: "34191.79001 01043.510047 91020.150008 1 00000000000000" };
    return { status: "approved" };
  },
};

export const payments: PaymentProvider = mockProvider;
