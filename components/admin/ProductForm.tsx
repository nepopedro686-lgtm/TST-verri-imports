'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Loader2,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import {
  Product,
  ProductAvailability,
  ProductCondition,
  ProductImage,
  ProductInput,
  PublishStatus,
} from '@/lib/types';
import { useStore } from '@/components/StoreProvider';
import {
  createProduct,
  deleteMediaAsset,
  saveCatalogMeta,
  updateProduct,
  uploadMediaAsset,
} from '@/lib/store-data';
import { formatBRL } from '@/lib/format';

interface ProductFormProps {
  mode: 'create' | 'edit' | 'duplicate';
  initialProduct?: Product | null;
  onSaved: (message: string) => void;
  onCancel: () => void;
}

export function ProductForm({
  mode,
  initialProduct,
  onSaved,
  onCancel,
}: ProductFormProps) {
  const { user, catalogMeta, refreshStoreData } = useStore();

  const [name, setName] = useState(() =>
    mode === 'duplicate' && initialProduct
      ? `${initialProduct.name} (Cópia)`
      : initialProduct?.name || ''
  );
  const [brand, setBrand] = useState(
    initialProduct?.brand || catalogMeta.brands[0] || 'Apple'
  );
  const [customBrand, setCustomBrand] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);

  const [model, setModel] = useState(initialProduct?.model || '');
  const [category, setCategory] = useState(
    initialProduct?.category || catalogMeta.categories[0] || 'Smartphones'
  );
  const [customCategory, setCustomCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const [sku, setSku] = useState(
    mode === 'duplicate' ? '' : initialProduct?.sku || ''
  );
  const [description, setDescription] = useState(
    initialProduct?.description || ''
  );

  const [storage, setStorage] = useState(initialProduct?.storage || '');
  const [ram, setRam] = useState(initialProduct?.ram || '');
  const [color, setColor] = useState(initialProduct?.color || '');
  const [condition, setCondition] = useState<ProductCondition>(
    initialProduct?.condition || 'seminovo'
  );
  const [includedAccessories, setIncludedAccessories] = useState(
    initialProduct?.includedAccessories || ''
  );
  const [specs, setSpecs] = useState(initialProduct?.specs || '');

  const [priceText, setPriceText] = useState(
    initialProduct ? String(initialProduct.price) : ''
  );
  const [previousPriceText, setPreviousPriceText] = useState(
    initialProduct?.previousPrice ? String(initialProduct.previousPrice) : ''
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialProduct?.paymentTerms || ''
  );
  const [warrantyInfo, setWarrantyInfo] = useState(
    initialProduct?.warrantyInfo || ''
  );
  const [commercialNotes, setCommercialNotes] = useState(
    initialProduct?.commercialNotes || ''
  );

  const [images, setImages] = useState<ProductImage[]>(
    initialProduct?.images || []
  );
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');

  const [availability, setAvailability] = useState<ProductAvailability>(
    initialProduct?.availability || 'disponivel'
  );
  const [quantityText, setQuantityText] = useState(
    initialProduct?.quantity !== null && initialProduct?.quantity !== undefined
      ? String(initialProduct.quantity)
      : ''
  );
  const [publishStatus, setPublishStatus] = useState<PublishStatus>(
    mode === 'duplicate'
      ? 'rascunho'
      : initialProduct?.publishStatus || 'publicado'
  );
  const [featured, setFeatured] = useState(
    Boolean(initialProduct?.featured)
  );
  const [isOffer, setIsOffer] = useState(Boolean(initialProduct?.isOffer));

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const numericPrice = Number(priceText.replace(',', '.'));
  const numericPrevPrice = previousPriceText
    ? Number(previousPriceText.replace(',', '.'))
    : null;

  const handleAddCustomBrand = async () => {
    const clean = customBrand.trim();
    if (!clean || !user) return;
    if (!catalogMeta.brands.includes(clean)) {
      await saveCatalogMeta(
        { ...catalogMeta, brands: [...catalogMeta.brands, clean] },
        user.uid
      );
      await refreshStoreData();
    }
    setBrand(clean);
    setCustomBrand('');
    setAddingBrand(false);
  };

  const handleAddCustomCategory = async () => {
    const clean = customCategory.trim();
    if (!clean || !user) return;
    if (!catalogMeta.categories.includes(clean)) {
      await saveCatalogMeta(
        { ...catalogMeta, categories: [...catalogMeta.categories, clean] },
        user.uid
      );
      await refreshStoreData();
    }
    setCategory(clean);
    setCustomCategory('');
    setAddingCategory(false);
  };

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0 || !user) return;

    if (images.length + files.length > 12) {
      setErrorMsg('Limite máximo de 12 fotografias por aparelho.');
      return;
    }

    setUploadingPhotos(true);
    setErrorMsg('');
    try {
      const uploaded: ProductImage[] = [];
      for (let i = 0; i < files.length; i++) {
        setUploadStatusText(
          `Processando foto ${i + 1} de ${files.length}...`
        );
        const asset = await uploadMediaAsset(
          files[i],
          user.uid,
          name || model || 'Fotografia do aparelho'
        );
        uploaded.push(asset);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Erro ao enviar fotografia. Tente outra imagem.'
      );
    } finally {
      setUploadingPhotos(false);
      setUploadStatusText('');
    }
  };

  const makePrimaryImage = (idx: number) => {
    if (idx === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [chosen] = copy.splice(idx, 1);
      return [chosen, ...copy];
    });
  };

  const moveImage = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const removeImage = async (idx: number) => {
    const target = images[idx];
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (mode !== 'duplicate' && target?.id) {
      try {
        await deleteMediaAsset(target.id);
      } catch {
        // Ignore cleanup failure if referenced elsewhere
      }
    }
  };

  const handleQuantityChange = (val: string) => {
    setQuantityText(val);
    if (val !== '' && Number(val) === 0 && availability === 'disponivel') {
      setAvailability('esgotado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || uploadingPhotos || !user) return;
    setErrorMsg('');

    if (!name.trim() || !brand.trim() || !model.trim() || !category.trim()) {
      setErrorMsg('Preencha nome, marca, modelo e categoria do aparelho.');
      return;
    }

    if (!priceText || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setErrorMsg('Informe um preço de venda numérico válido (maior ou igual a zero).');
      return;
    }

    if (
      previousPriceText &&
      (numericPrevPrice === null ||
        !Number.isFinite(numericPrevPrice) ||
        numericPrevPrice <= numericPrice)
    ) {
      setErrorMsg(
        'O preço anterior deve ser maior que o preço atual para caracterizar oferta.'
      );
      return;
    }

    const parsedQty =
      quantityText.trim() !== '' ? Math.floor(Number(quantityText)) : null;
    if (
      parsedQty !== null &&
      (!Number.isFinite(parsedQty) || parsedQty < 0)
    ) {
      setErrorMsg('A quantidade deve ser zero ou um número inteiro positivo.');
      return;
    }

    if (parsedQty === 0 && availability === 'disponivel') {
      setErrorMsg(
        'Aparelhos com quantidade zero não podem ficar marcados como Disponível.'
      );
      return;
    }

    const payload: ProductInput = {
      slug: '',
      name: name.trim(),
      brand: brand.trim(),
      model: model.trim(),
      category: category.trim(),
      description: description.trim(),
      sku: sku.trim(),
      storage: storage.trim(),
      ram: ram.trim(),
      color: color.trim(),
      condition,
      includedAccessories: includedAccessories.trim(),
      specs: specs.trim(),
      price: numericPrice,
      previousPrice:
        numericPrevPrice && numericPrevPrice > numericPrice
          ? numericPrevPrice
          : null,
      paymentTerms: paymentTerms.trim(),
      commercialNotes: commercialNotes.trim(),
      warrantyInfo: warrantyInfo.trim(),
      images,
      availability,
      quantity: parsedQty,
      publishStatus,
      featured,
      isOffer: isOffer && Boolean(numericPrevPrice && numericPrevPrice > numericPrice),
    };

    setIsSaving(true);
    try {
      if (mode === 'edit' && initialProduct) {
        await updateProduct(initialProduct.id, payload);
        onSaved('Aparelho atualizado com sucesso.');
      } else {
        await createProduct(payload, user.uid);
        onSaved(
          mode === 'duplicate'
            ? 'Cópia criada como novo aparelho.'
            : 'Novo aparelho salvo com sucesso.'
        );
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Erro ao salvar produto. Verifique sua conexão.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-zinc-950">
            {mode === 'edit'
              ? 'Editar aparelho'
              : mode === 'duplicate'
              ? 'Duplicar aparelho'
              : 'Cadastrar novo aparelho'}
          </h2>
          <p className="text-xs text-zinc-500">
            Preencha os dados reais do aparelho. Você pode salvar como rascunho ou publicar imediatamente.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMsg}
        </div>
      )}

      {/* 1. Fotografias Reais */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <h3 className="font-display text-base font-bold text-zinc-950">
          1. Fotografias reais do aparelho
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Envie fotos da galeria ou câmera do celular (JPEG, PNG ou WebP). A primeira foto será a capa do anúncio.
        </p>

        <div className="mt-4">
          <label className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800">
            {uploadingPhotos ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{uploadStatusText || 'Enviando...'}</span>
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                <span>Selecionar fotos da galeria</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={uploadingPhotos}
              onChange={handleFilesSelected}
              className="sr-only"
            />
          </label>
        </div>

        {images.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                className={`overflow-hidden rounded-xl border bg-zinc-50 ${
                  idx === 0 ? 'border-zinc-950 ring-1 ring-zinc-950' : 'border-zinc-200'
                }`}
              >
                <div className="relative aspect-[4/3] bg-zinc-100">
                  <img
                    src={img.url}
                    alt={img.alt || `Foto ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute left-2 top-2 rounded-md bg-zinc-950 px-2 py-0.5 text-[11px] font-semibold text-white">
                      Principal
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 p-1.5">
                  <button
                    type="button"
                    onClick={() => moveImage(idx, -1)}
                    disabled={idx === 0}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-200 disabled:opacity-30 cursor-pointer"
                    aria-label="Mover foto para esquerda"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => makePrimaryImage(idx)}
                      className="flex h-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                      title="Definir como principal"
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span>Capa</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => moveImage(idx, 1)}
                    disabled={idx === images.length - 1}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-200 disabled:opacity-30 cursor-pointer"
                    aria-label="Mover foto para direita"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                    aria-label="Remover fotografia"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Informações Principais */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-zinc-950">
          2. Informações principais
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Nome do produto *
            </label>
            <input
              type="text"
              required
              maxLength={140}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: iPhone 15 Pro 256GB Titânio Natural"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                Marca *
              </label>
              <button
                type="button"
                onClick={() => setAddingBrand((v) => !v)}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-950 cursor-pointer"
              >
                + Nova marca
              </button>
            </div>
            {addingBrand ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="Nome da marca"
                  className="h-12 flex-1 rounded-xl border border-zinc-200 px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddCustomBrand}
                  className="h-12 rounded-xl bg-zinc-950 px-3 text-xs font-semibold text-white cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            ) : (
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
              >
                {Array.from(new Set([...catalogMeta.brands, brand])).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Modelo *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ex: A2848 / iPhone 15 Pro"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                Categoria *
              </label>
              <button
                type="button"
                onClick={() => setAddingCategory((v) => !v)}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-950 cursor-pointer"
              >
                + Nova categoria
              </button>
            </div>
            {addingCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Nome da categoria"
                  className="h-12 flex-1 rounded-xl border border-zinc-200 px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="h-12 rounded-xl bg-zinc-950 px-3 text-xs font-semibold text-white cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
              >
                {Array.from(new Set([...catalogMeta.categories, category])).map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Código interno / SKU (opcional)
            </label>
            <input
              type="text"
              maxLength={40}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Ex: VR-15PRO-256"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm font-mono-nums text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Descrição do aparelho
            </label>
            <textarea
              rows={3}
              maxLength={4000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva estado de conservação, saúde da bateria (se aplicável) e diferenciais reais do aparelho."
              className="w-full rounded-xl border border-zinc-200 p-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* 3. Características Técnicas */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-zinc-950">
          3. Características
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Armazenamento
            </label>
            <input
              type="text"
              maxLength={40}
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              placeholder="Ex: 128GB, 256GB"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Memória RAM
            </label>
            <input
              type="text"
              maxLength={40}
              value={ram}
              onChange={(e) => setRam(e.target.value)}
              placeholder="Ex: 8GB"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Cor
            </label>
            <input
              type="text"
              maxLength={50}
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Ex: Titânio Preto"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Condição *
            </label>
            <select
              value={condition}
              onChange={(e) =>
                setCondition(e.target.value as ProductCondition)
              }
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            >
              <option value="novo">Novo (Lacrado)</option>
              <option value="seminovo">Seminovo</option>
              <option value="usado">Usado</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Acessórios incluídos
            </label>
            <input
              type="text"
              maxLength={500}
              value={includedAccessories}
              onChange={(e) => setIncludedAccessories(e.target.value)}
              placeholder="Ex: Cabo USB-C original, caixa, película..."
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Especificações técnicas adicionais
            </label>
            <textarea
              rows={2}
              maxLength={2500}
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              placeholder="Tela, câmera, bateria, chip, conexões..."
              className="w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* 4. Preço e Condições Comerciais */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-zinc-950">
          4. Preço e condições
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Preço de venda (R$) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              inputMode="decimal"
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              placeholder="Ex: 4299.00"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm font-mono-nums text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
            {Number.isFinite(numericPrice) && numericPrice >= 0 && priceText && (
              <p className="mt-1 text-xs font-mono-nums text-zinc-500">
                Exibição no site: {formatBRL(numericPrice)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Preço anterior (opcional, apenas se em promoção real)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={previousPriceText}
              onChange={(e) => setPreviousPriceText(e.target.value)}
              placeholder="Deixe vazio se não houver desconto"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm font-mono-nums text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Condições de pagamento (opcional)
            </label>
            <input
              type="text"
              maxLength={300}
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Ex: À vista no PIX ou parcelamento no cartão"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Garantia informada pela loja (opcional)
            </label>
            <input
              type="text"
              maxLength={300}
              value={warrantyInfo}
              onChange={(e) => setWarrantyInfo(e.target.value)}
              placeholder="Ex: Garantia da loja ou fabricante"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Observações comerciais (opcional)
            </label>
            <input
              type="text"
              maxLength={500}
              value={commercialNotes}
              onChange={(e) => setCommercialNotes(e.target.value)}
              placeholder="Ex: Aceitamos seu iPhone usado na troca mediante avaliação"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* 5. Disponibilidade & Exibição */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-zinc-950">
          5. Estoque e publicação
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Disponibilidade *
            </label>
            <select
              value={availability}
              onChange={(e) =>
                setAvailability(e.target.value as ProductAvailability)
              }
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            >
              <option value="disponivel">Disponível</option>
              <option value="reservado">Reservado</option>
              <option value="esgotado">Esgotado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Quantidade (opcional)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={quantityText}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="Opcional"
              className="h-12 w-full rounded-xl border border-zinc-200 px-3.5 text-sm font-mono-nums text-zinc-950 focus:border-zinc-950 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Status de exibição *
            </label>
            <select
              value={publishStatus}
              onChange={(e) =>
                setPublishStatus(e.target.value as PublishStatus)
              }
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none"
            >
              <option value="publicado">Publicado (visível no site)</option>
              <option value="rascunho">Rascunho (oculto)</option>
              <option value="arquivado">Arquivado (oculto)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-6">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm text-zinc-800">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded accent-zinc-950"
            />
            <span>Exibir em destaque na página inicial</span>
          </label>

          <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm text-zinc-800">
            <input
              type="checkbox"
              checked={isOffer}
              onChange={(e) => setIsOffer(e.target.checked)}
              className="h-4 w-4 rounded accent-zinc-950"
            />
            <span>Incluir na seção de ofertas (requer preço anterior)</span>
          </label>
        </div>
      </section>

      {/* Sticky Bottom Action Bar on Mobile, Normal on Desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving || uploadingPhotos}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 sm:flex-initial cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                {mode === 'create' ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>
                  {mode === 'edit'
                    ? 'Salvar alterações'
                    : mode === 'duplicate'
                    ? 'Salvar cópia'
                    : 'Cadastrar aparelho'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
