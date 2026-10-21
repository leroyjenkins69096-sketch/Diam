#!/usr/bin/env node
/**
 * Uploads app/data/shopify-products.json to the linked Shopify store (no images).
 *
 *   npx shopify store auth --store <shop>.myshopify.com \
 *     --scopes read_products,write_products,read_publications,write_publications
 *   node scripts/import-sample-products.mjs --dry     # validate payloads, no writes
 *   node scripts/import-sample-products.mjs           # create products + publish to Hydrogen
 *
 * Safe to re-run: handles that already exist are skipped.
 */
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const DRY = process.argv.includes('--dry');
const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.split('=')[0], l.slice(l.indexOf('=') + 1).trim()]),
);
const STORE = env.PUBLIC_STORE_DOMAIN;
if (!STORE?.endsWith('.myshopify.com')) throw new Error('PUBLIC_STORE_DOMAIN missing/invalid in .env (run `shopify hydrogen env pull`).');

const tmp = mkdtempSync(join(tmpdir(), 'import-'));
function gql(query, variables = {}, mutate = false) {
  const qf = join(tmp, 'q.graphql'), vf = join(tmp, 'v.json'), of = join(tmp, 'out.json');
  writeFileSync(qf, query);
  writeFileSync(vf, JSON.stringify(variables));
  execFileSync('npx', ['shopify', 'store', 'execute', '--store', STORE, '--query-file', qf, '--variable-file', vf, '--output-file', of, ...(mutate ? ['--allow-mutations'] : [])], {stdio: ['ignore', 'ignore', 'inherit']});
  return JSON.parse(readFileSync(of, 'utf8'));
}

// ── build productSet input from the raw Storefront-shaped sample ─────────────
function toInput(p) {
  const variants = p.variants.edges.map((e) => e.node);
  const parts = variants.map((v) => v.title.split(' / '));
  const optCount = Math.max(...parts.map((x) => x.length));
  const single = variants.length === 1 && variants[0].title === 'Default Title';
  const names = single ? ['Title'] : optCount === 1 ? ['Weight'] : Array.from({length: optCount}, (_, i) => `Option ${i + 1}`);
  const valuesFor = (i) => [...new Set(parts.map((x) => x[i] ?? 'Default'))];
  return {
    title: p.title,
    handle: p.handle,
    descriptionHtml: p.descriptionHtml || '',
    productType: p.productType || '',
    tags: p.tags || [],
    status: 'ACTIVE',
    productOptions: names.map((name, i) => ({name, values: valuesFor(i).map((v) => ({name: v}))})),
    variants: variants.map((v, k) => ({
      optionValues: names.map((name, i) => ({optionName: name, name: parts[k][i] ?? 'Default'})),
      price: v.price.amount,
      // unavailable in the sample → tracked at 0 (sold out); otherwise always purchasable
      inventoryPolicy: 'DENY',
      inventoryItem: {tracked: !v.availableForSale},
    })),
  };
}

const raw = JSON.parse(readFileSync('app/data/shopify-products.json', 'utf8'));
const inputs = raw.map(toInput);
console.log(`${inputs.length} products prepared (${inputs.reduce((s, i) => s + i.variants.length, 0)} variants, 0 images)`);
if (DRY) process.exit(0);

// existing handles → skip
const existing = new Set();
let after = null;
for (;;) {
  const r = gql(`query($after:String){products(first:250,after:$after){nodes{handle} pageInfo{hasNextPage endCursor}}}`, {after});
  r.products.nodes.forEach((n) => existing.add(n.handle));
  if (!r.products.pageInfo.hasNextPage) break;
  after = r.products.pageInfo.endCursor;
}

// where to publish so the Storefront API (Hydrogen) can see them
const pubs = gql(`{publications(first:25){nodes{id name}}}`).publications.nodes;
const target = pubs.filter((p) => /hydrogen|headless|^diamond( packs)?$/i.test(p.name));
if (!target.length) console.warn('⚠ No Hydrogen/Headless publication found; products will be created but not published to the storefront. Publications:', pubs.map((p) => p.name).join(', '));

const CREATE = `mutation($input:ProductSetInput!){productSet(synchronous:true,input:$input){product{id handle} userErrors{field message code}}}`;
const PUBLISH = `mutation($id:ID!,$input:[PublicationInput!]!){publishablePublish(id:$id,input:$input){userErrors{field message}}}`;

let created = 0, skipped = 0, failed = 0;
for (const input of inputs) {
  if (existing.has(input.handle)) { skipped++; continue; }
  try {
    const r = gql(CREATE, {input}, true).productSet;
    if (r.userErrors?.length || !r.product) throw new Error(JSON.stringify(r.userErrors));
    if (target.length) {
      const pr = gql(PUBLISH, {id: r.product.id, input: target.map((t) => ({publicationId: t.id}))}, true).publishablePublish;
      if (pr.userErrors?.length) throw new Error('publish: ' + JSON.stringify(pr.userErrors));
    }
    created++;
    if (created % 10 === 0) console.log(`  …${created} created`);
  } catch (e) {
    failed++;
    console.error(`✗ ${input.handle}: ${String(e.message).slice(0, 300)}`);
  }
}
console.log(`done — created ${created}, skipped ${skipped} (already existed), failed ${failed}`);
