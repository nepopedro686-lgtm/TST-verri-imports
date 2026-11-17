'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Smartphone,
  X,
} from 'lucide-react';
import { useStore } from '@/components/StoreProvider';
import { ProductCard } from '@/components/ProductCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import {
  AVAILABILITY_LABELS,
  CONDITION_LABELS,
  PHONE_CATEGORIES,
} from '@/lib/defaults';
import { parseNumericStorageGB } from '@/lib/format';
import { Product } from '@/lib/types';

type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'alpha';

function matchesCategoryFilter(product: Product, categoryFilter: string): boolean {
  if (categoryFilter === 'all') return true;
  if (categoryFilter === 'Celulares') {
    return PHONE_CATEGORIES.has(product.category);
  }
  return product.category === categoryFilter;
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const { publishedProducts, catalogMeta, loadingCatalog } = useStore();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedBrand, setSelectedBrand] = useState(
    searchParams.get('marca') || 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('categoria') || 'all'
  );
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedStorage, setSelectedStorage] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [onlyOffers, setOnlyOffers] = useState(
    searchParams.get('ofertas') === '1'
  );
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [visibleCount, setVisibleCount] = useState(12);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const availableBrands = useMemo(() => {
    const set = new Set<string>(catalogMeta.brands);
    publishedProducts.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [catalogMeta.brands, publishedProducts]);

  const availableCategories = useMemo(() => {
    const ordered: string[] = [];
    const seen = new Set<string>();
    const add = (cat: string) => {
      const clean = cat.trim();
      if (!clean || seen.has(clean)) return;
      seen.add(clean);
      ordered.push(clean);
    };
    catalogMeta.categories.forEach(add);
    publishedProducts.forEach((p) => {
      if (p.category) add(p.category);
    });
    return ordered;
  }, [catalogMeta.categories, publishedProducts]);

  const categoryTabs = useMemo(() => {
    const countFor = (catKey: string) =>
      publishedProducts.filter((p) => matchesCategoryFilter(p, catKey)).length;

    const tabs: Array<{ key: string; label: string; count: number }> = [
      { key: 'all', label: 'Todos', count: publishedProducts.length },
      { key: 'Celulares', label: 'Celulares', count: countFor('Celulares') },
    ];

    availableCategories.forEach((cat) => {
      if (cat === 'Celulares') return;
      tabs.push({ key: cat, label: cat, count: countFor(cat) });
    });

    return tabs;
  }, [availableCategories, publishedProducts]);

  const availableStorages = useMemo(() => {
    const set = new Set<string>();
    publishedProducts.forEach((p) => {
      if (p.storage?.trim()) set.add(p.storage.trim());
    });
    return Array.from(set).sort(
      (a, b) => parseNumericStorageGB(a) - parseNumericStorageGB(b)
    );
  }, [publishedProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const min = minPrice !== '' ? Number(minPrice) : null;
    const max = maxPrice !== '' ? Number(maxPrice) : null;

    const list = publishedProducts.filter((p) => {
      if (q) {
        const haystack = [
          p.name,
          p.brand,
          p.model,
          p.category,
          p.storage,
          p.sku,
          p.color,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      if (!matchesCategoryFilter(p, selectedCategory)) return false;
      if (selectedCondition !== 'all' && p.condition !== selectedCondition)
        return false;
      if (selectedStorage !== 'all' && p.storage !== selectedStorage)
        return false;

      const effectiveAvailability =
        p.quantity === 0 ? 'esgotado' : p.availability;
      if (
        selectedAvailability !== 'all' &&
        effectiveAvailability !== selectedAvailability
      ) {
        return false;
      }

      if (onlyOffers) {
        const hasRealOffer =
          p.isOffer &&
          typeof p.previousPrice === 'number' &&
          p.previousPrice > p.price;
        if (!hasRealOffer) return false;
      }

      if (min !== null && Number.isFinite(min) && p.price < min) return false;
      if (max !== null && Number.isFinite(max) && p.price > max) return false;

      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'alpha') return a.name.localeCompare(b.name, 'pt-BR');
      return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0);
    });

    return list;
  }, [
    publishedProducts,
    searchQuery,
    selectedBrand,
    selectedCategory,
    selectedCondition,
    selectedStorage,
    selectedAvailability,
    onlyOffers,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  const activeFiltersCount = [
    selectedBrand !== 'all',
    selectedCategory !== 'all',
    selectedCondition !== 'all',
    selectedStorage !== 'all',
    selectedAvailability !== 'all',
    onlyOffers,
    minPrice !== '',
    maxPrice !== '',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedCategory('all');
    setSelectedCondition('all');
    setSelectedStorage('all');
    setSelectedAvailability('all');
    setOnlyOffers(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('recent');
    setVisibleCount(12);
  };

  const paginated = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const FilterControls = (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
          Categoria de dispositivo
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setVisibleCount(12);
          }}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
        >
          <option value="all">Todas as categorias</option>
          <option value="Celulares">Celulares (iPhone e Android)</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
          Marca
        </label>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
        >
          <option value="all">Todas as marcas</option>
          {availableBrands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
          Condição
        </label>
        <select
          value={selectedCondition}
          onChange={(e) => setSelectedCondition(e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
        >
          <option value="all">Todas</option>
          {Object.entries(CONDITION_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {availableStorages.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Armazenamento
          </label>
          <select
            value={selectedStorage}
            onChange={(e) => setSelectedStorage(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            <option value="all">Qualquer capacidade</option>
            {availableStorages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
          Disponibilidade
        </label>
        <select
          value={selectedAvailability}
          onChange={(e) => setSelectedAvailability(e.target.value)}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
        >
          <option value="all">Todos os status</option>
          {Object.entries(AVAILABILITY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="block text-xs font-semibold text-zinc-700 mb-1.5">
          Faixa de preço (R$)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Mín"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-mono-nums text-zinc-900 focus:border-zinc-900 focus:outline-none"
          />
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Máx"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-mono-nums text-zinc-900 focus:border-zinc-900 focus:outline-none"
          />
        </div>
      </div>

      <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800">
        <input
          type="checkbox"
          checked={onlyOffers}
          onChange={(e) => setOnlyOffers(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 accent-zinc-950"
        />
        <span>Somente ofertas</span>
      </label>

      {(activeFiltersCount > 0 || searchQuery) && (
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      {/* Page Title & Live Search Bar */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
              Catálogo de aparelhos
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Escolha uma categoria ou pesquise por modelo, marca, armazenamento ou
              código interno.
            </p>
          </div>
          <a
            href="/api/catalogo-pdf"
            download="Verri-Imports-Catalogo.pdf"
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 whitespace-nowrap"
          >
            <FileDown className="h-4 w-4 shrink-0" />
            <span>Baixar catálogo em PDF</span>
          </a>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(12);
              }}
              placeholder="Buscar iPhone, Galaxy, JBL, fone, caixa de som, 256GB..."
              aria-label="Pesquisar no catálogo"
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50 lg:hidden cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>
                Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Ordenar aparelhos"
              className="h-12 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-900 focus:border-zinc-950 focus:outline-none"
            >
              <option value="recent">Mais recentes</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="alpha">Ordem alfabética</option>
            </select>
          </div>
        </div>

        {/* Device Category Tabs Bar */}
        <div
          role="tablist"
          aria-label="Categorias de dispositivo"
          className="mt-5 flex items-center gap-2 overflow-x-auto pb-1"
        >
          {categoryTabs.map((tab) => {
            const isActive = selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setSelectedCategory(tab.key);
                  setVisibleCount(12);
                }}
                className={`inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-950 text-white'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:text-zinc-950'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-mono-nums text-[11px] ${
                    isActive ? 'text-zinc-300' : 'text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="font-display text-sm font-bold text-zinc-950 mb-4">
              Filtrar catálogo
            </h2>
            {FilterControls}
          </div>
        </aside>

        {/* Product Grid */}
        <section className="lg:col-span-9">
          <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono-nums">
              {loadingCatalog
                ? 'Carregando catálogo...'
                : `${filteredProducts.length} ${
                    filteredProducts.length === 1
                      ? 'aparelho encontrado'
                      : 'aparelhos encontrados'
                  }`}
            </span>
          </div>

          {loadingCatalog ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-96 animate-pulse rounded-2xl border border-zinc-200 bg-white"
                />
              ))}
            </div>
          ) : publishedProducts.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center sm:p-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <Smartphone className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-zinc-950">
                Nenhum aparelho publicado ainda
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
                Os aparelhos estarão disponíveis nesta página assim que forem
                publicados pela loja. Fale pelo WhatsApp se procura algum modelo
                específico.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <WhatsAppButton variant="accent" label="Consultar no WhatsApp" />
                <Link
                  href="/admin"
                  className="inline-flex min-h-[44px] items-center rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Acessar Painel
                </Link>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center sm:p-12">
              <h2 className="font-display text-lg font-bold text-zinc-950">
                Nenhum resultado para os filtros aplicados
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
                Tente buscar com outros termos ou remova alguns filtros para
                visualizar mais aparelhos disponíveis.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar filtros
                </button>
                <WhatsAppButton
                  variant="outline"
                  label="Perguntar sobre o modelo no WhatsApp"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {paginated.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 cursor-pointer"
                  >
                    Carregar mais aparelhos
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros do catálogo"
        >
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-zinc-300" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-zinc-950">
                Filtrar aparelhos
              </h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100"
                aria-label="Fechar filtros"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {FilterControls}
            <div className="mt-6 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="min-h-[48px] w-full rounded-xl bg-zinc-950 text-sm font-semibold text-white"
              >
                Ver {filteredProducts.length} resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CatalogSearchParamsBridge() {
  const searchParams = useSearchParams();
  return <CatalogContent key={searchParams.toString()} />;
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-zinc-200" />
        </div>
      }
    >
      <CatalogSearchParamsBridge />
    </Suspense>
  );
}
