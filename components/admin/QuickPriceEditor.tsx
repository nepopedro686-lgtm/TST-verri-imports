'use client';

import React, { useMemo, useState } from 'react';
import { Check, Loader2, Smartphone } from 'lucide-react';
import { Product, ProductAvailability } from '@/lib/types';
import { formatBRL } from '@/lib/format';
import { batchUpdateProducts } from '@/lib/store-data';

interface QuickPriceEditorProps {
  products: Product[];
  onSaved: (message: string) => void;
}

interface DraftEdit {
  priceText: string;
  availability: ProductAvailability;
}

export function QuickPriceEditor({ products, onSaved }: QuickPriceEditorProps) {
  const [edits, setEdits] = useState<Record<string, DraftEdit>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getDraft = (p: Product): DraftEdit => {
    return (
      edits[p.id] || {
        priceText: String(p.price),
        availability: p.availability,
      }
    );
  };

  const updateDraft = (p: Product, patch: Partial<DraftEdit>) => {
    const current = getDraft(p);
    setEdits((prev) => ({
      ...prev,
      [p.id]: { ...current, ...patch },
    }));
  };

  const pendingChanges = useMemo(() => {
    const list: Array<{
      product: Product;
      price: number;
      availability: ProductAvailability;
    }> = [];

    for (const p of products) {
      const draft = edits[p.id];
      if (!draft) continue;
      const parsedPrice = Number(draft.priceText.replace(',', '.'));
      const priceChanged =
        Number.isFinite(parsedPrice) && parsedPrice !== p.price;
      const availChanged = draft.availability !== p.availability;
      if (priceChanged || availChanged) {
        list.push({
          product: p,
          price: parsedPrice,
          availability: draft.availability,
        });
      }
    }
    return list;
  }, [products, edits]);

  const handleOpenConfirm = () => {
    setErrorMsg('');
    for (const item of pendingChanges) {
      if (!Number.isFinite(item.price) || item.price < 0) {
        setErrorMsg(`Preço inválido em "${item.product.name}".`);
        return;
      }
      if (item.product.quantity === 0 && item.availability === 'disponivel') {
        setErrorMsg(
          `"${item.product.name}" possui quantidade 0 e não pode ficar Disponível.`
        );
        return;
      }
    }
    setConfirmOpen(true);
  };

  const handleCommitBatch = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      await batchUpdateProducts(pendingChanges);
      setEdits({});
      setConfirmOpen(false);
      onSaved(
        `${pendingChanges.length} ${
          pendingChanges.length === 1
            ? 'aparelho atualizado'
            : 'aparelhos atualizados'
        } com sucesso.`
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar as alterações em lote.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
        <p className="text-sm text-zinc-600">
          Cadastre pelo menos um aparelho para utilizar a atualização rápida de
          preços.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-zinc-950">
            Atualização rápida de preços e estoque
          </h2>
          <p className="text-xs text-zinc-500">
            Altere preços e disponibilidade diretamente na lista e confirme antes
            de salvar.
          </p>
        </div>

        <button
          type="button"
          disabled={pendingChanges.length === 0}
          onClick={handleOpenConfirm}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 cursor-pointer whitespace-nowrap"
        >
          <Check className="h-4 w-4" />
          <span>Salvar alterações ({pendingChanges.length})</span>
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Responsive Cards on Mobile + Table on Desktop */}
      <div className="space-y-3 md:hidden">
        {products.map((p) => {
          const draft = getDraft(p);
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
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
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-950">
                    {p.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{p.model}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={draft.priceText}
                    onChange={(e) =>
                      updateDraft(p, { priceText: e.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm font-mono-nums text-zinc-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Disponibilidade
                  </label>
                  <select
                    value={draft.availability}
                    onChange={(e) =>
                      updateDraft(p, {
                        availability: e.target.value as ProductAvailability,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-2.5 text-sm text-zinc-950"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="reservado">Reservado</option>
                    <option value="esgotado">Esgotado</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
            <tr>
              <th className="px-4 py-3">Aparelho</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Preço (R$)</th>
              <th className="px-4 py-3">Disponibilidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.map((p) => {
              const draft = getDraft(p);
              return (
                <tr key={p.id} className="hover:bg-zinc-50/60">
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
                      <span className="font-medium text-zinc-950">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{p.model}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={draft.priceText}
                      onChange={(e) =>
                        updateDraft(p, { priceText: e.target.value })
                      }
                      className="h-10 w-36 rounded-lg border border-zinc-200 px-3 text-sm font-mono-nums text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={draft.availability}
                      onChange={(e) =>
                        updateDraft(p, {
                          availability: e.target.value as ProductAvailability,
                        })
                      }
                      className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    >
                      <option value="disponivel">Disponível</option>
                      <option value="reservado">Reservado</option>
                      <option value="esgotado">Esgotado</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-zinc-950">
              Confirmar alterações em massa
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Revise os novos valores antes de atualizar o catálogo público:
            </p>

            <div className="mt-4 max-h-64 divide-y divide-zinc-100 overflow-y-auto rounded-xl border border-zinc-200">
              {pendingChanges.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
                >
                  <span className="font-medium text-zinc-900 truncate">
                    {item.product.name}
                  </span>
                  <div className="shrink-0 text-right font-mono-nums">
                    <span className="text-zinc-400 line-through mr-2">
                      {formatBRL(item.product.price)}
                    </span>
                    <span className="font-bold text-zinc-950">
                      {formatBRL(item.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmOpen(false)}
                className="min-h-[44px] rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleCommitBatch}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 cursor-pointer"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar atualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
