import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  Link,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
const favicon = '/logo.webp';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import {CartProvider} from '~/lib/cart-context';
import {SideNav} from '~/components/SideNav';
import {PhoneNav} from '~/components/PhoneNav';
import {BRAND} from '~/data/brand';
import {CartDrawer} from '~/components/CartDrawer';
import {getAllProducts} from '~/lib/shopify-products';
import {isShopifyConnected} from '~/lib/shopify-config';

export type RootLoader = typeof loader;

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

export function links() {
  return [
    {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
    {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' as const},
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Unbounded:wght@600;800&family=Manrope:wght@400;500;700;800&family=Share+Tech+Mono&display=swap',
    },
    {rel: 'preconnect', href: 'https://cdn.shopify.com'},
    {rel: 'preconnect', href: 'https://shop.app'},
    {rel: 'icon', type: 'image/webp', href: favicon},
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

const PRODUCT_TYPES_QUERY = `#graphql
  query ProductTypes {
    products(first: 250) {
      edges { node { productType publishedAt } }
    }
  }
`;

const GIVEAWAY_QUERY = `#graphql
  query GiveawayProduct {
    products(first: 5, query: "tag:giveaway", sortKey: UPDATED_AT, reverse: true) {
      edges { node { title handle tags } }
    }
  }
`;

async function loadCriticalData({context}: Route.LoaderArgs) {
  const {storefront, env} = context;
  const connected = isShopifyConnected(env);

  // Local mode: derive everything from the sample catalog, no Shopify calls.
  const [header, typesData, giveawayData] = connected
    ? await Promise.all([
        storefront.query(HEADER_QUERY, {
          cache: storefront.CacheLong(),
          variables: {headerMenuHandle: 'main-menu'},
        }),
        storefront.query(PRODUCT_TYPES_QUERY, {
          cache: storefront.CacheShort(),
        }),
        storefront.query(GIVEAWAY_QUERY, {
          cache: storefront.CacheShort(),
        }),
      ])
    : await getLocalRootData(context);

  const edges = (typesData as any).products.edges as {node: {productType: string; publishedAt: string}}[];

  // Count by lowercased productType
  const typeCounts: Record<string, number> = {};
  for (const {node} of edges) {
    const t = node.productType?.toLowerCase();
    if (t) typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  // Determine drop label: products published within last 30 hrs → "TODAY'S DROP", else "THIS WEEK'S DROP"
  const thirtyHrsAgo = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const hasRecentDrop = edges.some(({node}) => node.publishedAt >= thirtyHrsAgo);
  const hasWeekDrop = edges.some(({node}) => node.publishedAt >= sevenDaysAgo);
  const dropLabel = hasRecentDrop ? "TODAY'S DROP" : hasWeekDrop ? "THIS WEEK'S DROP" : null;

  const giveawayEdges = (giveawayData as any).products.edges as {node: {title: string; handle: string; tags: string[]}}[];
  const giveawayProduct = giveawayEdges[0]?.node ?? null;

  return {header, categoryCounts: {types: typeCounts, total: edges.length, dropLabel}, giveawayProduct};
}

async function getLocalRootData(context: Route.LoaderArgs['context']) {
  const products = await getAllProducts(context);
  return [
    null,
    {products: {edges: products.map((p) => ({node: {productType: p.productType, publishedAt: p.publishedAt}}))}},
    {products: {edges: [] as {node: {title: string; handle: string; tags: string[]}}[]}},
  ] as const;
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront, customerAccount, cart} = context;
  if (!isShopifyConnected(context.env)) {
    return {cart: Promise.resolve(null), isLoggedIn: Promise.resolve(false), footer: Promise.resolve(null)};
  }
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {footerMenuHandle: 'footer'},
    })
    .catch((error: Error) => {
      console.error(error);
      return null;
    });
  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={resetStyles} />
        <link rel="stylesheet" href={appStyles} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

const PAYMENTS = [
  {glyph: '$', label: 'Cash App', color: '#8ADCFF'},
  {glyph: 'Z', label: 'Zelle', color: '#5E8FB0'},
  {glyph: '₿', label: 'Crypto', color: '#C9D8E6'},
  {glyph: '◈', label: 'CTM', color: '#8ADCFF'},
  {glyph: '✉', label: 'Money Order', color: '#E6EEF5'},
];

function SiteFooter() {
  return (
    <footer style={{
      marginTop: 'clamp(56px, 7vw, 88px)', background: 'var(--panel)', borderTop: '1px solid var(--border)',
      padding: 'clamp(32px, 4vw, 48px) clamp(16px, 4vw, 56px)', display: 'flex', flexDirection: 'column', gap: 22,
    }}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap'}}>
        <img src="/logo.webp" alt="Diamond Packs" style={{width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 1.5px var(--accent)'}} />
        <span style={{fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px, 3vw, 34px)', letterSpacing: '-0.02em'}}>DIAMOND PACKS</span>
      </div>
      <div style={{fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.06em', color: 'var(--fg-muted)'}}>
        {BRAND.contact.label.toUpperCase()}:{' '}
        <a href={BRAND.contact.url} target="_blank" rel="noopener noreferrer">{BRAND.contact.display}</a> · HOURS: {BRAND.hours}
      </div>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
        {PAYMENTS.map((p) => (
          <span key={p.label} style={{
            display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 12px', border: '1px solid rgba(160,220,255,0.16)',
            background: 'var(--card)', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em',
          }}>
            <span style={{fontFamily: 'var(--font-mono)', fontSize: 15, color: p.color}}>{p.glyph}</span>
            {p.label}
          </span>
        ))}
      </div>
      <div style={{fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', color: '#8D9BB0'}}>
        NO PAYMENT PROCESSED ON-SITE · ORDERS HANDLED BY YOUR REP
      </div>
    </footer>
  );
}

function Shell() {
  return (
    <>
      <SideNav />
      <PhoneNav />
      <div className="dp-main">
        <Outlet />
        <SiteFooter />
      </div>
      <CartDrawer />
    </>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data) {
    return (
      <CartProvider>
        <Shell />
      </CartProvider>
    );
  }

  return (
    <Analytics.Provider cart={data.cart} shop={data.shop} consent={data.consent}>
      <CartProvider>
        <Shell />
      </CartProvider>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div style={{padding: 80, textAlign: 'center', fontFamily: 'Archivo Black, sans-serif'}}>
      <h1 style={{fontSize: 48}}>{errorStatus}</h1>
      <p style={{fontFamily: 'Inter, sans-serif', color: 'var(--fg-muted)'}}>{errorMessage}</p>
    </div>
  );
}
