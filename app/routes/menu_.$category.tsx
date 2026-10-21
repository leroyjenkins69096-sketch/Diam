import {useLoaderData, useParams} from 'react-router';
import type {Route} from './+types/menu_.$category';
import {getAllProducts} from '~/lib/shopify-products';
import {Rack} from '~/components/Rack';

export function shouldRevalidate() {
  return false;
}

export function meta() {
  return [{title: 'The Case — Diamond Packs'}];
}

export async function loader({context}: Route.LoaderArgs) {
  const products = await getAllProducts(context);

  const recent = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
  const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayIds = products.filter((p) => p.publishedAt >= recent).map((p) => p.id);
  const weekIds = products.filter((p) => p.publishedAt >= week).map((p) => p.id);
  return {products, dropIds: todayIds.length > 0 ? todayIds : weekIds};
}

export default function MenuCategoryPage() {
  const {products, dropIds} = useLoaderData<typeof loader>();
  const {category} = useParams();
  return <Rack products={products} shelfId={category ?? 'all'} dropIds={dropIds} />;
}
