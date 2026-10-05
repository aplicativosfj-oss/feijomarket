import { createFileRoute, notFound } from "@tanstack/react-router";
import { PAGES } from "@/data/pages";
import { STORE } from "@/config/store";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/pagina/$slug")({
  loader: ({ params }) => {
    const page = PAGES[params.slug];
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Página não encontrada" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.page.title} — ${STORE.name}`;
    return { meta: [{ title: t }, { name: "description", content: loaderData.page.description }, { property: "og:title", content: t }, { property: "og:description", content: loaderData.page.description }] };
  },
  component: InstitutionalPage,
});

function InstitutionalPage() {
  const { page } = Route.useLoaderData();
  return (
    <div className="container-store max-w-3xl py-12">
      <h1 className="mb-3 text-4xl font-bold">{page.title}</h1>
      <p className="mb-10 text-muted-foreground">{page.description}</p>
      {page.faq ? (
        <Accordion type="single" collapsible>
          {page.sections.map((s, i) => (
            <AccordionItem key={i} value={String(i)}>
              <AccordionTrigger className="text-left">{s.heading}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{s.body}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="space-y-6">
          {page.sections.map((s, i) => (
            <section key={i}>
              {s.heading && <h2 className="mb-2 text-xl font-semibold">{s.heading}</h2>}
              <p className="leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
