import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderTree, Package, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { STORE } from "@/config/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminOrders } from "@/components/admin/AdminOrders";

const TABS = ["produtos", "categorias", "pedidos"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/admin")({
  validateSearch: (s: Record<string, unknown>): { aba?: Tab } =>
    TABS.includes(s.aba as Tab) ? { aba: s.aba as Tab } : {},
  head: () => ({
    meta: [
      { title: `Administração — ${STORE.name}` },
      {
        name: "description",
        content: "Painel de administração da loja: produtos, categorias e pedidos.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { session, isAdmin, loading } = useAuth();
  const { aba = "produtos" } = Route.useSearch();
  const navigate = Route.useNavigate();

  if (loading) {
    return (
      <div className="container-store py-20 text-center text-muted-foreground">Carregando…</div>
    );
  }

  if (!session) {
    return (
      <div className="container-store max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Área restrita</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre com a sua conta para acessar o painel.
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
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
          A conta <b>{session.user.email}</b> é de cliente. Só o administrador da loja acessa o
          painel.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full border border-border px-6 py-3 text-sm font-medium"
        >
          Voltar à loja
        </Link>
      </div>
    );
  }

  return (
    <div className="container-store py-10">
      <h1 className="font-display text-2xl font-bold">Painel de administração</h1>
      <Tabs
        value={aba}
        onValueChange={(v) => navigate({ search: { aba: v as Tab }, replace: true })}
        className="mt-6"
      >
        <TabsList className="h-11 rounded-full p-1">
          <TabsTrigger value="produtos" className="gap-2 rounded-full px-4">
            <Package className="h-4 w-4" /> Produtos
          </TabsTrigger>
          <TabsTrigger value="categorias" className="gap-2 rounded-full px-4">
            <FolderTree className="h-4 w-4" /> Categorias
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-2 rounded-full px-4">
            <ShoppingBag className="h-4 w-4" /> Pedidos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="produtos" className="mt-6">
          <AdminProducts />
        </TabsContent>
        <TabsContent value="categorias" className="mt-6">
          <AdminCategories />
        </TabsContent>
        <TabsContent value="pedidos" className="mt-6">
          <AdminOrders />
        </TabsContent>
      </Tabs>
    </div>
  );
}
