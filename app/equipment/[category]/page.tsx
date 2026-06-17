import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryHub from '@/components/equipment/CategoryHub';
import {
  getCategory,
  getAllCategorySlugs,
} from '@/lib/equipment/products';

const baseUrl = 'https://www.touchteq.co.za';

export function generateStaticParams() {
  return getAllCategorySlugs().map((slug) => ({ category: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);

  if (!cat) {
    return {
      title: 'Equipment Category | Touch Teqniques Engineering',
    };
  }

  return {
    title: `${cat.name} | Touch Teqniques Engineering`,
    description: cat.description,
    keywords: [
      cat.name.toLowerCase(),
      'GDSCorp',
      'gas detection',
      'industrial safety',
      'South Africa',
    ],
    alternates: {
      canonical: `/equipment/${cat.slug}`,
    },
    openGraph: {
      title: `${cat.name} | Touch Teqniques Engineering`,
      description: cat.description,
      url: `${baseUrl}/equipment/${cat.slug}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategory(category);

  if (!cat) notFound();

  return <CategoryHub category={cat} />;
}
