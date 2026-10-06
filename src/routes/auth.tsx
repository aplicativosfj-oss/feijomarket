import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { STORE } from "@/config/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Entrar ou criar conta — ${STORE.name}` },
      { name: "description", content: "Acesse sua conta na Feijó Market para acompanhar pedidos e comprar mais rápido." },
      { property: "og:title", content: `Entrar ou criar conta — ${STORE.name}` },
      { property: "og:description", content: "Acesse sua conta na Feijó Market." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Conta criada! Você já está logado.");
      }
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível entrar. Verifique os dados.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta.");
  };

  if (loading) {
    return <div className="container-store py-20 text-center text-muted-foreground">Carregando…</div>;
  }

  if (session) {
    return (
      <div className="container-store max-w-md py-16">
        <h1 className="font-display text-2xl font-bold">Minha conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Logado como <b className="text-foreground">{session.user.email}</b>
          {isAdmin && <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">administrador</span>}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {isAdmin && (
            <Link to="/admin" className="rounded-full bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Abrir painel de administração
            </Link>
          )}
          <Link to="/" className="rounded-full border border-border px-4 py-3 text-center text-sm font-medium hover:bg-secondary">
            Voltar à loja
          </Link>
          <button onClick={signOut} className="rounded-full border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary">
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-store max-w-md py-16">
      <h1 className="font-display text-2xl font-bold">{mode === "login" ? "Entrar na sua conta" : "Criar conta"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "login" ? "Acompanhe pedidos e compre mais rápido." : "Leva menos de um minuto."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">E-mail</label>
          <input
            id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-accent"
            placeholder="voce@email.com" autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">Senha</label>
          <input
            id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-accent"
            placeholder="Mínimo de 6 caracteres" autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>
        <button
          type="submit" disabled={busy}
          className="h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
        >
          {busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>
      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-4 w-full text-center text-sm font-medium text-accent hover:underline"
      >
        {mode === "login" ? "Ainda não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}
