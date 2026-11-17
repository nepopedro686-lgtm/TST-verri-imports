import { CatalogMeta, StoreSettings } from './types';

export const ADMIN_BOOTSTRAP_EMAIL = 'pedronepo097@gmail.com';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Verri Imports',
  tagline: 'Especialistas em iPhones Novos, Seminovos, Áudio & Acessórios',
  description:
    'Catálogo digital oficial da loja. Consulte os aparelhos disponíveis em estoque, veja fotografias e fale diretamente com nossa equipe pelo WhatsApp.',
  logoUrl: '',
  accentColor: '#00C9A7',
  whatsappNumber: '(24) 99934-6217',
  phone: '(24) 99934-6217',
  address:
    'Av. Paulo de Frontin, 590 — Plaza Business Center, Loja 07\nAterrado, Volta Redonda - RJ · CEP 27215-580',
  openingHours: '',
  instagram: '@verri.imports',
  otherSocials: '',
  heroTitle: 'Smartphones e áudio com atendimento direto.',
  heroSubtitle:
    'Explore iPhones, Androids, fones e caixas de som disponíveis, compare especificações e negocie diretamente pelo WhatsApp.',
  commercialHighlights: [
    'iPhones e Androids novos e seminovos revisados',
    'Fones in-ear, headsets e caixas de som originais',
    'Atendimento consultivo direto pelo WhatsApp',
  ],
  commercialPolicies: '',
  customDomain: '',
};

export const DEFAULT_CATALOG_META: CatalogMeta = {
  brands: ['Apple', 'Samsung', 'Xiaomi', 'Motorola', 'JBL', 'Sony', 'QCY'],
  categories: [
    'iPhone',
    'Android',
    'Fones In-Ear',
    'Headset',
    'Caixas de Som',
    'Acessórios',
  ],
};

export const PHONE_CATEGORIES = new Set([
  'iPhone',
  'Android',
  'Smartphones',
  'Seminovos',
  'Celulares',
]);

export const CONDITION_LABELS: Record<string, string> = {
  novo: 'Novo',
  seminovo: 'Seminovo',
  usado: 'Usado',
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  esgotado: 'Esgotado',
};

export const PUBLISH_STATUS_LABELS: Record<string, string> = {
  publicado: 'Publicado',
  rascunho: 'Rascunho',
  arquivado: 'Arquivado',
};
