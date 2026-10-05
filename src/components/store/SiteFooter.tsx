import { Link } from "@tanstack/react-router";
import { STORE } from "@/config/store";
import { catalog } from "@/services/catalog";
import { PAGES } from "@/data/pages";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-surface-dark text-surface-dark-foreground">
      <div className="container-store grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-3">
          <div className="font-display text-2xl font-extrabold">
            {STORE.name}
            <span className="text-accent">.</span>
          </div>
          <p className="text-sm opacity-70">{STORE.tagline}</p>
          <p className="text-sm opacity-70">{STORE.email}</p>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold">Categorias</h3>
          <ul className="space-y-2 text-sm opacity-70">
            {catalog.categories().map((c) => (
              <li key={c.slug}>
                <Link to="/categoria/$slug" params={{ slug: c.slug }} className="hover:text-accent">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold">Institucional</h3>
          <ul className="space-y-2 text-sm opacity-70">
            {Object.entries(PAGES).map(([slug, p]) => (
              <li key={slug}>
                <Link to="/pagina/$slug" params={{ slug }} className="hover:text-accent">{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-semibold">Formas de pagamento</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {["Pix", "Visa", "Mastercard", "Elo", "Amex", "Boleto"].map((m) => (
              <span key={m} className="rounded-md border border-surface-dark-foreground/20 px-2.5 py-1">{m}</span>
            ))}
          </div>
          <p className="mt-4 text-xs opacity-60">Compra 100% segura · Site protegido com SSL</p>
        </div>
      </div>
      <div className="border-t border-surface-dark-foreground/10 py-5 text-center text-xs opacity-60">
        © {new Date().getFullYear()} {STORE.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
