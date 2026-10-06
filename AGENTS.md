<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Catalog/payment access goes through `src/services/*` (mock today); swap implementations there to migrate to the backend without touching UI.
- Store name and commercial constants live in `src/config/store.ts`; never hardcode them in components.
- Cart/favorites state lives in `ShopProvider` (`src/lib/shop.tsx`), persisted to localStorage until accounts exist.
- AI product recommendations run server-side in `src/lib/recommend.server.ts` via Lovable AI Gateway, restricted to catalog IDs; the client only calls `recommend.functions.ts`.
- Supabase client lives in `src/integrations/supabase/client.ts` (URL + publishable key only); server secrets go in a local `.env` (see `.env.example`), never committed.
