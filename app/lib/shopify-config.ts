/**
 * Single switch between local sample data and a real Shopify store.
 *
 * Local mode  → no store credentials in .env. Products come from
 *               app/data/shopify-products.json, no network calls to Shopify.
 * Shopify mode → PUBLIC_STORE_DOMAIN + a Storefront API token are set
 *               (via .env or `npx shopify hydrogen link`). Nothing else to change.
 */
export function isShopifyConnected(env: Partial<Env> | undefined): boolean {
  const domain = env?.PUBLIC_STORE_DOMAIN;
  const token = env?.PUBLIC_STOREFRONT_API_TOKEN || env?.PRIVATE_STOREFRONT_API_TOKEN;
  return Boolean(domain && token && domain !== 'mock.shop');
}

/**
 * Fills in harmless placeholders so Hydrogen's context can boot without a store.
 * Real values always win.
 */
export function withLocalEnvDefaults(env: Env): Env {
  if (isShopifyConnected(env)) return env;
  return {
    ...env,
    SESSION_SECRET: env.SESSION_SECRET || 'local-dev-session-secret',
    PUBLIC_STORE_DOMAIN: env.PUBLIC_STORE_DOMAIN || 'mock.shop',
    PUBLIC_STOREFRONT_ID: env.PUBLIC_STOREFRONT_ID || 'local',
    PUBLIC_STOREFRONT_API_TOKEN: env.PUBLIC_STOREFRONT_API_TOKEN || 'local',
    PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID || 'local',
    SHOP_ID: env.SHOP_ID || 'local',
  };
}
