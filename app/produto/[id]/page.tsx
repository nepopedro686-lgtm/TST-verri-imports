import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SAMPLE_CATALOG_PRODUCTS } from '@/lib/sample-catalog';
import { Product } from '@/lib/types';
import { ProductDetailResolver } from '@/components/ProductDetailResolver';

export const dynamic = 'force-dynamic';

async function loadPublicProductForMeta(id: string): Promise<Product | null> {
  if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return null;
  const sampleMatch = SAMPLE_CATALOG_PRODUCTS.find((p) => p.id === id) || null;
  try {
    const snap = await getDoc(doc(db, 'products', id));
    if (!snap.exists()) {
      if (!sampleMatch) return null;
      const metaSnap = await getDoc(doc(db, 'catalogMeta', 'taxonomy'));
      if (!metaSnap.exists()) return sampleMatch;
      return null;
    }
    const data = snap.data() as Record<string, unknown>;
    if (data.publishStatus !== 'publicado') return null;
    return {
      id: snap.id,
      slug: String(data.slug || snap.id),
      name: String(data.name || ''),
      brand: String(data.brand || ''),
      model: String(data.model || ''),
      category: String(data.category || ''),
      description: String(data.description || ''),
      storage: typeof data.storage === 'string' ? data.storage : '',
      condition: (data.condition as Product['condition']) || 'seminovo',
      price: typeof data.price === 'number' ? data.price : 0,
      images: Array.isArray(data.images) ? (data.images as Product['images']) : [],
      availability:
        (data.availability as Product['availability']) || 'disponivel',
      publishStatus: 'publicado',
      featured: Boolean(data.featured),
      isOffer: Boolean(data.isOffer),
      ownerId: String(data.ownerId || ''),
      createdAt: null,
      updatedAt: null,
    };
  } catch {
    return sampleMatch;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await loadPublicProductForMeta(id);
  if (!product) {
    return {
      title: 'Aparelho não encontrado',
      description: 'Este aparelho não está disponível no catálogo no momento.',
    };
  }

  const title = `${product.name} · ${product.brand} ${product.model}`;
  const description =
    product.description?.slice(0, 155) ||
    `${product.name} (${product.brand} ${product.model}${
      product.storage ? `, ${product.storage}` : ''
    }). Consulte disponibilidade pelo WhatsApp.`;

  const primaryImage = product.images?.[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(primaryImage ? { images: [{ url: primaryImage }] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailResolver productId={id} />;
}
