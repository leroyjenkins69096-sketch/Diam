# Diamond Packs

Same logic as the Designer Distro / tripleseal Hydrogen storefronts (cart + bulk tiers, rep handoff, no on-site payment), new design. Local-first: no Shopify store is connected, so the app serves `app/data/shopify-products.json` (sample catalog, raw Storefront API shape). Don't read the values in `app/data/*.json` (sensitive) — keys only.

## Rules for this repo
- No git yet. Don't initialise one or push anything until asked. Anonymous: never use the user's real email; never add Claude as a co-author.
- No Shopify store exists yet. Data source switches in `app/lib/shopify-config.ts` (`isShopifyConnected`): local sample data until `PUBLIC_STORE_DOMAIN` + a Storefront token are in `.env`. See `SHOPIFY_SETUP.md`.

## Dev
`npm run dev` (port auto-increments if taken), `npm run typecheck`, `npm run build`.

## Design
Source: claude.ai/design project `bf0a9e2b-355c-453f-ae0f-d780e24f50af` (`Diamond Packs Storefront.dc.html` is the real design; "Preview" just frames it at desktop / phone).
- Icy dark theme, square edges, fonts Unbounded / Manrope / Share Tech Mono. Tokens: CSS vars in `app/styles/app.css`, constants in `app/lib/theme.ts`.
- Shell (`root.tsx`): `SideNav` (desktop: logo, search, numbered nav, shelves, "On the scale" button) / `PhoneNav` (logo + search stick together, 4-tab bar), `CartDrawer` ("On the scale" + "Order copied" modal), `SiteFooter`. Layout switch is pure CSS (`.dp-side`, `.dp-phone`, `.dp-main`).
- Pages: Home (`_index`), The Case (`Rack.tsx`, backs `/menu` + `/menu/:category`), product (`/product/:handle`), Q&A (`/faq`).
- Shelves = `CATEGORIES` + colors (`app/lib/shelves.ts`), live counts from the root loader; empty shelves hidden.
- **Cards show one price: the highest available variant** (`topVariant` in theme.ts). No variant picker or bulk bar on cards; the product page lists every weight + bulk tiers (`BulkPricing.tsx`) and the bag shows live bulk progress (`getBulkProgress`).
- Price range (`PriceRange.tsx`): bounds = cheapest item's top price → priciest item's top price on the current shelf; resets when the shelf changes.
- Contact / hours / Linktree live in `app/data/brand.ts`.
- Images that 404 fall back to the design's conic art + gem (`SafeImg`).
