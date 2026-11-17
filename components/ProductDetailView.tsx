'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Expand,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { Product } from '@/lib/types';
import { AVAILABILITY_LABELS, CONDITION_LABELS } from '@/lib/defaults';
import { formatBRL } from '@/lib/format';
import { useStore } from './StoreProvider';
import { WhatsAppButton } from './WhatsAppButton';
import { ProductCard } from './ProductCard';

interface ProductDetailViewProps {
  product: Product;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const { publishedProducts } = useStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const images = product.images || [];
  const currentImg = images[activeIndex];

  const isOutOfStock =
    product.availability === 'esgotado' || product.quantity === 0;
  const hasDiscount =
    typeof product.previousPrice === 'number' &&
    product.previousPrice > product.price;

  const relatedProducts = useMemo(() => {
    return publishedProducts
      .filter(
        (p) =>
          p.id !== product.id &&
          (p.category === product.category || p.brand === product.brand)
      )
      .slice(0, 3);
  }, [publishedProducts, product.id, product.category, product.brand]);

  const specsLines = useMemo(() => {
    const rows: Array<{ label: string; value: string }> = [
      { label: 'Marca', value: product.brand },
      { label: 'Modelo', value: product.model },
      {
        label: 'Condição',
        value: CONDITION_LABELS[product.condition] || product.condition,
      },
    ];
    if (product.storage) rows.push({ label: 'Armazenamento', value: product.storage });
    if (product.ram) rows.push({ label: 'Memória RAM', value: product.ram });
    if (product.color) rows.push({ label: 'Cor', value: product.color });
    if (product.sku) rows.push({ label: 'Código interno', value: product.sku });
    if (product.includedAccessories) {
      rows.push({
        label: 'Acessórios incluídos',
        value: product.includedAccessories,
      });
    }
    return rows;
  }, [product]);

  const handleMarkFailed = (url: string) => {
    setFailedUrls((prev) => ({ ...prev, [url]: true }));
  };

  const nextImage = () => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-16 lg:pt-10">
      {/* Breadcrumb */}
      <nav aria-label="Caminho" className="mb-6 flex items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/catalogo"
          className="inline-flex min-h-[40px] items-center gap-1.5 font-medium text-zinc-700 hover:text-zinc-950"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao catálogo</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span>{product.category}</span>
        <span aria-hidden="true">/</span>
        <span className="truncate text-zinc-900">{product.name}</span>
      </nav>

      {/* Main 2-column PDP Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Gallery Left */}
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white aspect-[4/3]">
            {currentImg && !failedUrls[currentImg.url] ? (
              <>
                <img
                  src={currentImg.url}
                  alt={currentImg.alt || `${product.brand} ${product.name}`}
                  referrerPolicy="no-referrer"
                  onError={() => handleMarkFailed(currentImg.url)}
                  onClick={() => setZoomOpen(true)}
                  className="h-full w-full cursor-zoom-in object-cover"
                />
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950/75 text-white backdrop-blur-sm hover:bg-zinc-950 cursor-pointer"
                  aria-label="Ampliar fotografia"
                >
                  <Expand className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-100 text-zinc-400">
                <Smartphone className="h-12 w-12 stroke-[1.5]" />
                <span className="text-sm text-zinc-500">
                  Fotografia indisponível
                </span>
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white/90 text-zinc-900 shadow-sm hover:bg-white cursor-pointer"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white/90 text-zinc-900 shadow-sm hover:bg-white cursor-pointer"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-zinc-100 transition-colors cursor-pointer ${
                    idx === activeIndex
                      ? 'border-zinc-950'
                      : 'border-transparent hover:border-zinc-300'
                  }`}
                  aria-label={`Ver imagem ${idx + 1}`}
                >
                  {!failedUrls[img.url] ? (
                    <img
                      src={img.url}
                      alt={img.alt || `${product.name} foto ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      onError={() => handleMarkFailed(img.url)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                      <Smartphone className="h-5 w-5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase & Info Module Right */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            {/* Unboxed Metadata */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
              <span className="font-semibold text-zinc-800">{product.brand}</span>
              <span aria-hidden="true">·</span>
              <span>{product.category}</span>
              <span aria-hidden="true">·</span>
              <span>{CONDITION_LABELS[product.condition] || product.condition}</span>
            </div>

            <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-zinc-950 sm:text-3xl">
              {product.name}
            </h1>

            <p className="mt-1 text-sm text-zinc-600">
              Modelo: {product.model}
              {product.storage ? ` · ${product.storage}` : ''}
              {product.color ? ` · ${product.color}` : ''}
            </p>

            {/* Availability */}
            <div className="mt-4 flex items-center gap-2 text-sm font-medium">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  Produto esgotado no momento
                </span>
              ) : product.availability === 'reservado' ? (
                <span className="inline-flex items-center gap-1.5 text-amber-700">
                  <Clock className="h-4 w-4" />
                  {AVAILABILITY_LABELS.reservado}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {AVAILABILITY_LABELS.disponivel}
                  {typeof product.quantity === 'number' && product.quantity > 0
                    ? ` (${product.quantity} ${
                        product.quantity === 1 ? 'unidade' : 'unidades'
                      })`
                    : ''}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mt-5 border-t border-zinc-100 pt-5">
              {hasDiscount && (
                <p className="font-mono-nums text-sm text-zinc-400 line-through">
                  De {formatBRL(product.previousPrice!)}
                </p>
              )}
              <p className="font-mono-nums text-3xl font-bold tracking-tight text-zinc-950">
                {formatBRL(product.price)}
              </p>

              {product.paymentTerms && (
                <p className="mt-2 text-sm text-zinc-700 whitespace-pre-line">
                  {product.paymentTerms}
                </p>
              )}
            </div>

            {/* Warranty & Commercial Notes (only if configured by store) */}
            {(product.warrantyInfo || product.commercialNotes) && (
              <div className="mt-5 space-y-2.5 border-t border-zinc-100 pt-4 text-sm text-zinc-700">
                {product.warrantyInfo && (
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                    <span>{product.warrantyInfo}</span>
                  </div>
                )}
                {product.commercialNotes && (
                  <p className="text-xs leading-relaxed text-zinc-500">
                    {product.commercialNotes}
                  </p>
                )}
              </div>
            )}

            {/* Primary WhatsApp CTA */}
            <div className="mt-6">
              <WhatsAppButton
                product={product}
                variant={isOutOfStock ? 'dark' : 'accent'}
                fullWidth
                label={
                  isOutOfStock
                    ? 'Consultar previsão de reposição'
                    : 'Negociar este aparelho no WhatsApp'
                }
                className="h-12 text-sm"
              />
            </div>
          </div>

          {/* Description & Specs Table */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 space-y-6">
            {product.description && (
              <div>
                <h2 className="font-display text-base font-bold text-zinc-950">
                  Descrição do aparelho
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            <div>
              <h2 className="font-display text-base font-bold text-zinc-950">
                Ficha técnica
              </h2>
              <dl className="mt-3 divide-y divide-zinc-100 text-sm">
                {specsLines.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 py-2.5"
                  >
                    <dt className="text-zinc-500">{row.label}</dt>
                    <dd className="text-right font-medium text-zinc-900">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {product.specs && (
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <p className="text-xs font-semibold text-zinc-700 mb-1.5">
                    Especificações adicionais
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-600 whitespace-pre-line">
                    {product.specs}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-14 border-t border-zinc-200 pt-10">
          <h2 className="font-display text-xl font-bold text-zinc-950">
            Outros aparelhos que podem interessar
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Bottom Buy Bar (<= 15% mobile viewport height) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white/95 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-zinc-500">{product.name}</p>
            <p className="font-mono-nums text-base font-bold text-zinc-950">
              {formatBRL(product.price)}
            </p>
          </div>
          <WhatsAppButton
            product={product}
            variant={isOutOfStock ? 'dark' : 'accent'}
            label={isOutOfStock ? 'Consultar' : 'WhatsApp'}
          />
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {zoomOpen && currentImg && !failedUrls[currentImg.url] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada da fotografia"
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 cursor-pointer"
            aria-label="Fechar ampliação"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 cursor-pointer"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 cursor-pointer"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <img
            src={currentImg.url}
            alt={currentImg.alt || product.name}
            referrerPolicy="no-referrer"
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </main>
  );
}
