import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { STORE } from "@/config/store";
import { ShopProvider } from "@/lib/shop";
import { SiteHeader } from "@/components/store/SiteHeader";
import { SiteFooter } from "@/components/store/SiteFooter";
import { CartDrawer } from "@/components/store/CartDrawer";
import { CookieBanner, WhatsAppButton } from "@/components/store/Floating";
import { Toaster } from "@/components/ui/sonner";
import { useCatalogSync } from "@/lib/catalog-sync";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Depois de publicar uma versão nova, abas abertas antes tentam baixar arquivos que não existem mais. */
const isStaleChunkError = (error: unknown) =>
  /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(
    error instanceof Error ? error.message : String(error),
  );
const RELOAD_KEY = "fm:stale-reload";

/** Recarrega a página uma vez (no máximo a cada 10 s) para pegar a versão nova do site. */
function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 10_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // sem sessionStorage: recarrega mesmo assim
  }
  window.location.reload();
  return true;
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const stale = isStaleChunkError(error);
  useEffect(() => {
    if (stale && reloadForNewVersion()) return;
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error, stale]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {stale ? "O site foi atualizado" : "Esta página não carregou"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {stale
            ? "Recarregue a página para abrir a versão mais nova."
            : "Algo deu errado do nosso lado. Tente recarregar ou volte ao início."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              if (stale) {
                window.location.reload();
                return;
              }
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {stale ? "Recarregar" : "Tentar de novo"}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: STORE.name },
      { name: "description", content: "Suplementos, moda fitness, papelaria, tênis e eletrônicos com frete grátis e 5% off no Pix." },
      { property: "og:site_name", content: STORE.name },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
          ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // Quando o catálogo do banco chega, a versão muda e a vitrine é redesenhada com ele.
  const catalogVersion = useCatalogSync();

  // Falha ao pré-carregar um arquivo de versão antiga: recarrega antes de quebrar a página.
  useEffect(() => {
    const onPreloadError = (e: Event) => {
      if (reloadForNewVersion()) e.preventDefault();
    };
    window.addEventListener("vite:preloadError", onPreloadError);
    return () => window.removeEventListener("vite:preloadError", onPreloadError);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <ShopProvider>
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Pular para o conteúdo</a>
        <SiteHeader key={`h${catalogVersion}`} />
        <main id="conteudo" className="min-h-[60vh]" key={`m${catalogVersion}`}>
          <Outlet />
        </main>
        <SiteFooter />
        <CartDrawer />
        <WhatsAppButton />
        <CookieBanner />
        <Toaster position="top-center" />
      </ShopProvider>
    </QueryClientProvider>
  );
}
