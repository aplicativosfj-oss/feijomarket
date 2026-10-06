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
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

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
    const path = `${editing.id || "novo"}-${Date.now()}.${file.name.split(".").pop() ?? "jpg"}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
    if (error) { setBusy(false); { toast.error(`Erro ao enviar foto: ${error.message}`); return; } }
    const { data, error: urlErr } = await supabase.storage.from("product-images").createSignedUrl(path, TEN_YEARS);
    setBusy(false);
    if (urlErr || !data) { toast.error("Foto enviada, mas não foi possível gerar o link."); return; }
    setEditing({ ...editing, image_url: data.signedUrl });
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
                <td className="px-4 py-3 text-right font-medium">{formatBRL(p.price)}</td>
                <td className="px-4 py-3 text-right text-promo">{p.sale_price ? formatBRL(p.sale_price) : "—"}</td>
                <td className={`px-4 py-3 text-right ${p.stock === 0 ? "font-semibold text-promo" : ""}`}>{p.stock}</td>
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
            </div>
            <Field label="Descrição"><textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className={inputCls + " h-auto py-2"} /></Field>
            <button onClick={save} disabled={busy} className="h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Aguarde…" : "Salvar produto"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
