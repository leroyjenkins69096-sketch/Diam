import {getAllProducts} from '~/lib/shopify-products';
import type {Route} from './+types/api.search';

export async function loader({request, context}: Route.LoaderArgs) {
  const q = new URL(request.url).searchParams.get('q')?.trim().toLowerCase() ?? '';
  if (q.length < 2) return Response.json({results: []});

  const products = await getAllProducts(context);
  const results = products
    .filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.productType.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    )
    .slice(0, 8);

  return Response.json({results});
}
