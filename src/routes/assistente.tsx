import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { PRODUCTS } from "@/data/products";
import { STORE } from "@/config/store";
import { getRecommendations, type RecommendResult } from "@/lib/recommend.functions";

const EXAMPLES = [
  "Kit para começar a treinar com até R$ 400",
  "Material escolar para faculdade em 2027",
  "Presente para uma amiga que faz yoga",
  "Legging confortável para o frio",
];

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: `Assistente de compras com IA — ${STORE.name}` },
      { name: "description", content: `Descreva o que procura e receba recomendações personalizadas do catálogo da ${STORE.name}.` },
      { property: "og:title", content: `Assistente de compras com IA — ${STORE.name}` },
      { property: "og:description", content: "Conte o que você precisa e a IA indica os produtos ideais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  const [query, setQuery] = useState("");
  const fn = useServerFn(getRecommendations);
  const m = useMutation<RecommendResult, Error, string>({ mutationFn: (q) => fn({ data: { query: q } }) });

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (query.trim().length >= 3 && !m.isPending) m.mutate(query.trim());
  };
  const data = m.data;

  return (
    <div className="container-store py-10">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
          <Sparkles className="h-4 w-4" aria-hidden /> Recomendações com IA
        </span>
        <h1 className="mt-4 text-3xl font-bold md:text-4xl">O que você está procurando?</h1>
        <p className="mt-2 text-muted-foreground">Descreva com suas palavras — ocasião, orçamento, estilo — e indicamos os produtos certos.</p>
        <form onSubmit={submit} className="mt-6 space-y-3 text-left">
          <Textarea
            aria-label="Descreva o que você procura"
            value={query}
            maxLength={500}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Ex.: quero montar um kit para começar na academia gastando até R$ 300"
            className="min-h-24"
          />
          <div className="flex flex-wrap items-center gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => setQuery(ex)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:border-accent hover:text-foreground">
                {ex}
              </button>
            ))}
            <Button type="submit" className="ml-auto" disabled={m.isPending || query.trim().length < 3}>
              {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Recomendar
            </Button>
          </div>
        </form>
      </div>

      <section className="mt-10" aria-live="polite">
        {m.isPending && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={`s${i}`} />)}
          </div>
        )}
        {m.isError && <p className="text-center text-destructive">Não foi possível gerar recomendações agora.</p>}
        {data && !data.ok && <p className="text-center text-destructive">{data.error}</p>}
        {data?.ok && (
          <>
            <p className="mb-6 text-center text-lg">{data.intro}</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {data.items.map(({ id, reason }) => {
                const p = PRODUCTS.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex flex-col gap-2">
                    <ProductCard product={p} />
                    <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{reason}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
