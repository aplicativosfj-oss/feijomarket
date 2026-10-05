import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useShop } from "@/lib/shop";
import { catalog } from "@/services/catalog";
import { ProductGrid } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { STORE } from "@/config/store";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: `Meus favoritos — ${STORE.name}` },
      { name: "description", content: "Produtos que você salvou para depois." },
      { property: "og:title", content: `Favoritos — ${STORE.name}` },
      { property: "og:description", content: "Sua lista de desejos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { favorites } = useShop();
  const products = catalog.all().filter((p) => favorites.includes(p.id));
  return (
    <div className="container-store py-8">
      <h1 className="mb-8 text-3xl font-bold">Meus favoritos</h1>
      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Heart className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Você ainda não salvou nenhum produto.</p>
          <Button asChild><Link to="/">Explorar produtos</Link></Button>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
