import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";
import { PRODUCTS } from "@/data/products";
import { createLovableAiGatewayRunIdFetch } from "./ai-run-id.server";

const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export const recommendationSchema = z.object({
  intro: z.string(),
  items: z.array(z.object({ id: z.string(), reason: z.string() })),
});
export type Recommendation = z.infer<typeof recommendationSchema>;

export class AiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Compact catalog listing so the model only picks real products. */
function catalogText(): string {
  return PRODUCTS.map(
    (p) => `${p.id}|${p.name}|${p.category}/${p.subcategory}|${p.brand}|R$${(p.salePrice ?? p.price).toFixed(2)}|${p.stock > 0 ? "em estoque" : "esgotado"}`,
  ).join("\n");
}

export async function recommendProducts(query: string): Promise<Recommendation> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("Recurso de IA não configurado.", 401);

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  try {
    const result = streamText({
      model: provider.responses(MODEL),
      output: Output.object({ schema: recommendationSchema }),
      instructions:
        "Você é o assistente de compras de uma loja online brasileira. Com base no pedido do cliente, escolha de 3 a 6 produtos do catálogo abaixo (use somente IDs existentes, priorize itens em estoque e respeite orçamento citado). Responda em português do Brasil: 'intro' com 1 frase curta e, para cada item, 'reason' com no máximo 20 palavras. Se nada combinar, retorne items vazio e explique em 'intro'.\n\nCATÁLOGO (id|nome|categoria|marca|preço|estoque):\n" +
        catalogText(),
      messages: [{ role: "user", content: query }],
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const out = await result.output;
    const valid = new Set(PRODUCTS.map((p) => p.id));
    return { intro: out.intro, items: out.items.filter((i) => valid.has(i.id)).slice(0, 6) };
  } catch (e: unknown) {
    const status = (e as { statusCode?: number }).statusCode ?? 500;
    if (status === 429) throw new AiError("Muitas buscas agora. Tente novamente em instantes.", 429);
    if (status === 402) throw new AiError("Créditos de IA esgotados. Tente mais tarde.", 402);
    console.error("recommend failed", e);
    throw new AiError("Não foi possível gerar recomendações agora.", status);
  }
}
