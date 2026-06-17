import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetail from '@/components/equipment/ProductDetail';
import {
  getProduct,
  getCategory,
  getAllProductSlugs,
} from '@/lib/equipment/products';

const baseUrl = 'https://www.touchteq.co.za';

export function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ product: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}): Promise<Metadata> {
  const { product: productSlug } = await params;
  const product = getProduct(productSlug);

  if (!product) {
    return {
      title: 'Equipment | Touch Teqniques Engineering',
    };
  }

  const title = `${product.model} | Touch Teqniques Engineering`;
  const description = product.tagline;
  const url = `${baseUrl}/equipment/${product.category}/${product.slug}`;

  return {
    title,
    description,
    keywords: [
      product.model.toLowerCase(),
      product.name.toLowerCase(),
      'GDSCorp',
      'gas detection',
      'wireless gas detector',
      'industrial safety',
      'South Africa',
    ],
    alternates: {
      canonical: `/equipment/${product.category}/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}) {
  const { category, product: productSlug } = await params;
  const product = getProduct(productSlug);
  const cat = getCategory(category);

  if (!product || !cat) notFound();
  if (product.category !== category) notFound();

  return <ProductDetail product={product} category={cat} baseUrl={baseUrl} />;
}
