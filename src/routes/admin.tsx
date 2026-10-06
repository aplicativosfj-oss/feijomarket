import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES } from "@/data/products";
import { formatBRL } from "@/lib/format";
import { STORE } from "@/config/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: `Administração — ${STORE.name}` },
      { name: "description", content: "Painel de administração da loja: editar produtos, preços e fotos." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

interface DbProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  price: number;
  sale_price: number | null;
  stock: number;
  image_url: string;
}

const EMPTY: DbProduct = {
  id: "", slug: "", name: "", brand: "", category: "suplementos", subcategory: "",
  description: "", price: 0, sale_price: null, stock: 0, image_url: "",
};

function AdminPage() {
  const { session, isAdmin, loading } = useAuth();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, brand, category, subcategory, description, price, sale_price, stock, image_url")
      .order("category")
      .order("name");
    if (error) setLoadError(error.message);
    else setProducts((data as DbProduct[]) ?? []);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return products;
    return products.filter((p) => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(n));
  }, [products, q]);

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim() || editing.price <= 0) {
      toast.error("Preencha nome e preço maior que zero.");
      return;
    }
    setSaving(true);
    const row = {
      ...editing,
      slug: editing.slug || editing.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      id: editing.id || `p${Date.now()}`,
      sale_price: editing.sale_price && editing.sale_price > 0 ? editing.sale_price : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("products").upsert(row);
    setSaving(false);
    if (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
      return;
    }
    toast.success("Produto salvo!");
    setEditing(null);
    load();
  };

  const remove = async (p: DbProduct) => {
    if (!confirm(`Apagar "${p.name}"? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(`Erro ao apagar: ${error.message}`);
    else {
      toast.success("Produto apagado.");
      load();
    }
  };

  if (loading) {
    return <div className="container-store py-20 text-center text-muted-foreground">Carregando…</div>;
  }

  if (!session) {
    return (
      <div className="container-store max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Área restrita</h1>
        <p className="mt-2 text-sm text-muted-foreground">Entre com a sua conta para acessar o painel.</p>
        <Link to="/auth" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Entrar
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-store max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A conta <b>{session.user.email}</b> é de cliente. Só o administrador da loja pode editar produtos.
        </p>
        <Link to="/" className="mt-6 inline-block rounded-full border border-border px-6 py-3 text-sm font-medium">
          Voltar à loja
        </Link>
      </div>
    );
  }

  return (
    <div className="container-store py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold">Painel de administração</h1>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">{products.length} produtos</span>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </div>

      {loadError && (
        <div className="mt-6 rounded-2xl border border-promo/40 bg-promo/10 p-4 text-sm">
          <b>O banco ainda não está pronto.</b> Rode o arquivo <code>supabase/setup.sql</code> no SQL Editor do Supabase e recarregue esta página.
          <div className="mt-1 text-xs text-muted-foreground">Detalhe técnico: {loadError}</div>
        </div>
      )}

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto…" aria-label="Buscar produto"
          className="h-11 w-full rounded-full border border-input bg-secondary pl-11 pr-4 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Preço</th>
              <th className="px-4 py-3 text-right">Promo</th>
              <th className="px-4 py-3 text-right">Estoque</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-xs text-muted-foreground">sem foto</div>
                    )}
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.brand}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                <td className="px-4 py-3 text-right font-medium">{formatBRL(p.price)}</td>
                <td className="px-4 py-3 text-right text-promo">{p.sale_price ? formatBRL(p.sale_price) : "—"}</td>
                <td className={`px-4 py-3 text-right ${p.stock === 0 ? "font-semibold text-promo" : ""}`}>{p.stock}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing({ ...p })} aria-label={`Editar ${p.name}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(p)} aria-label={`Apagar ${p.name}`} className="grid h-9 w-9 place-items-center rounded-full text-promo hover:bg-secondary">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loadError && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhum produto encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Editar produto">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-background p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{editing.id ? "Editar produto" : "Novo produto"}</h2>
              <button onClick={() => setEditing(null)} aria-label="Fechar" className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <Field label="Nome">
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Preço (R$)">
                  <input type="number" step="0.01" min="0" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className={inputCls} />
                </Field>
                <Field label="Preço promocional (opcional)">
                  <input type="number" step="0.01" min="0" value={editing.sale_price ?? ""} onChange={(e) => setEditing({ ...editing, sale_price: e.target.value ? Number(e.target.value) : null })} className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Estoque">
                  <input type="number" min="0" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} className={inputCls} />
                </Field>
                <Field label="Categoria">
                  <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inputCls}>
                    {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Marca">
                <input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Link da foto (cole o endereço da imagem)">
                <input value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://…" className={inputCls} />
              </Field>
              {editing.image_url && <img src={editing.image_url} alt="Prévia da foto" className="h-24 w-24 rounded-xl object-cover" />}
              <Field label="Descrição">
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className={inputCls} />
              </Field>
            </div>
            <button
              onClick={save} disabled={saving}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {saving ? "Salvando…" : "Salvar produto"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
