'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Clock,
  Instagram,
  MapPin,
  Phone,
  Search,
  Smartphone,
  Wrench,
} from 'lucide-react';
import { useStore } from '@/components/StoreProvider';
import { ProductCard } from '@/components/ProductCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export default function HomePage() {
  const { settings, catalogMeta, publishedProducts, loadingCatalog } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    router.push(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo');
  };

  const featuredProducts = publishedProducts.filter((p) => p.featured).slice(0, 6);
  const displayProducts =
    featuredProducts.length > 0 ? featuredProducts : publishedProducts.slice(0, 6);

  // Only show genuine offers where previousPrice > price
  const offerProducts = publishedProducts
    .filter(
      (p) =>
        p.isOffer &&
        typeof p.previousPrice === 'number' &&
        p.previousPrice > p.price &&
        p.availability !== 'esgotado'
    )
    .slice(0, 3);

  const hasContactInfo = Boolean(
    settings.address ||
      settings.openingHours ||
      settings.phone ||
      settings.instagram
  );

  return (
    <main>
      {/* 1. Hero Section */}
      <section className="bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Hero Copy & Search */}
            <div className="flex flex-col justify-center lg:col-span-7">
              {settings.tagline && (
                <p className="text-sm font-medium text-zinc-400">
                  {settings.tagline}
                </p>
              )}

              <h1 className="mt-3 font-display text-[clamp(2rem,4.2vw,3.35rem)] font-bold leading-[1.08] tracking-tight text-white [text-wrap:balance]">
                {settings.heroTitle}
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-300">
                {settings.heroSubtitle}
              </p>

              {/* Quick Product Search */}
              <form
                onSubmit={handleSearchSubmit}
                className="mt-7 flex w-full max-w-xl flex-col gap-2.5 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar iPhone, Samsung, 256GB, JBL..."
                    aria-label="Buscar aparelhos no catálogo"
                    className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 cursor-pointer whitespace-nowrap"
                >
                  Buscar aparelho
                </button>
              </form>

              {/* Primary CTAs */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/catalogo"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors whitespace-nowrap"
                  style={{ backgroundColor: settings.accentColor || '#00C9A7' }}
                >
                  <span>Ver todos os aparelhos</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/assistencia"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 whitespace-nowrap"
                >
                  <Wrench className="h-4 w-4 shrink-0" />
                  <span>Assistência técnica</span>
                </Link>

                <WhatsAppButton
                  variant="dark-outline"
                  label="Falar no WhatsApp"
                />
              </div>
            </div>

            {/* Hero Showroom Image */}
            <div className="lg:col-span-5">
              <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 sm:h-80 lg:h-full lg:min-h-[380px]">
                <img
                  src="/images/hero_boutique_showroom.jpg"
                  alt={`Vitrine de aparelhos da ${settings.storeName}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
              </div>
            </div>
          </div>

          {/* Commercial Highlights Row */}
          {settings.commercialHighlights &&
            settings.commercialHighlights.length > 0 && (
              <div className="mt-10 grid grid-cols-1 gap-4 border-t border-zinc-800/80 pt-7 sm:grid-cols-3">
                {settings.commercialHighlights.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: settings.accentColor || '#00C9A7' }}
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-zinc-200">{item}</p>
                  </div>
                ))}
              </div>
            )}
        </div>
      </section>

      {/* 2. Categories Strip */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="mr-2 shrink-0 text-xs font-semibold text-zinc-500">
              Categorias:
            </span>
            <Link
              href="/catalogo"
              className="inline-flex min-h-[40px] shrink-0 items-center rounded-xl bg-zinc-950 px-4 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 whitespace-nowrap"
            >
              Todos
            </Link>
            <Link
              href="/catalogo?categoria=Celulares"
              className="inline-flex min-h-[40px] shrink-0 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-xs font-medium text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-white whitespace-nowrap"
            >
              Celulares
            </Link>
            {catalogMeta.categories.map((cat) => (
              <Link
                key={cat}
                href={`/catalogo?categoria=${encodeURIComponent(cat)}`}
                className="inline-flex min-h-[40px] shrink-0 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-xs font-medium text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-white whitespace-nowrap"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Products OR Elegant Empty Catalog State */}
      <section id="destaques" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
              {featuredProducts.length > 0
                ? 'Aparelhos em destaque'
                : 'Catálogo de aparelhos'}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Consulte disponibilidade e fale diretamente com nossa equipe.
            </p>
          </div>
          {publishedProducts.length > 0 && (
            <Link
              href="/catalogo"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-zinc-950 hover:text-zinc-700 whitespace-nowrap"
            >
              <span>Ver catálogo completo ({publishedProducts.length})</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {loadingCatalog ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 animate-pulse rounded-2xl border border-zinc-200 bg-white"
              />
            ))}
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Elegant Empty State — No fake products or invented prices */
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-10">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-zinc-950 sm:text-2xl">
                  Novos aparelhos serão disponibilizados em breve
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Estamos atualizando o estoque com fotografias reais e valores
                  conferidos. Enquanto isso, você pode consultar nossa equipe
                  diretamente pelo WhatsApp para verificar a disponibilidade de
                  algum modelo específico.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <WhatsAppButton
                    variant="accent"
                    label="Consultar disponibilidade no WhatsApp"
                  />
                  <Link
                    href="/admin"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 whitespace-nowrap"
                  >
                    Cadastrar aparelhos (Admin)
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:col-span-6">
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 aspect-[4/3]">
                  <img
                    src="/images/boutique_inspection_bench.jpg"
                    alt="Bancada de conferência técnica de smartphones"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 aspect-[4/3]">
                  <img
                    src="/images/boutique_audio_accessories.jpg"
                    alt="Áudio e acessórios originais selecionados"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Real Offers Section (Rendered ONLY when genuine offers exist) */}
      {offerProducts.length > 0 && (
        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-950">
                  Condições especiais
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Aparelhos com redução real de preço em relação ao valor
                  anterior cadastrado.
                </p>
              </div>
              <Link
                href="/catalogo?ofertas=1"
                className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-zinc-950 hover:text-zinc-700 whitespace-nowrap"
              >
                <span>Ver ofertas</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {offerProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Assistência Técnica Section */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="flex flex-col justify-center lg:col-span-7">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                <Wrench className="h-3.5 w-3.5 text-zinc-700" />
                <span>Bancada técnica em Volta Redonda</span>
              </div>

              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl [text-wrap:balance]">
                Assistência técnica para iPhone e Android
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
                Além da venda de aparelhos, realizamos manutenção especializada
                em nossa loja no Plaza Business Center. Avaliação transparente
                antes de qualquer reparo.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-zinc-200 pt-5 sm:grid-cols-2">
                <div>
                  <span className="font-mono-nums text-xs font-semibold text-zinc-500">
                    01.
                  </span>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-950">
                    Troca de tela e vidro
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Frontal completa com conferência de toque e sensores.
                  </p>
                </div>
                <div>
                  <span className="font-mono-nums text-xs font-semibold text-zinc-500">
                    02.
                  </span>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-950">
                    Substituição de bateria
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Solução para desgaste rápido e desligamentos.
                  </p>
                </div>
                <div>
                  <span className="font-mono-nums text-xs font-semibold text-zinc-500">
                    03.
                  </span>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-950">
                    Conector, áudio e câmeras
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Reparo de carga USB-C, Lightning, som e lentes.
                  </p>
                </div>
                <div>
                  <span className="font-mono-nums text-xs font-semibold text-zinc-500">
                    04.
                  </span>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-950">
                    Análise em placa e software
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Diagnóstico para aparelhos oxidados ou sem sinal.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/assistencia"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 whitespace-nowrap"
                >
                  <span>Solicitar orçamento técnico</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <WhatsAppButton
                  variant="outline"
                  label="Falar com a assistência"
                  customMessage="Olá! Gostaria de solicitar um orçamento na assistência técnica."
                />
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 sm:h-80 lg:h-full lg:min-h-[340px]">
                <img
                  src="/images/boutique_inspection_bench.jpg"
                  alt={`Bancada de assistência técnica da ${settings.storeName}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Location & Direct Contact Section */}
      <section className="border-t border-zinc-200 bg-[#FAFAFA]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-14">
          <div className="grid grid-cols-1 gap-8 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h2 className="font-display text-xl font-bold text-zinc-950 sm:text-2xl">
                Atendimento direto com a {settings.storeName}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {settings.description}
              </p>

              {hasContactInfo && (
                <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-zinc-700 sm:grid-cols-2">
                  {settings.address && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                      <span className="whitespace-pre-line">{settings.address}</span>
                    </div>
                  )}
                  {settings.openingHours && (
                    <div className="flex items-start gap-2.5">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                      <span>{settings.openingHours}</span>
                    </div>
                  )}
                  {settings.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 shrink-0 text-zinc-500" />
                      <span className="font-mono-nums">{settings.phone}</span>
                    </div>
                  )}
                  {settings.instagram && (
                    <div className="flex items-center gap-2.5">
                      <Instagram className="h-4 w-4 shrink-0 text-zinc-500" />
                      <span>{settings.instagram}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
              <WhatsAppButton
                variant="accent"
                label="Conversar no WhatsApp"
                className="justify-center"
              />
              <Link
                href="/catalogo"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 whitespace-nowrap"
              >
                Abrir catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
