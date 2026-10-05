import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { STORE } from "@/config/store";
import { Button } from "@/components/ui/button";

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(`Olá! Vim pelo site da ${STORE.name}.`)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-glow transition hover:scale-110"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(!localStorage.getItem("franc-cookies")), []);
  if (!show) return null;
  const close = (v: string) => {
    localStorage.setItem("franc-cookies", v);
    setShow(false);
  };
  return (
    <div role="dialog" aria-label="Aviso de cookies" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-card animate-fade-up md:right-24">
      <p className="text-sm text-muted-foreground">
        Usamos cookies para melhorar sua experiência, conforme a LGPD. Saiba mais na nossa{" "}
        <Link to="/pagina/$slug" params={{ slug: "privacidade" }} className="font-semibold text-foreground underline">Política de Privacidade</Link>.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => close("all")}>Aceitar</Button>
        <Button size="sm" variant="outline" onClick={() => close("essential")}>Apenas essenciais</Button>
      </div>
    </div>
  );
}
