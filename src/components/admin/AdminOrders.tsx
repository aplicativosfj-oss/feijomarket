import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { STORE } from "@/config/store";

export const ORDER_STATUS = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_preparo: "Em preparo",
  saiu_para_entrega: "Saiu para entrega",
  pronto_para_retirada: "Pronto para retirada",
  entregue: "Entregue",
  cancelado: "Cancelado",
} as const;
type Status = keyof typeof ORDER_STATUS;

interface OrderItem { name: string; qty: number; unitPrice: number; variant?: Record<string, string> }
interface Order {
  id: string; code: string; created_at: string; customer_name: string; customer_phone: string; customer_email: string;
  address: Record<string, string>; delivery_method: string; payment_method: string; items: OrderItem[];
  total: number; status: Status; delivery_eta: string | null; admin_notes: string;
}

const PAY: Record<string, string> = { pix: "Pix", card: "Cartão", boleto: "Boleto" };
const dateBR = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");

/** Link do WhatsApp para o celular do cliente, com mensagem pronta do status. */
function whatsappLink(o: Order): string {
  let phone = o.customer_phone.replace(/\D/g, "");
  if (!phone.startsWith("55")) phone = `55${phone}`;
  const lines = [
    `Olá, ${o.customer_name.split(" ")[0]}! Aqui é da ${STORE.name}.`,
    `Seu pedido *${o.code}* está: *${ORDER_STATUS[o.status]}*.`,
    o.delivery_eta ? `${o.delivery_method === "entrega" ? "Previsão de entrega" : "Pronto para retirar em"}: ${dateBR(o.delivery_eta)}.` : "",
    `Itens: ${o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}.`,
    `Total: ${formatBRL(Number(o.total))}.`,
  ].filter(Boolean);
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Status | "">("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    setLoading(false);
    if (error) { toast.error(`Erro ao carregar pedidos: ${error.message}`); return; }
    setOrders((data ?? []) as unknown as Order[]);
  };
  useEffect(() => { void load(); }, []);

  const update = async (o: Order, patch: Partial<Pick<Order, "status" | "delivery_eta" | "admin_notes">>) => {
    setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, ...patch } : x)));
    const { error } = await supabase.from("orders").update(patch).eq("id", o.id);
    if (error) { toast.error(`Erro ao atualizar: ${error.message}`); void load(); }
    else toast.success("Pedido atualizado.");
  };

  const shown = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Filtrar por status" value={filter} onChange={(e) => setFilter(e.target.value as Status | "")} className="h-11 rounded-full border border-input bg-background px-4 text-sm">
          <option value="">Todos os status</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="text-sm text-muted-foreground">{shown.length} pedido(s)</span>
        <button onClick={() => void load()} className="ml-auto inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Atualizar</button>
      </div>

      {loading ? (
        <p className="mt-10 text-center text-muted-foreground">Carregando pedidos…</p>
      ) : shown.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">Nenhum pedido ainda. Eles aparecem aqui assim que um cliente finaliza a compra.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {shown.map((o) => (
            <li key={o.id} className="rounded-2xl border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-bold">{o.code}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")} · {PAY[o.payment_method] ?? o.payment_method} · {o.delivery_method === "entrega" ? "Entrega" : "Retirada"}</div>
                </div>
                <div className="text-right font-bold">{formatBRL(Number(o.total))}</div>
              </div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <b>{o.customer_name}</b> · {o.customer_phone}
                  <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                  {o.delivery_method === "entrega" && (
                    <div className="mt-1 text-xs text-muted-foreground">{[o.address.street, o.address.number, o.address.complement, o.address.district, o.address.city].filter(Boolean).join(", ")}</div>
                  )}
                </div>
                <ul className="text-xs">
                  {o.items.map((i, idx) => (
                    <li key={`${o.id}-${idx}`}>{i.qty}× {i.name}{i.variant && Object.keys(i.variant).length ? ` (${Object.values(i.variant).join(", ")})` : ""} — {formatBRL(i.unitPrice * i.qty)}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="text-xs font-semibold text-muted-foreground">Status
                  <select value={o.status} onChange={(e) => void update(o, { status: e.target.value as Status })} className="mt-1 block h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground">
                    {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-muted-foreground">Prazo de entrega
                  <input type="date" value={o.delivery_eta ?? ""} onChange={(e) => void update(o, { delivery_eta: e.target.value || null })} className="mt-1 block h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground" />
                </label>
                <a href={whatsappLink(o)} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground">
                  <MessageCircle className="h-4 w-4" /> Avisar cliente no WhatsApp
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
