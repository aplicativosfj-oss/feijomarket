/**
 * Sessão e papel do usuário logado (cliente ou admin).
 * Lê a sessão do Supabase no navegador e consulta o papel via has_role.
 */
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ session: null, isAdmin: false, loading: true });

  useEffect(() => {
    let active = true;

    const loadRole = async (session: Session | null) => {
      if (!active) return;
      if (!session) {
        setState({ session: null, isAdmin: false, loading: false });
        return;
      }
      const { data } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      if (active) setState({ session, isAdmin: data === true, loading: false });
    };

    supabase.auth.getSession().then(({ data }) => loadRole(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => loadRole(session));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
