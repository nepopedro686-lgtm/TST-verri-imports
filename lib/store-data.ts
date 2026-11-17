import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  CatalogMeta,
  Product,
  ProductImage,
  ProductInput,
  StoreSettings,
} from './types';
import { DEFAULT_CATALOG_META, DEFAULT_STORE_SETTINGS } from './defaults';
import { SAMPLE_CATALOG_PRODUCTS } from './sample-catalog';
import { compressImageFile } from './image-compression';
import { slugify } from './format';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

function mapDocToProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    slug: String(data.slug || id),
    name: String(data.name || ''),
    brand: String(data.brand || ''),
    model: String(data.model || ''),
    category: String(data.category || ''),
    description: String(data.description || ''),
    sku: typeof data.sku === 'string' ? data.sku : '',
    storage: typeof data.storage === 'string' ? data.storage : '',
    ram: typeof data.ram === 'string' ? data.ram : '',
    color: typeof data.color === 'string' ? data.color : '',
    condition: (data.condition as Product['condition']) || 'seminovo',
    includedAccessories:
      typeof data.includedAccessories === 'string' ? data.includedAccessories : '',
    specs: typeof data.specs === 'string' ? data.specs : '',
    price: typeof data.price === 'number' ? data.price : 0,
    previousPrice:
      typeof data.previousPrice === 'number' ? data.previousPrice : null,
    paymentTerms:
      typeof data.paymentTerms === 'string' ? data.paymentTerms : '',
    commercialNotes:
      typeof data.commercialNotes === 'string' ? data.commercialNotes : '',
    warrantyInfo:
      typeof data.warrantyInfo === 'string' ? data.warrantyInfo : '',
    images: Array.isArray(data.images) ? (data.images as ProductImage[]) : [],
    availability:
      (data.availability as Product['availability']) || 'disponivel',
    quantity: typeof data.quantity === 'number' ? data.quantity : null,
    publishStatus:
      (data.publishStatus as Product['publishStatus']) || 'rascunho',
    featured: Boolean(data.featured),
    isOffer: Boolean(data.isOffer),
    ownerId: String(data.ownerId || ''),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function sanitizeProductPayload(input: ProductInput) {
  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('O preço de venda deve ser um número válido maior ou igual a zero.');
  }

  let previousPrice: number | null = null;
  if (input.previousPrice !== null && input.previousPrice !== undefined) {
    const prev = Number(input.previousPrice);
    if (Number.isFinite(prev) && prev > price) {
      previousPrice = prev;
    }
  }

  let quantity: number | null = null;
  if (input.quantity !== null && input.quantity !== undefined && String(input.quantity) !== '') {
    const qty = Math.floor(Number(input.quantity));
    if (!Number.isFinite(qty) || qty < 0) {
      throw new Error('A quantidade deve ser um número inteiro igual ou maior que zero.');
    }
    quantity = qty;
  }

  // Business rule: quantity === 0 cannot remain marked as 'disponivel'
  const availability =
    quantity === 0 && input.availability === 'disponivel'
      ? 'esgotado'
      : input.availability;

  const cleanImages = (input.images || []).slice(0, 12).map((img) => ({
    id: String(img.id || generateId('img')),
    url: String(img.url || '').slice(0, 500),
    alt: String(img.alt || input.name).slice(0, 160),
  }));

  return {
    slug: slugify(`${input.brand}-${input.name}-${input.storage || ''}`) || generateId('item'),
    name: input.name.trim().slice(0, 140),
    brand: input.brand.trim().slice(0, 60),
    model: input.model.trim().slice(0, 100),
    category: input.category.trim().slice(0, 60),
    description: (input.description || '').trim().slice(0, 4000),
    sku: (input.sku || '').trim().slice(0, 40),
    storage: (input.storage || '').trim().slice(0, 40),
    ram: (input.ram || '').trim().slice(0, 40),
    color: (input.color || '').trim().slice(0, 50),
    condition: input.condition,
    includedAccessories: (input.includedAccessories || '').trim().slice(0, 500),
    specs: (input.specs || '').trim().slice(0, 2500),
    price,
    previousPrice,
    paymentTerms: (input.paymentTerms || '').trim().slice(0, 300),
    commercialNotes: (input.commercialNotes || '').trim().slice(0, 500),
    warrantyInfo: (input.warrantyInfo || '').trim().slice(0, 300),
    images: cleanImages,
    availability,
    quantity,
    publishStatus: input.publishStatus,
    featured: Boolean(input.featured),
    isOffer: Boolean(input.isOffer) && previousPrice !== null,
  };
}

export function subscribePublishedProducts(
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'products'),
    where('publishStatus', '==', 'publicado')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) =>
        mapDocToProduct(d.id, d.data() as Record<string, unknown>)
      );
      items.sort((a, b) => {
        const ta = a.updatedAt?.getTime() || 0;
        const tb = b.updatedAt?.getTime() || 0;
        return tb - ta;
      });
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      else handleFirestoreError(error, OperationType.LIST, 'products');
    }
  );
}

export async function fetchPublishedProductsOnce(): Promise<Product[]> {
  try {
    const q = query(
      collection(db, 'products'),
      where('publishStatus', '==', 'publicado')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => mapDocToProduct(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
}

export async function fetchAllProductsAdmin(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    return snap.docs
      .map((d) => mapDocToProduct(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'products');
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const snap = await getDoc(doc(db, 'products', id));
    if (!snap.exists()) return null;
    return mapDocToProduct(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `products/${id}`);
  }
}

export async function createProduct(
  input: ProductInput,
  ownerUid: string
): Promise<Product> {
  const id = generateId('prod');
  const sanitized = sanitizeProductPayload(input);
  try {
    await setDoc(doc(db, 'products', id), {
      id,
      ...sanitized,
      ownerId: ownerUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const saved = await getDoc(doc(db, 'products', id));
    return mapDocToProduct(id, (saved.data() || {}) as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `products/${id}`);
  }
}

export async function updateProduct(
  productId: string,
  input: ProductInput
): Promise<void> {
  const sanitized = sanitizeProductPayload(input);
  try {
    await updateDoc(doc(db, 'products', productId), {
      ...sanitized,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
  }
}

export async function batchUpdateProducts(
  changes: Array<{
    product: Product;
    price: number;
    availability: Product['availability'];
  }>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const item of changes) {
      if (!Number.isFinite(item.price) || item.price < 0) {
        throw new Error(`Preço inválido para ${item.product.name}.`);
      }
      const nextAvailability =
        item.product.quantity === 0 && item.availability === 'disponivel'
          ? 'esgotado'
          : item.availability;
      const nextPreviousPrice =
        item.product.previousPrice && item.product.previousPrice > item.price
          ? item.product.previousPrice
          : null;
      const nextIsOffer = Boolean(item.product.isOffer) && nextPreviousPrice !== null;

      batch.update(doc(db, 'products', item.product.id), {
        price: item.price,
        previousPrice: nextPreviousPrice,
        isOffer: nextIsOffer,
        availability: nextAvailability,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'products/batch');
  }
}

export async function uploadMediaAsset(
  file: File,
  ownerUid: string,
  altText = 'Fotografia do aparelho'
): Promise<ProductImage> {
  const compressed = await compressImageFile(file);
  const mediaId = generateId('med');
  try {
    await setDoc(doc(db, 'media', mediaId), {
      id: mediaId,
      mimeType: compressed.mimeType,
      dataBase64: compressed.dataBase64,
      width: compressed.width,
      height: compressed.height,
      sizeBytes: compressed.sizeBytes,
      ownerId: ownerUid,
      createdAt: serverTimestamp(),
    });
    return {
      id: mediaId,
      url: `/api/media/${mediaId}`,
      alt: altText.slice(0, 160),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `media/${mediaId}`);
  }
}

export async function deleteMediaAsset(mediaId: string): Promise<void> {
  if (!mediaId.startsWith('med_')) return;
  try {
    await deleteDoc(doc(db, 'media', mediaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `media/${mediaId}`);
  }
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const snap = await getDoc(doc(db, 'storeSettings', 'main'));
    if (!snap.exists()) return DEFAULT_STORE_SETTINGS;
    const data = snap.data() as Record<string, unknown>;
    return {
      storeName: String(data.storeName || DEFAULT_STORE_SETTINGS.storeName),
      tagline: String(data.tagline || ''),
      description: String(data.description || ''),
      logoUrl: String(data.logoUrl || ''),
      accentColor: String(data.accentColor || DEFAULT_STORE_SETTINGS.accentColor),
      whatsappNumber: String(
        data.whatsappNumber || DEFAULT_STORE_SETTINGS.whatsappNumber
      ),
      phone: String(data.phone || DEFAULT_STORE_SETTINGS.phone),
      address: String(data.address || DEFAULT_STORE_SETTINGS.address),
      openingHours: String(data.openingHours || ''),
      instagram: String(data.instagram || ''),
      otherSocials: String(data.otherSocials || ''),
      heroTitle: String(data.heroTitle || DEFAULT_STORE_SETTINGS.heroTitle),
      heroSubtitle: String(data.heroSubtitle || DEFAULT_STORE_SETTINGS.heroSubtitle),
      commercialHighlights: Array.isArray(data.commercialHighlights)
        ? (data.commercialHighlights as string[])
        : DEFAULT_STORE_SETTINGS.commercialHighlights,
      commercialPolicies: String(data.commercialPolicies || ''),
      customDomain: String(data.customDomain || ''),
      updatedAt: toDate(data.updatedAt),
      updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'storeSettings/main');
  }
}

export async function saveStoreSettings(
  settings: StoreSettings,
  ownerUid: string
): Promise<void> {
  try {
    await setDoc(doc(db, 'storeSettings', 'main'), {
      storeName: settings.storeName.trim().slice(0, 80) || 'Loja de Celulares',
      tagline: (settings.tagline || '').trim().slice(0, 180),
      description: (settings.description || '').trim().slice(0, 1500),
      logoUrl: (settings.logoUrl || '').trim().slice(0, 500),
      accentColor: (settings.accentColor || '#00C9A7').trim().slice(0, 20),
      whatsappNumber: (settings.whatsappNumber || '').trim().slice(0, 25),
      phone: (settings.phone || '').trim().slice(0, 30),
      address: (settings.address || '').trim().slice(0, 300),
      openingHours: (settings.openingHours || '').trim().slice(0, 200),
      instagram: (settings.instagram || '').trim().slice(0, 120),
      otherSocials: (settings.otherSocials || '').trim().slice(0, 300),
      heroTitle: (settings.heroTitle || '').trim().slice(0, 140),
      heroSubtitle: (settings.heroSubtitle || '').trim().slice(0, 320),
      commercialHighlights: (settings.commercialHighlights || [])
        .map((s) => s.trim().slice(0, 160))
        .filter(Boolean)
        .slice(0, 6),
      commercialPolicies: (settings.commercialPolicies || '').trim().slice(0, 2000),
      customDomain: (settings.customDomain || '').trim().slice(0, 120),
      updatedAt: serverTimestamp(),
      updatedBy: ownerUid,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'storeSettings/main');
  }
}

export async function fetchCatalogMeta(): Promise<CatalogMeta> {
  try {
    const snap = await getDoc(doc(db, 'catalogMeta', 'taxonomy'));
    if (!snap.exists()) return DEFAULT_CATALOG_META;
    const data = snap.data() as Record<string, unknown>;
    return {
      brands: Array.isArray(data.brands)
        ? (data.brands as string[])
        : DEFAULT_CATALOG_META.brands,
      categories: Array.isArray(data.categories)
        ? (data.categories as string[])
        : DEFAULT_CATALOG_META.categories,
      updatedAt: toDate(data.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'catalogMeta/taxonomy');
  }
}

export async function saveCatalogMeta(
  meta: CatalogMeta,
  ownerUid: string
): Promise<void> {
  try {
    await setDoc(doc(db, 'catalogMeta', 'taxonomy'), {
      brands: Array.from(new Set(meta.brands.map((b) => b.trim()).filter(Boolean))).slice(0, 40),
      categories: Array.from(new Set(meta.categories.map((c) => c.trim()).filter(Boolean))).slice(0, 40),
      updatedAt: serverTimestamp(),
      updatedBy: ownerUid,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'catalogMeta/taxonomy');
  }
}

export async function checkCatalogMetaExists(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'catalogMeta', 'taxonomy'));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function seedSampleCatalogToFirestore(ownerUid: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'catalogMeta', 'taxonomy'), {
      brands: DEFAULT_CATALOG_META.brands,
      categories: DEFAULT_CATALOG_META.categories,
      updatedAt: serverTimestamp(),
      updatedBy: ownerUid,
    });

    for (const item of SAMPLE_CATALOG_PRODUCTS) {
      batch.set(doc(db, 'products', item.id), {
        id: item.id,
        slug: item.slug,
        name: item.name,
        brand: item.brand,
        model: item.model,
        category: item.category,
        description: item.description,
        sku: item.sku || '',
        storage: item.storage || '',
        ram: item.ram || '',
        color: item.color || '',
        condition: item.condition,
        includedAccessories: item.includedAccessories || '',
        specs: item.specs || '',
        price: item.price,
        previousPrice: item.previousPrice ?? null,
        paymentTerms: item.paymentTerms || '',
        commercialNotes: item.commercialNotes || '',
        warrantyInfo: item.warrantyInfo || '',
        images: item.images,
        availability: item.availability,
        quantity: item.quantity ?? null,
        publishStatus: item.publishStatus,
        featured: item.featured,
        isOffer: item.isOffer,
        ownerId: ownerUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products/seed');
  }
}

