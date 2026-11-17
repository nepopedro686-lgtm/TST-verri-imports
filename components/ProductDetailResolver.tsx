'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from './StoreProvider';
import { ProductDetailView } from './ProductDetailView';
import { fetchProductById } from '@/lib/store-data';
import { SAMPLE_CATALOG_PRODUCTS } from '@/lib/sample-catalog';
import { Product } from '@/lib/types';

interface ProductDetailResolverProps {
  productId: string;
}

export function ProductDetailResolver({ productId }: ProductDetailResolverProps) {
  const { publishedProducts, loadingCatalog, isShowingSampleCatalog } = useStore();
  const [fetchedProduct, setFetchedProduct] = useState<Product | null | undefined>(
    undefined
  );

  const fromStore = publishedProducts.find((p) => p.id === productId) || null;

  useEffect(() => {
    if (fromStore || loadingCatalog) return;
    if (!productId || !/^[a-zA-Z0-9_-]{1,128}$/.test(productId)) {
      Promise.resolve().then(() => setFetchedProduct(null));
      return;
    }

    let active = true;
    fetchProductById(productId)
      .then((item) => {
        if (!active) return;
        if (item && item.publishStatus === 'publicado') {
          setFetchedProduct(item);
          return;
        }
        if (isShowingSampleCatalog) {
          const sample =
            SAMPLE_CATALOG_PRODUCTS.find((p) => p.id === productId) || null;
          setFetchedProduct(sample);
          return;
        }
        setFetchedProduct(null);
      })
      .catch(() => {
        if (active) setFetchedProduct(null);
      });

    return () => {
      active = false;
    };
  }, [productId, fromStore, loadingCatalog, isShowingSampleCatalog]);

  const resolvedProduct = fromStore || fetchedProduct;

  if (resolvedProduct) {
    const isOutOfStock =
      resolvedProduct.availability === 'esgotado' ||
      resolvedProduct.quantity === 0;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: resolvedProduct.name,
      brand: {
        '@type': 'Brand',
        name: resolvedProduct.brand,
      },
      model: resolvedProduct.model,
      description:
        resolvedProduct.description ||
        `${resolvedProduct.brand} ${resolvedProduct.model}`,
      ...(resolvedProduct.sku ? { sku: resolvedProduct.sku } : {}),
      ...(resolvedProduct.images?.[0]?.url
        ? { image: resolvedProduct.images.map((i) => i.url) }
        : {}),
      offers: {
        '@type': 'Offer',
        priceCurrency: 'BRL',
        price: resolvedProduct.price,
        availability: isOutOfStock
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      },
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ProductDetailView product={resolvedProduct} />
      </>
    );
  }

  if (loadingCatalog || fetchedProduct === undefined) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-6 h-5 w-48 animate-pulse rounded-lg bg-zinc-200" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="aspect-[4/3] animate-pulse rounded-2xl bg-zinc-200 lg:col-span-7" />
          <div className="h-96 animate-pulse rounded-2xl bg-zinc-200 lg:col-span-5" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <h1 className="font-display text-2xl font-bold text-zinc-950">
        Aparelho não encontrado
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Este item pode ter sido removido ou retirado temporariamente do catálogo
        público.
      </p>
      <div className="mt-6">
        <Link
          href="/catalogo"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Voltar ao catálogo
        </Link>
      </div>
    </main>
  );
}
