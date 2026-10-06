import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CreditCard, QrCode, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import hero from "@/assets/hero.jpg";
import { STORE } from "@/config/store";
import { catalog } from "@/services/catalog";
import { ProductGrid } from "@/components/store/ProductCard";
import { Countdown, Stars } from "@/components/store/bits";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${STORE.name} — Suplementos, moda fitness, tênis e eletrônicos` },
      { name: "description", content: `${STORE.tagline}. Frete grátis acima de R$ 299, 5% off no Pix e até 10x sem juros.` },
      { property: "og:title", content: `${STORE.name} — ${STORE.tagline}` },
      { property: "og:description", content: "Suplementos, roupas, calçados, eletrônicos e mais com ofertas todos os dias." },
    ],
  }),
  component: Home,
});

const SLIDES = [
  { kicker: "Semana da Performance", title: "Até 40% off em suplementos", cta: "Comprar agora", to: "/categoria/$slug" as const, slug: "suplementos" },
  { kicker: "Lançamentos", title: "Tênis de corrida da nova temporada", cta: "Ver tênis", to: "/categoria/$slug" as const, slug: "calcados" },
  { kicker: "Tecnologia", title: "Fones e smartwatches com 10x sem juros", cta: "Ver eletrônicos", to: "/categoria/$slug" as const, slug: "eletronicos" },
];

const BENEFITS = [
  { icon: Truck, title: "Entrega grátis em Feijó", text: `Acima de ${formatBRL(STORE.freeShippingFrom)}` },
  { icon: QrCode, title: "5% off no Pix", text: "Aprovação imediata" },
  { icon: CreditCard, title: "Até 10x sem juros", text: "Em todos os cartões" },
  { icon: ShieldCheck, title: "Compra segura", text: "Dados protegidos" },
];

const TESTIMONIALS = [
  { name: "Mariana C.", text: "Entrega super rápida e o whey chegou certinho. Já virei cliente fiel!", rating: 5 },
  { name: "Rafael A.", text: "Comprei o fone ANC com desconto no Pix. Atendimento impecável pelo WhatsApp.", rating: 5 },
  { name: "Juliana P.", text: "A legging é perfeita, tecido de qualidade. Troquei o tamanho sem burocracia.", rating: 4 },
];

function Section({ title, link, children, aside }: { title: string; link?: { label: string; search?: Record<string, unknown> }; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="container-store mt-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        {aside}
        {link && (
          <Link to="/busca" search={{ q: "", ...link.search }} className="flex items-center gap-1 text-sm font-semibold hover:text-accent">
            {link.label} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  return (
    <section className="container-store mt-24">
      <div className="relative overflow-hidden rounded-3xl bg-surface-dark p-8 text-surface-dark-foreground md:p-14">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold">Ganhe 10% na primeira compra</h2>
          <p className="mt-2 opacity-70">Receba ofertas exclusivas e lançamentos antes de todo mundo.</p>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\S+@\S+\.\S+$/.test(email)) return void toast.error("Digite um e-mail válido");
              toast.success("Inscrição confirmada!", { description: "Use o cupom BEMVINDO10." });
              setEmail("");
            }}
          >
            <label htmlFor="nl" className="sr-only">Seu e-mail</label>
            <input id="nl" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="h-12 flex-1 rounded-full bg-surface-dark-foreground/10 px-5 text-sm outline-none placeholder:text-surface-dark-foreground/50 focus:ring-2 focus:ring-accent" />
            <Button type="submit" variant="accent" size="lg">Quero desconto</Button>
          </form>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
      </div>
    </section>
  );
}

function Home() {
  const cats = catalog.categories();
  return (
    <>
      <section className="container-store pt-4 md:pt-6">
        <Carousel opts={{ loop: true }} className="overflow-hidden rounded-3xl">
          <CarouselContent className="-ml-0">
            {SLIDES.map((s, i) => (
              <CarouselItem key={i} className="pl-0">
                <div className="relative h-[440px] bg-surface-dark md:h-[520px]">
                  <img src={hero} alt="" width={1600} height={800} className="absolute inset-0 h-full w-full object-cover object-[70%_center]" fetchPriority={i === 0 ? "high" : "auto"} />
                  <div className="absolute inset-0 bg-hero-fade" />
                  <div className="relative flex h-full max-w-xl flex-col justify-center gap-5 p-8 text-surface-dark-foreground md:p-16">
                    <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">{s.kicker}</span>
                    <h1 className="text-4xl font-extrabold leading-[1.05] md:text-6xl">{s.title}</h1>
                    <Button variant="hero" size="lg" className="w-fit" asChild>
                      <Link to={s.to} params={{ slug: s.slug }}>{s.cta} <ArrowRight /></Link>
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 hidden md:flex" />
          <CarouselNext className="right-4 hidden md:flex" />
        </Carousel>
      </section>

      <section className="container-store mt-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><b.icon className="h-5 w-5" /></div>
              <div>
                <div className="text-sm font-semibold">{b.title}</div>
                <div className="text-xs text-muted-foreground">{b.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Section title="Compre por categoria">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {cats.map((c) => (
            <Link key={c.slug} to="/categoria/$slug" params={{ slug: c.slug }} className="group text-center">
              <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
                <img src={c.image} alt="" loading="lazy" width={300} height={300} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
              <div className="mt-2 text-sm font-semibold group-hover:text-accent">{c.name}</div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Ofertas do dia" link={{ label: "Ver todas", search: { ofertas: true } }} aside={<Countdown />}>
        <ProductGrid products={catalog.byTag("deal", 4)} />
      </Section>

      <Section title="Mais vendidos" link={{ label: "Ver todos" }}>
        <ProductGrid products={catalog.byTag("bestseller", 8)} />
      </Section>

      <Section title="Lançamentos">
        <ProductGrid products={catalog.byTag("new", 4)} />
      </Section>

      <section className="container-store mt-20">
        <div className="flex flex-col gap-6 rounded-3xl bg-accent-soft p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Volta às aulas 2027</span>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Papelaria completa para o ano letivo</h2>
            <p className="mt-2 text-muted-foreground">Cadernos, planners 2027, canetas, mochilas e kits prontos com até 20% off.</p>
          </div>
          <Button variant="accent" size="lg" asChild><Link to="/categoria/$slug" params={{ slug: "papelaria" }}>Ver papelaria <ArrowRight /></Link></Button>
        </div>
        <div className="mt-8"><ProductGrid products={catalog.all().filter((p) => p.category === "papelaria").slice(0, 4)} /></div>
      </section>

      <Section title="Marcas que você ama">
        <div className="flex flex-wrap justify-center gap-3">
          {catalog.brands().map((b) => (
            <Link key={b} to="/busca" search={{ q: b }} className="rounded-full border border-border px-5 py-2.5 font-display text-sm font-semibold text-muted-foreground transition hover:border-accent hover:text-foreground">
              {b}
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Quem compra, recomenda">
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-border bg-card p-6">
              <Stars rating={t.rating} />
              <blockquote className="mt-3 text-sm leading-relaxed">“{t.text}”</blockquote>
              <figcaption className="mt-4 text-sm font-semibold">{t.name}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Newsletter />
    </>
  );
}
