import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { catalog } from "@/services/catalog";
import { Catalog } from "@/components/store/Catalog";
import { STORE } from "@/config/store";

export const Route = createFileRoute("/busca")({
  validateSearch: z.object({ q: z.string().catch(""), ofertas: z.boolean().optional() }),
  head: () => ({
    meta: [
      { title: `Buscar produtos — ${STORE.name}` },
      { name: "description", content: `Encontre suplementos, roupas, tênis, eletrônicos e mais na ${STORE.name}.` },
      { property: "og:title", content: `Buscar produtos — ${STORE.name}` },
      { property: "og:description", content: `Busque entre centenas de ofertas na ${STORE.name}.` },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, ofertas } = Route.useSearch();
  const products = ofertas ? catalog.all().filter((p) => p.salePrice) : q ? catalog.search(q, 200) : catalog.all();
  return (
    <div className="container-store py-8">
      <h1 className="mb-8 text-3xl font-bold md:text-4xl">
        {ofertas ? "Ofertas" : q ? <>Resultados para “{q}”</> : "Todos os produtos"}
      </h1>
      <Catalog key={`${q}-${ofertas}`} products={products} />
    </div>
  );
}
