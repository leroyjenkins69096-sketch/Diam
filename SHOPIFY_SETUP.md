# Shopify setup (when the account exists)

## How the app decides where data comes from

`app/lib/shopify-config.ts → isShopifyConnected(env)` is the single switch.

| State | Condition | Data |
|---|---|---|
| **Local** (now) | `PUBLIC_STORE_DOMAIN` or storefront token missing | `app/data/shopify-products.json` (raw Storefront API shape, `publishedAt` shifted so drops look fresh). Menu/footer/giveaway queries and customer account are skipped. |
| **Shopify** | `PUBLIC_STORE_DOMAIN` + `PUBLIC_STOREFRONT_API_TOKEN` (or private token) set | Live Storefront API. Nothing else to change. |

Local placeholders (session secret, fake IDs) come from `withLocalEnvDefaults`; real values always win.

## Run locally now

```bash
npm install
npm run dev        # picks the first free port from 3000, check the terminal
```

## Connect Shopify (once you have a store)

1. Create the store, then in Admin → Sales channels → **Hydrogen** (install it), create a storefront.
2. Either:
   - `npx shopify hydrogen link` then `npm run dev` (pulls env vars automatically), **or**
   - copy `.env.example` → `.env` and fill `PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_API_TOKEN`, `PRIVATE_STOREFRONT_API_TOKEN`, `PUBLIC_STOREFRONT_ID`, `SESSION_SECRET`.
3. Customer Account API (only for `/account`): fill `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID`, `PUBLIC_CUSTOMER_ACCOUNT_API_URL`, `SHOP_ID`, and use a public tunnel domain (`npx shopify hydrogen dev --customer-account-push`).
4. `npm run codegen` to regenerate `storefrontapi.generated.d.ts` against the real store.
5. Import products. Data contract the UI relies on:
   - `productType` → category (see `CATEGORIES` in `app/data/products.ts`)
   - tags: `strain:`, `grade:`, `badge:`, `nose:`, `effects:`, `short:`, `giveaway`
   - variants titled `P`, `QP`, etc. drive bulk pricing (`app/lib/cart-context.tsx`)
   - navigation menus with handles `main-menu` and `footer`
6. Deploy: link to Oxygen (`npx shopify hydrogen deploy`) and add a `.github/workflows` deployment if wanted.

## Known leftovers (inherited from tripleseal, not regressions)
- `/cart` route throws `useAside` error (unused Hydrogen template route; cart is the drawer).
- 8 TS errors from template files (`PaginatedResourceSection`, `SearchForm`, `ProductItem`, `CategoryStrip`, `cart-context` JSON parse).
