import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type RecommendResult =
  | { ok: true; intro: string; items: { id: string; reason: string }[] }
  | { ok: false; error: string };

export const getRecommendations = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ query: z.string().trim().min(3).max(500) }).parse(data))
  .handler(async ({ data }): Promise<RecommendResult> => {
    const { recommendProducts, AiError } = await import("./recommend.server");
    try {
      const r = await recommendProducts(data.query);
      return { ok: true, ...r };
    } catch (e) {
      return { ok: false, error: e instanceof AiError ? e.message : "Erro inesperado." };
    }
  });
