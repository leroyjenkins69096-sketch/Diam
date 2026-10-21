import {useLoaderData} from 'react-router';
import type {Route} from './+types/menu';
import {getAllProducts} from '~/lib/shopify-products';
import {Rack} from '~/components/Rack';

export function meta() {
  return [{title: 'The Case — Diamond Packs'}];
}

export async function loader({context}: Route.LoaderArgs) {
  const products = await getAllProducts(context);
  return {products};
}

export default function MenuPage() {
  const {products} = useLoaderData<typeof loader>();
  return <Rack products={products} shelfId="all" />;
}
