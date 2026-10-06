/**
 * Cliente Supabase do navegador. Usa apenas a URL do projeto e a chave
 * publicável (pública por design; o acesso é controlado por RLS no banco).
 * Nunca coloque aqui a chave secreta / service_role.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://cclnxqtjimxlajsvatdf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_pFymjifnl0_GscpMgwqeOQ_djTcBZcZ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
