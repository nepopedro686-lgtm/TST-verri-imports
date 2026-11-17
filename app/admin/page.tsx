'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  Archive,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Package,
  Plus,
  Search,
  Settings,
  Smartphone,
  Store,
  Trash2,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useStore } from '@/components/StoreProvider';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { ProductForm } from '@/components/admin/ProductForm';
import { QuickPriceEditor } from '@/components/admin/QuickPriceEditor';
import { StoreSettingsForm } from '@/components/admin/StoreSettingsForm';
import {
  checkCatalogMetaExists,
  deleteProduct,
  fetchAllProductsAdmin,
  seedSampleCatalogToFirestore,
  updateProduct,
} from '@/lib/store-data';
import { Product } from '@/lib/types';
import { formatBRL, formatShortDate } from '@/lib/format';
import { AVAILABILITY_LABELS, PUBLISH_STATUS_LABELS } from '@/lib/defaults';

type AdminTab = 'resumo' | 'catalogo' | 'novo' | 'precos' | 'configuracoes';

function AdminWorkspaceContent() {
  const searchParams = useSearchParams();
  const { user, settings, refreshStoreData } = useStore();

  const initialTabParam = searchParams.get('tab') as AdminTab | null;
  const [activeTab, setActiveTab] = useState<AdminTab>(
    initialTabParam &&
      ['resumo', 'catalogo', 'novo', 'precos', 'configuracoes'].includes(
        initialTabParam
      )
      ? initialTabParam
      : 'resumo'
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const [formMode, setFormMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [adminSearch, setAdminSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState('all');

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadAdminCatalog = useCallback(async () => {
    try {
      const items = await fetchAllProductsAdmin();
      setProducts(items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let items = await fetchAllProductsAdmin();
        if (items.length === 0 && user?.uid) {
          const initialized = await checkCatalogMetaExists();
          if (!initialized) {
            await seedSampleCatalogToFirestore(user.uid);
            await refreshStoreData();
            items = await fetchAllProductsAdmin();
            if (active) {
              setToastMsg(
                '12 aparelhos de exemplo foram salvos no catálogo. Você pode editá-los ou removê-los a qualquer momento.'
              );
            }
          }
        }
        if (active) setProducts(items);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.uid, refreshStoreData]);

  const handleManualSeed = async () => {
    if (!user?.uid || seeding) return;
    setSeeding(true);
    try {
      await seedSampleCatalogToFirestore(user.uid);
      await refreshStoreData();
      await loadAdminCatalog();
      setToastMsg('Aparelhos de exemplo carregados no catálogo.');
    } finally {
      setSeeding(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 5000);
  };

  const stats = useMemo(() => {
    const total = products.length;
    const available = products.filter(
      (p) =>
        p.publishStatus === 'publicado' &&
        p.availability === 'disponivel' &&
        p.quantity !== 0
    ).length;
    const outOfStock = products.filter(
      (p) => p.availability === 'esgotado' || p.quantity === 0
    ).length;
    const drafts = products.filter((p) => p.publishStatus === 'rascunho').length;
    return { total, available, outOfStock, drafts };
  }, [products]);

  const filteredAdminProducts = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.model} ${p.sku || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter !== 'all' && p.publishStatus !== statusFilter)
        return false;
      const effAvail = p.quantity === 0 ? 'esgotado' : p.availability;
      if (availFilter !== 'all' && effAvail !== availFilter) return false;
      return true;
    });
  }, [products, adminSearch, statusFilter, availFilter]);

  const openNewProduct = () => {
    setFormMode('create');
    setEditingProduct(null);
    setActiveTab('novo');
  };

  const openEditProduct = (p: Product) => {
    setFormMode('edit');
    setEditingProduct(p);
    setActiveTab('novo');
  };

  const openDuplicateProduct = (p: Product) => {
    setFormMode('duplicate');
    setEditingProduct(p);
    setActiveTab('novo');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      await Promise.all([loadAdminCatalog(), refreshStoreData()]);
      showToast(`"${deleteTarget.name}" excluído permanentemente.`);
    } finally {
      setDeleting(false);
    }
  };

  const handleArchiveInstead = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await updateProduct(deleteTarget.id, {
        ...deleteTarget,
        publishStatus: 'arquivado',
      });
      setDeleteTarget(null);
      await Promise.all([loadAdminCatalog(), refreshStoreData()]);
      showToast(`"${deleteTarget.name}" foi arquivado e ocultado do site.`);
    } finally {
      setDeleting(false);
    }
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    {
      id: 'resumo',
      label: 'Resumo',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'catalogo',
      label: 'Catálogo',
      icon: <Package className="h-4 w-4" />,
    },
    {
      id: 'novo',
      label: formMode === 'edit' && activeTab === 'novo' ? 'Editar' : 'Novo',
      icon: <Plus className="h-4 w-4" />,
    },
    {
      id: 'precos',
      label: 'Preços',
      icon: <ListChecks className="h-4 w-4" />,
    },
    {
      id: 'configuracoes',
      label: 'Loja',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950 font-display text-sm font-bold"
              style={{ color: settings.accentColor || '#00C9A7' }}
            >
              {settings.storeName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-zinc-950">
                Painel · {settings.storeName}
              </p>
              <p className="truncate text-[11px] text-zinc-500">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 whitespace-nowrap"
            >
              <Store className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver loja</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-zinc-100 bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-1.5 sm:px-6">
            {navItems.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id === 'novo' && activeTab !== 'novo') {
                      setFormMode('create');
                      setEditingProduct(null);
                    }
                    setActiveTab(tab.id);
                  }}
                  className={`inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-zinc-950 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        {toastMsg && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* TAB 1: RESUMO */}
        {activeTab === 'resumo' && (
          <div className="space-y-6">
            {!settings.whatsappNumber && (
              <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
                <p className="text-sm text-amber-950">
                  <strong>Atenção:</strong> o número de WhatsApp da loja ainda não
                  foi configurado. Cadastre-o para ativar os botões de contato.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('configuracoes')}
                  className="min-h-[40px] shrink-0 rounded-xl bg-zinc-950 px-4 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                >
                  Configurar WhatsApp
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-medium text-zinc-500">
                  Total cadastrados
                </p>
                <p className="mt-2 font-mono-nums text-3xl font-bold text-zinc-950">
                  {loading ? '—' : stats.total}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-medium text-zinc-500">
                  Disponíveis no site
                </p>
                <p className="mt-2 font-mono-nums text-3xl font-bold text-emerald-700">
                  {loading ? '—' : stats.available}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-medium text-zinc-500">Esgotados</p>
                <p className="mt-2 font-mono-nums text-3xl font-bold text-red-700">
                  {loading ? '—' : stats.outOfStock}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <p className="text-xs font-medium text-zinc-500">
                  Em rascunho
                </p>
                <p className="mt-2 font-mono-nums text-3xl font-bold text-zinc-700">
                  {loading ? '—' : stats.drafts}
                </p>
              </div>
            </div>

            {/* Quick Shortcuts */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={openNewProduct}
                className="flex min-h-[88px] flex-col justify-between rounded-2xl bg-zinc-950 p-5 text-left text-white transition-colors hover:bg-zinc-800 cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                <div>
                  <p className="font-display text-base font-bold">
                    Adicionar novo aparelho
                  </p>
                  <p className="text-xs text-zinc-400">
                    Envie fotos da galeria e defina o preço
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('catalogo')}
                className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 text-left transition-colors hover:border-zinc-400 cursor-pointer"
              >
                <Package className="h-5 w-5 text-zinc-800" />
                <div>
                  <p className="font-display text-base font-bold text-zinc-950">
                    Gerenciar catálogo
                  </p>
                  <p className="text-xs text-zinc-500">
                    Editar, duplicar ou marcar como esgotado
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('configuracoes')}
                className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 text-left transition-colors hover:border-zinc-400 cursor-pointer"
              >
                <Settings className="h-5 w-5 text-zinc-800" />
                <div>
                  <p className="font-display text-base font-bold text-zinc-950">
                    Informações da loja
                  </p>
                  <p className="text-xs text-zinc-500">
                    WhatsApp, logotipo, endereço e marcas
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CATÁLOGO ADMIN */}
        {activeTab === 'catalogo' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Buscar por nome, marca, modelo ou código..."
                  className="h-11 w-full rounded-xl border border-zinc-200 pl-10 pr-3 text-sm focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
                >
                  <option value="all">Todos os status</option>
                  <option value="publicado">Publicado</option>
                  <option value="rascunho">Rascunho</option>
                  <option value="arquivado">Arquivado</option>
                </select>

                <select
                  value={availFilter}
                  onChange={(e) => setAvailFilter(e.target.value)}
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800"
                >
                  <option value="all">Toda disponibilidade</option>
                  <option value="disponivel">Disponível</option>
                  <option value="reservado">Reservado</option>
                  <option value="esgotado">Esgotado</option>
                </select>

                <button
                  type="button"
                  onClick={openNewProduct}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-zinc-950 px-4 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="h-48 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
            ) : filteredAdminProducts.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
                <p className="text-sm text-zinc-600">
                  {products.length === 0
                    ? 'Nenhum aparelho cadastrado ainda.'
                    : 'Nenhum aparelho corresponde aos filtros selecionados.'}
                </p>
                {products.length === 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={openNewProduct}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Cadastrar primeiro aparelho
                    </button>
                    <button
                      type="button"
                      disabled={seeding}
                      onClick={handleManualSeed}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 cursor-pointer"
                    >
                      {seeding ? 'Carregando...' : 'Carregar aparelhos de exemplo'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Responsive Cards */}
                <div className="space-y-3 md:hidden">
                  {filteredAdminProducts.map((p) => {
                    const effAvail =
                      p.quantity === 0 ? 'esgotado' : p.availability;
                    return (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3"
                      >
                        <div className="flex gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                            {p.images?.[0]?.url ? (
                              <img
                                src={p.images[0].url}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                <Smartphone className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-sm font-bold text-zinc-950">
                              {p.name}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {p.brand} · {p.model}
                            </p>
                            <p className="mt-1 font-mono-nums text-sm font-bold text-zinc-950">
                              {formatBRL(p.price)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 border-t border-zinc-100 pt-2.5">
                          <span className="font-medium">
                            {PUBLISH_STATUS_LABELS[p.publishStatus]}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{AVAILABILITY_LABELS[effAvail]}</span>
                          <span aria-hidden="true">·</span>
                          <span>Atualizado {formatShortDate(p.updatedAt)}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => openEditProduct(p)}
                            className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDuplicateProduct(p)}
                            className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copiar</span>
                          </button>
                          <Link
                            href={`/produto/${p.id}`}
                            className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Ver</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                      <tr>
                        <th className="px-4 py-3">Aparelho</th>
                        <th className="px-4 py-3">Modelo</th>
                        <th className="px-4 py-3">Preço</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Alteração</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredAdminProducts.map((p) => {
                        const effAvail =
                          p.quantity === 0 ? 'esgotado' : p.availability;
                        return (
                          <tr key={p.id} className="hover:bg-zinc-50/70">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                                  {p.images?.[0]?.url ? (
                                    <img
                                      src={p.images[0].url}
                                      alt={p.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                                      <Smartphone className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-zinc-950">
                                    {p.name}
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    {p.brand}
                                    {p.storage ? ` · ${p.storage}` : ''}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-zinc-600">
                              {p.model}
                            </td>
                            <td className="px-4 py-3 font-mono-nums font-semibold text-zinc-950">
                              {formatBRL(p.price)}
                            </td>
                            <td className="px-4 py-3 text-xs text-zinc-700">
                              <span className="font-medium">
                                {PUBLISH_STATUS_LABELS[p.publishStatus]}
                              </span>
                              <span className="mx-1.5 text-zinc-300">·</span>
                              <span>{AVAILABILITY_LABELS[effAvail]}</span>
                            </td>
                            <td className="px-4 py-3 font-mono-nums text-xs text-zinc-500">
                              {formatShortDate(p.updatedAt)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditProduct(p)}
                                  className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDuplicateProduct(p)}
                                  className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                                  title="Duplicar"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Duplicar</span>
                                </button>
                                {p.publishStatus === 'publicado' && (
                                  <Link
                                    href={`/produto/${p.id}`}
                                    className="inline-flex h-9 items-center justify-center rounded-lg px-2 text-zinc-600 hover:bg-zinc-100"
                                    title="Ver página no site"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(p)}
                                  className="inline-flex h-9 items-center justify-center rounded-lg px-2 text-red-600 hover:bg-red-50 cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: FORMULÁRIO DE PRODUTO */}
        {activeTab === 'novo' && (
          <div className="mx-auto max-w-4xl">
            <ProductForm
              key={`${formMode}-${editingProduct?.id || 'new'}`}
              mode={formMode}
              initialProduct={editingProduct}
              onSaved={async (msg) => {
                await Promise.all([loadAdminCatalog(), refreshStoreData()]);
                setActiveTab('catalogo');
                showToast(msg);
              }}
              onCancel={() => setActiveTab('catalogo')}
            />
          </div>
        )}

        {/* TAB 4: PREÇOS RÁPIDOS */}
        {activeTab === 'precos' && (
          <QuickPriceEditor
            products={products}
            onSaved={async (msg) => {
              await Promise.all([loadAdminCatalog(), refreshStoreData()]);
              showToast(msg);
            }}
          />
        )}

        {/* TAB 5: CONFIGURAÇÕES DA LOJA */}
        {activeTab === 'configuracoes' && (
          <div className="mx-auto max-w-4xl">
            <StoreSettingsForm
              onSaved={(msg) => {
                showToast(msg);
              }}
            />
          </div>
        )}
      </main>

      {/* Delete / Archive Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-zinc-950">
              Remover aparelho do catálogo?
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Você selecionou{' '}
              <strong className="text-zinc-950">{deleteTarget.name}</strong> (
              {deleteTarget.model}). Você pode arquivá-lo para ocultar do site
              mantendo o histórico, ou excluí-lo definitivamente.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={handleArchiveInstead}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 cursor-pointer"
              >
                <Archive className="h-4 w-4" />
                Arquivar em vez de excluir
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Excluindo...' : 'Excluir definitivamente'}
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminAuthGate>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />
          </div>
        }
      >
        <AdminWorkspaceContent />
      </Suspense>
    </AdminAuthGate>
  );
}
