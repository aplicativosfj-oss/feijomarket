import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { PRODUCTS as LOCAL } from "@/data/products";
import { useDbCategories } from "./AdminCategories";
import { Field, Modal, inputCls, slugify } from "./shared";

interface DbProduct {
  id: string; slug: string; name: string; brand: string; category: string; subcategory: string;
  description: string; price: number; sale_price: number | null; stock: number; image_url: string;
}
const EMPTY: DbProduct = { id: "", slug: "", name: "", brand: "", category: "", subcategory: "", description: "", price: 0, sale_price: null, stock: 0, image_url: "" };
const localImg = new Map(LOCAL.map((p) => [p.id, p.images[0]]));

export function AdminProducts() {
  const { cats } = useDbCategories();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("products")
      .select("id, slug, name, brand, category, subcategory, description, price, sale_price, stock, image_url")
      .order("category").order("name");
    if (error) toast.error(`Erro ao carregar produtos: ${error.message}`);
    else setProducts((data ?? []).map((p) => ({ ...p, price: Number(p.price), sale_price: p.sale_price == null ? null : Number(p.sale_price) })));
  };
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return products.filter((p) => (!catFilter || p.category === catFilter) && (!n || `${p.name} ${p.brand} ${p.subcategory}`.toLowerCase().includes(n)));
  }, [products, q, catFilter]);

  const subs = cats.find((c) => c.slug === editing?.category)?.subcategories ?? [];

  const upload = async (file: File) => {
    if (!editing) return;
    if (!file.type.startsWith("image/")) { toast.error("Escolha um arquivo de imagem."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("A foto deve ter no máximo 5 MB."); return; }
    setBusy(true);
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${editing.id || "novo"}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
    setBusy(false);
    if (error) { toast.error(`Erro ao enviar foto: ${error.message}`); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setEditing({ ...editing, image_url: data.publicUrl });
    toast.success("Foto enviada! Clique em salvar.");
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim() || editing.price <= 0 || !editing.category) { toast.error("Preencha nome, categoria e preço maior que zero."); return; }
    if (editing.sale_price && editing.sale_price >= editing.price) { toast.error("O preço promocional deve ser menor que o preço normal."); return; }
    setBusy(true);
    const row = {
      ...editing,
      name: editing.name.trim(),
      id: editing.id || `p${Date.now()}`,
      slug: editing.slug || slugify(editing.name),
      stock: Math.max(0, Math.floor(editing.stock)),
      sale_price: editing.sale_price && editing.sale_price > 0 ? editing.sale_price : null,
    };
    const { error } = await supabase.from("products").upsert(row);
    setBusy(false);
    if (error) { toast.error(`Erro ao salvar: ${error.message}`); return; }
    toast.success("Produto salvo! Já aparece na loja.");
    setEditing(null);
    void load();
  };

  /** Edição rápida de preço/estoque direto na tabela. */
  const quickSave = async (p: DbProduct, patch: Partial<Pick<DbProduct, "price" | "stock">>) => {
    if (patch.price !== undefined && (!(patch.price > 0) || (p.sale_price && p.sale_price >= patch.price))) {
      toast.error("Preço inválido (precisa ser maior que zero e maior que a promoção).");
      return false;
    }
    if (patch.stock !== undefined) patch.stock = Math.max(0, Math.floor(patch.stock));
    const { error } = await supabase.from("products").update(patch).eq("id", p.id);
    if (error) { toast.error(`Erro ao salvar: ${error.message}`); return false; }
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
    toast.success(`${p.name} atualizado.`);
    return true;
  };

  const remove = async (p: DbProduct) => {
    if (!confirm(`Apagar "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) { toast.error(`Erro ao apagar: ${error.message}`); return; }
    toast.success("Produto apagado.");
    void load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto…" aria-label="Buscar produto" className="h-11 w-full rounded-full border border-input bg-secondary pl-11 pr-4 text-sm outline-none focus:border-accent" />
        </div>
        <select aria-label="Filtrar categoria" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-11 rounded-full border border-input bg-background px-4 text-sm">
          <option value="">Todas as categorias</option>
          {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <span className="text-sm text-muted-foreground">{filtered.length} de {products.length}</span>
        <button onClick={() => setEditing({ ...EMPTY, category: cats[0]?.slug ?? "" })} className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Produto</th><th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Preço</th><th className="px-4 py-3 text-right">Promo</th>
              <th className="px-4 py-3 text-right">Estoque</th><th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image_url || localImg.get(p.id) || ""} alt="" className="h-10 w-10 rounded-lg bg-secondary object-cover" />
                    <div><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.brand}</div></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{cats.find((c) => c.slug === p.category)?.name ?? p.category} · {p.subcategory}</td>
                <td className="px-4 py-3 text-right font-medium">
                  <QuickNumber label={`Preço de ${p.name}`} value={p.price} step="0.01" display={formatBRL(p.price)} onSave={(v) => quickSave(p, { price: v })} />
                </td>
                <td className="px-4 py-3 text-right text-promo">{p.sale_price ? formatBRL(p.sale_price) : "—"}</td>
                <td className={`px-4 py-3 text-right ${p.stock === 0 ? "font-semibold text-promo" : ""}`}>
                  <QuickNumber label={`Estoque de ${p.name}`} value={p.stock} step="1" display={String(p.stock)} onSave={(v) => quickSave(p, { stock: v })} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing({ ...p })} aria-label={`Editar ${p.name}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(p)} aria-label={`Apagar ${p.name}`} className="grid h-9 w-9 place-items-center rounded-full text-promo hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhum produto encontrado.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? "Editar produto" : "Novo produto"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field label="Nome"><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria">
                <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value, subcategory: "" })} className={inputCls}>
                  {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Subcategoria">
                <select value={editing.subcategory} onChange={(e) => setEditing({ ...editing, subcategory: e.target.value })} className={inputCls}>
                  <option value="">—</option>
                  {[...new Set([...subs, editing.subcategory].filter(Boolean))].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Preço (R$)"><input type="number" step="0.01" min="0" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className={inputCls} /></Field>
              <Field label="Promoção"><input type="number" step="0.01" min="0" value={editing.sale_price ?? ""} onChange={(e) => setEditing({ ...editing, sale_price: e.target.value ? Number(e.target.value) : null })} className={inputCls} /></Field>
              <Field label="Estoque"><input type="number" min="0" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} className={inputCls} /></Field>
            </div>
            <Field label="Marca"><input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} className={inputCls} /></Field>
            <div>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Foto</span>
              <div className="flex items-center gap-3">
                <img src={editing.image_url || localImg.get(editing.id) || ""} alt="Prévia da foto" className="h-20 w-20 rounded-xl bg-secondary object-cover" />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
                  <Upload className="h-4 w-4" /> {busy ? "Enviando…" : "Enviar foto"}
                  <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
                </label>
              </div>
              <input value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value.trim() })} placeholder="ou cole o link da foto (https://…)" aria-label="Link da foto" className={inputCls + " mt-2"} />
            </div>
            <Field label="Descrição"><textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className={inputCls + " h-auto py-2"} /></Field>
            <button onClick={save} disabled={busy} className="h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Aguarde…" : "Salvar produto"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Valor clicável que vira campo numérico; Enter ou sair do campo salva, Esc cancela. */
function QuickNumber({ label, value, display, step, onSave }: { label: string; value: number; display: string; step: string; onSave: (v: number) => Promise<boolean> }) {
  const [draft, setDraft] = useState<string | null>(null);
  if (draft === null) {
    return (
      <button type="button" aria-label={`Alterar ${label.toLowerCase()}`} title="Clique para alterar" onClick={() => setDraft(String(value))} className="rounded-lg px-2 py-1 hover:bg-secondary hover:underline">
        {display}
      </button>
    );
  }
  const commit = async () => {
    const v = Number(draft.replace(",", "."));
    if (draft.trim() === "" || Number.isNaN(v) || v === value) { setDraft(null); return; }
    if (await onSave(v)) setDraft(null);
  };
  return (
    <input
      autoFocus type="number" min="0" step={step} aria-label={label} value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={(e) => { if (e.key === "Enter") void commit(); if (e.key === "Escape") setDraft(null); }}
      className="h-9 w-24 rounded-lg border border-accent bg-background px-2 text-right text-sm outline-none"
    />
  );
}
