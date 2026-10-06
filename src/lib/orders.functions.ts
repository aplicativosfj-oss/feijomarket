/**
 * Criação de pedidos no servidor: preços e estoque vêm do banco (nunca do navegador).
 * O registro do pedido e a baixa de estoque acontecem juntos na função place_order do banco.
 */
import { createServerFn } from "@tanstack/react-start";
import { buildOrder, orderInput } from "@/lib/orders";

export type { CreateOrderInput } from "@/lib/orders";

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

    const order = buildOrder(data, rows ?? [], `FM${Date.now().toString().slice(-8)}`);
    const { error: rpcErr } = await supabaseAdmin.rpc("place_order", { _order: order });
    if (rpcErr) {
      console.error("createOrder place_order", rpcErr);
      // Outro cliente pode ter levado o último item entre a conferência e a gravação.
      if (rpcErr.message.startsWith("Estoque insuficiente")) throw new Error(rpcErr.message);
      throw new Error("Não foi possível registrar o pedido. Tente novamente.");
    }
    return { code: order.code, total: order.total };
  });
