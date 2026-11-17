export type ProductCondition = 'novo' | 'seminovo' | 'usado';
export type ProductAvailability = 'disponivel' | 'reservado' | 'esgotado';
export type PublishStatus = 'publicado' | 'rascunho' | 'arquivado';

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  description: string;
  sku?: string;
  storage?: string;
  ram?: string;
  color?: string;
  condition: ProductCondition;
  includedAccessories?: string;
  specs?: string;
  price: number;
  previousPrice?: number | null;
  paymentTerms?: string;
  commercialNotes?: string;
  warrantyInfo?: string;
  images: ProductImage[];
  availability: ProductAvailability;
  quantity?: number | null;
  publishStatus: PublishStatus;
  featured: boolean;
  isOffer: boolean;
  ownerId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type ProductInput = Omit<Product, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;

export interface StoreSettings {
  storeName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  accentColor: string;
  whatsappNumber: string;
  phone: string;
  address: string;
  openingHours: string;
  instagram: string;
  otherSocials: string;
  heroTitle: string;
  heroSubtitle: string;
  commercialHighlights: string[];
  commercialPolicies: string;
  customDomain: string;
  updatedAt?: Date | null;
  updatedBy?: string;
}

export interface CatalogMeta {
  brands: string[];
  categories: string[];
  updatedAt?: Date | null;
  updatedBy?: string;
}
