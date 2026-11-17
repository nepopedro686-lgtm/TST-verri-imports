'use client';

import React, { useState } from 'react';
import {
  Check,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useStore } from '@/components/StoreProvider';
import {
  saveCatalogMeta,
  saveStoreSettings,
  uploadMediaAsset,
} from '@/lib/store-data';
import { formatWhatsAppUrl } from '@/lib/format';
import { StoreSettings } from '@/lib/types';

interface StoreSettingsFormProps {
  onSaved: (message: string) => void;
}

const ACCENT_PRESETS = [
  { label: 'Verri Teal', value: '#00C9A7' },
  { label: 'Esmeralda', value: '#10B981' },
  { label: 'Azul Cobalto', value: '#2563EB' },
  { label: 'Âmbar', value: '#F59E0B' },
  { label: 'Grafite', value: '#18181B' },
];

export function StoreSettingsForm({ onSaved }: StoreSettingsFormProps) {
  const { user, settings, catalogMeta, refreshStoreData } = useStore();

  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [highlightsText, setHighlightsText] = useState(
    (settings.commercialHighlights || []).join('\n')
  );

  const [brands, setBrands] = useState<string[]>(catalogMeta.brands);
  const [newBrand, setNewBrand] = useState('');
  const [categories, setCategories] = useState<string[]>(catalogMeta.categories);
  const [newCategory, setNewCategory] = useState('');

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const waTestUrl = formatWhatsAppUrl(
    form.whatsappNumber,
    `Olá! Teste de atendimento da loja ${form.storeName}.`
  );

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    setUploadingLogo(true);
    setErrorMsg('');
    try {
      const asset = await uploadMediaAsset(
        file,
        user.uid,
        `Logotipo ${form.storeName}`
      );
      setForm((prev) => ({ ...prev, logoUrl: asset.url }));
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Erro ao enviar logotipo.'
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const addBrand = () => {
    const clean = newBrand.trim();
    if (!clean || brands.includes(clean)) return;
    setBrands((prev) => [...prev, clean]);
    setNewBrand('');
  };

  const removeBrand = (target: string) => {
    setBrands((prev) => prev.filter((b) => b !== target));
  };

  const addCategory = () => {
    const clean = newCategory.trim();
    if (!clean || categories.includes(clean)) return;
    setCategories((prev) => [...prev, clean]);
    setNewCategory('');
  };

  const removeCategory = (target: string) => {
    setCategories((prev) => prev.filter((c) => c !== target));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !user) return;
    if (!form.storeName.trim()) {
      setErrorMsg('Informe o nome da loja.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      const highlights = highlightsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 6);

      await Promise.all([
        saveStoreSettings(
          {
            ...form,
            commercialHighlights: highlights,
          },
          user.uid
        ),
        saveCatalogMeta({ brands, categories }, user.uid),
      ]);
      await refreshStoreData();
      onSaved('Configurações da loja e marcas atualizadas.');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao salvar configurações.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20 sm:pb-8">
      <div>
        <h2 className="font-display text-xl font-bold text-zinc-950">
          Configurações da loja e identidade
        </h2>
        <p className="text-xs text-zinc-500">
          Qualquer alteração salva aqui atualiza automaticamente o site público e
          os links do WhatsApp.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {/* 1. Identidade & Logotipo */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-zinc-950">
          1. Identidade visual e logotipo
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Nome da loja *
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={form.storeName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, storeName: e.target.value }))
              }
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Slogan / Subtítulo curto
            </label>
            <input
              type="text"
              maxLength={180}
              value={form.tagline}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tagline: e.target.value }))
              }
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Logotipo da loja
            </label>
            <div className="flex items-center gap-3">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logotipo atual"
                  className="h-12 w-12 rounded-xl border border-zinc-200 object-cover"
                />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 font-display text-lg font-bold"
                  style={{ color: form.accentColor || '#00C9A7' }}
                >
                  {form.storeName.charAt(0).toUpperCase()}
                </div>
              )}

              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-xs font-semibold text-zinc-900 hover:bg-zinc-100">
                {uploadingLogo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>Enviar logo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="sr-only"
                />
              </label>

              {form.logoUrl && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, logoUrl: '' }))}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-red-600 hover:bg-red-50 cursor-pointer"
                  aria-label="Remover logotipo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Cor principal dos botões
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={form.accentColor || '#00C9A7'}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, accentColor: e.target.value }))
                }
                className="h-11 w-14 cursor-pointer rounded-xl border border-zinc-200 p-1"
              />
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, accentColor: preset.value }))
                  }
                  className="h-9 rounded-lg border border-zinc-200 px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Descrição institucional da empresa
            </label>
            <textarea
              rows={2}
              maxLength={1500}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* 2. WhatsApp, Contato & Endereço */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-zinc-950">
          2. WhatsApp, localização e canais
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Número do WhatsApp (com DDD)
            </label>
            <input
              type="tel"
              maxLength={25}
              value={form.whatsappNumber}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, whatsappNumber: e.target.value }))
              }
              placeholder="Ex: (24) 99999-9999 ou 5524999999999"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm font-mono-nums text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
            {waTestUrl ? (
              <a
                href={waTestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
              >
                <span>Testar link gerado ({waTestUrl.split('?')[0]})</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="mt-1 text-xs text-amber-700">
                Informe DDD + número para ativar os botões de WhatsApp do site.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Telefone exibido (opcional)
            </label>
            <input
              type="tel"
              maxLength={30}
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="Ex: (24) 99999-9999"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm font-mono-nums text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Endereço / Lojas físicas
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={form.address}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Informe o endereço real das lojas (ex: Rua, número, bairro, cidade)"
              className="w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Horários de funcionamento
            </label>
            <input
              type="text"
              maxLength={200}
              value={form.openingHours}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, openingHours: e.target.value }))
              }
              placeholder="Ex: Seg a Sex 09h às 18h · Sáb 09h às 13h"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Instagram
            </label>
            <input
              type="text"
              maxLength={120}
              value={form.instagram}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, instagram: e.target.value }))
              }
              placeholder="@sualoja"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Outras redes ou links comerciais
            </label>
            <input
              type="text"
              maxLength={300}
              value={form.otherSocials}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, otherSocials: e.target.value }))
              }
              placeholder="TikTok, Facebook ou canal de ofertas"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* 3. Textos da Página Inicial & Políticas */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-zinc-950">
          3. Apresentação e políticas
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Título principal da página inicial
            </label>
            <input
              type="text"
              maxLength={140}
              value={form.heroTitle}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, heroTitle: e.target.value }))
              }
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Subtítulo de apresentação
            </label>
            <textarea
              rows={2}
              maxLength={320}
              value={form.heroSubtitle}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, heroSubtitle: e.target.value }))
              }
              className="w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Diferenciais comerciais (um por linha, máximo 3 em destaque)
            </label>
            <textarea
              rows={3}
              value={highlightsText}
              onChange={(e) => setHighlightsText(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Informações comerciais e políticas (rodapé)
            </label>
            <textarea
              rows={2}
              maxLength={2000}
              value={form.commercialPolicies}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  commercialPolicies: e.target.value,
                }))
              }
              placeholder="Política de troca, retirada em loja ou envio..."
              className="w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Domínio próprio configurado (ex: www.sualoja.com.br)
            </label>
            <input
              type="text"
              maxLength={120}
              value={form.customDomain}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, customDomain: e.target.value }))
              }
              placeholder="www.sualoja.com.br"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm font-mono-nums text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* 4. Marcas e Categorias Administráveis */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-5">
        <h3 className="font-display text-base font-bold text-zinc-950">
          4. Marcas e categorias do catálogo
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">
              Marcas disponíveis
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Ex: Realme, Asus..."
                className="h-11 flex-1 rounded-xl border border-zinc-200 px-3 text-sm"
              />
              <button
                type="button"
                onClick={addBrand}
                className="inline-flex h-11 items-center gap-1 rounded-xl bg-zinc-950 px-3.5 text-xs font-semibold text-white cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-800"
                >
                  <span>{b}</span>
                  <button
                    type="button"
                    onClick={() => removeBrand(b)}
                    className="text-zinc-400 hover:text-red-600 cursor-pointer"
                    aria-label={`Remover marca ${b}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-2">
              Categorias disponíveis
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ex: Notebooks, Capinhas..."
                className="h-11 flex-1 rounded-xl border border-zinc-200 px-3 text-sm"
              />
              <button
                type="button"
                onClick={addCategory}
                className="inline-flex h-11 items-center gap-1 rounded-xl bg-zinc-950 px-3.5 text-xs font-semibold text-white cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-800"
                >
                  <span>{c}</span>
                  <button
                    type="button"
                    onClick={() => removeCategory(c)}
                    className="text-zinc-400 hover:text-red-600 cursor-pointer"
                    aria-label={`Remover categoria ${c}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || uploadingLogo}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 sm:w-auto cursor-pointer"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span>{saving ? 'Salvando...' : 'Salvar configurações da loja'}</span>
        </button>
      </div>
    </form>
  );
}
