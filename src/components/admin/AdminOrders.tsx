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

const STATUS_COLOR: Record<Status, string> = {
  pendente: "bg-amber-100 text-amber-900",
  confirmado: "bg-sky-100 text-sky-900",
  em_preparo: "bg-violet-100 text-violet-900",
  saiu_para_entrega: "bg-blue-100 text-blue-900",
  pronto_para_retirada: "bg-teal-100 text-teal-900",
  entregue: "bg-emerald-100 text-emerald-900",
  cancelado: "bg-zinc-200 text-zinc-700",
};

/** Celular do cliente no formato internacional usado pelo WhatsApp (55 + DDD + número). */
export function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
}

/** (68) 99203-1340 a partir de qualquer formato digitado no checkout. */
export function formatPhoneBR(phone: string): string {
  const d = waNumber(phone).slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

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
  const phone = waNumber(o.customer_phone);
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
  const counts = orders.reduce<Partial<Record<Status, number>>>((acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }), {});

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por status">
        <button onClick={() => setFilter("")} aria-pressed={filter === ""} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === "" ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
          Todos ({orders.length})
        </button>
        {(Object.keys(ORDER_STATUS) as Status[]).map((k) => (
          <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === k ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
            {ORDER_STATUS[k]} ({counts[k] ?? 0})
          </button>
        ))}
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
                  <div className="font-display text-lg font-bold">Pedido {o.code}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")} · {PAY[o.payment_method] ?? o.payment_method} · {o.delivery_method === "entrega" ? "Entrega" : "Retirada"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span data-testid="order-status" className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[o.status] ?? ""}`}>{ORDER_STATUS[o.status] ?? o.status}</span>
                  <span className="font-bold">{formatBRL(Number(o.total))}</span>
                </div>
              </div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <b>{o.customer_name}</b>
                  <a href={`https://wa.me/${waNumber(o.customer_phone)}`} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1.5 font-semibold text-accent hover:underline">
                    <MessageCircle className="h-4 w-4" /> WhatsApp: {formatPhoneBR(o.customer_phone)}
                  </a>
                  <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                  {o.delivery_method === "entrega" && (
                    <div className="mt-1 text-xs text-muted-foreground">Entregar em: {[o.address.street, o.address.number, o.address.complement, o.address.district, o.address.city].filter(Boolean).join(", ")}</div>
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
                <label className="min-w-48 flex-1 text-xs font-semibold text-muted-foreground">Observações internas
                  <input defaultValue={o.admin_notes} placeholder="Ex.: entregar após 18h" onBlur={(e) => { if (e.target.value !== o.admin_notes) void update(o, { admin_notes: e.target.value }); }} className="mt-1 block h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground" />
                </label>
                <a href={whatsappLink(o)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground">
                  <MessageCircle className="h-4 w-4" /> Enviar status no WhatsApp
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
