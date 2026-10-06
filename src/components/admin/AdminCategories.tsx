import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Field, Modal, inputCls, slugify } from "./shared";

export interface DbCategory {
  slug: string;
  name: string;
  subcategories: string[];
  image_url: string;
  sort_order: number;
}

export function useDbCategories() {
  const [cats, setCats] = useState<DbCategory[]>([]);
  const reload = async () => {
    const { data, error } = await supabase.from("categories").select("slug, name, subcategories, image_url, sort_order").order("sort_order");
    if (error) toast.error(`Erro ao carregar categorias: ${error.message}`);
    else setCats(data ?? []);
  };
  useEffect(() => {
    void reload();
  }, []);
  return { cats, reload };
}

export function AdminCategories() {
  const { cats, reload } = useDbCategories();
  const [editing, setEditing] = useState<(DbCategory & { isNew: boolean; subsText: string }) | null>(null);

  const save = async () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) { toast.error("Informe o nome da categoria."); return; }
    const row = {
      slug: editing.isNew ? slugify(name) : editing.slug,
      name,
      subcategories: editing.subsText.split(",").map((s) => s.trim()).filter(Boolean),
      image_url: editing.image_url.trim(),
      sort_order: editing.sort_order,
    };
    const { error } = await supabase.from("categories").upsert(row);
    if (error) { toast.error(`Erro ao salvar: ${error.message}`); return; }
    toast.success("Categoria salva!");
    setEditing(null);
    void reload();
  };

  const remove = async (c: DbCategory) => {
    if (!confirm(`Apagar a categoria "${c.name}"? Os produtos dela continuam salvos.`)) return;
    const { error } = await supabase.from("categories").delete().eq("slug", c.slug);
    if (error) { toast.error(`Erro ao apagar: ${error.message}`); return; }
    toast.success("Categoria apagada.");
    void reload();
  };

  return (
    <div>
      <button
        onClick={() => setEditing({ slug: "", name: "", subcategories: [], image_url: "", sort_order: cats.length + 1, isNew: true, subsText: "" })}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        <Plus className="h-4 w-4" /> Nova categoria
      </button>
      <ul className="mt-6 grid gap-3 md:grid-cols-2">
        {cats.map((c) => (
          <li key={c.slug} className="rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <b>{c.name}</b>
              <div className="flex gap-1">
                <button aria-label={`Editar ${c.name}`} onClick={() => setEditing({ ...c, isNew: false, subsText: c.subcategories.join(", ") })} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                <button aria-label={`Apagar ${c.name}`} onClick={() => remove(c)} className="grid h-9 w-9 place-items-center rounded-full text-promo hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{c.subcategories.join(" · ") || "Sem subcategorias"}</p>
          </li>
        ))}
      </ul>
      {editing && (
        <Modal title={editing.isNew ? "Nova categoria" : "Editar categoria"} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field label="Nome"><input className={inputCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Subcategorias (separe por vírgula)">
              <textarea rows={3} className={inputCls + " h-auto py-2"} value={editing.subsText} onChange={(e) => setEditing({ ...editing, subsText: e.target.value })} />
            </Field>
            <Field label="Ordem no menu"><input type="number" className={inputCls} value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
            <button onClick={save} className="h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground">Salvar categoria</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
