'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock, Smartphone } from 'lucide-react';
import { Product } from '@/lib/types';
import { AVAILABILITY_LABELS, CONDITION_LABELS } from '@/lib/defaults';
import { formatBRL } from '@/lib/format';
import { WhatsAppButton } from './WhatsAppButton';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const coverImage = product.images?.[0];
  const hasDiscount =
    typeof product.previousPrice === 'number' &&
    product.previousPrice > product.price;

  const isOutOfStock =
    product.availability === 'esgotado' || product.quantity === 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Product Photograph */}
      <Link
        href={`/produto/${product.id}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-zinc-100"
      >
        {coverImage && !imgError ? (
          <img
            src={coverImage.url}
            alt={coverImage.alt || `${product.brand} ${product.name}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
              isOutOfStock ? 'opacity-65 grayscale-[30%]' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-100 px-4 text-center text-zinc-400">
            <Smartphone className="h-9 w-9 stroke-[1.5]" />
            <span className="text-xs font-medium text-zinc-500 line-clamp-1">
              {product.model || product.name}
            </span>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {/* Unboxed clean metadata line (Zero-pill discipline) */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
            <span className="font-medium text-zinc-700">{product.brand}</span>
            {product.storage && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-nums">{product.storage}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{CONDITION_LABELS[product.condition] || product.condition}</span>
          </div>

          <Link href={`/produto/${product.id}`} className="mt-1.5 block">
            <h3 className="font-display text-base font-semibold leading-snug text-zinc-950 line-clamp-2 group-hover:text-zinc-700">
              {product.name}
            </h3>
          </Link>

          <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
            {product.model}
            {product.color ? ` · ${product.color}` : ''}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-100">
          {/* Availability with icon + explicit text */}
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 text-red-700">
                <AlertCircle className="h-3.5 w-3.5" />
                Esgotado
              </span>
            ) : product.availability === 'reservado' ? (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <Clock className="h-3.5 w-3.5" />
                {AVAILABILITY_LABELS.reservado}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {AVAILABILITY_LABELS.disponivel}
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2">
            <span className="font-mono-nums text-lg font-bold tracking-tight text-zinc-950">
              {formatBRL(product.price)}
            </span>
            {hasDiscount && (
              <span className="font-mono-nums text-xs text-zinc-400 line-through">
                {formatBRL(product.previousPrice!)}
              </span>
            )}
          </div>

          {/* Card Actions */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={`/produto/${product.id}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 whitespace-nowrap"
            >
              Ver detalhes
            </Link>
            <WhatsAppButton
              product={product}
              variant={isOutOfStock ? 'outline' : 'accent'}
              label={isOutOfStock ? 'Consultar' : 'WhatsApp'}
              className="px-3 text-xs"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
