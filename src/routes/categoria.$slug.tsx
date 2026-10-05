import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { catalog } from "@/services/catalog";
import { Catalog } from "@/components/store/Catalog";
import { STORE } from "@/config/store";

export const Route = createFileRoute("/categoria/$slug")({
  loader: ({ params }) => {
    const category = catalog.category(params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: `Categoria não encontrada — ${STORE.name}` }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.category.name} — ${STORE.name}`;
    const d = `Compre ${loaderData.category.name.toLowerCase()} com até ${STORE.maxInstallments}x sem juros e 5% off no Pix na ${STORE.name}.`;
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const products = catalog.all().filter((p) => p.category === category.slug);
  return (
    <div className="container-store py-8">
      <nav aria-label="Trilha" className="mb-4 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link> / <span className="text-foreground">{category.name}</span>
      </nav>
      <h1 className="mb-8 text-3xl font-bold md:text-4xl">{category.name}</h1>
      <Catalog key={category.slug} products={products} subs={category.subcategories} />
    </div>
  );
}
