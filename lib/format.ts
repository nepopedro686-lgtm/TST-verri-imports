import { Product } from './types';

export function formatBRL(value: number): string {
  if (!Number.isFinite(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function normalizeWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  // Prepend Brazil country code 55 if local DDD + number (10 or 11 digits)
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    return `55${digits}`;
  }
  return digits;
}

export function formatWhatsAppUrl(rawPhone: string, message: string): string | null {
  const digits = normalizeWhatsAppDigits(rawPhone);
  if (!digits || digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildGeneralWhatsAppMessage(storeName: string): string {
  return `Olá! Estou visitando o catálogo da ${storeName} e gostaria de tirar uma dúvida sobre os aparelhos disponíveis.`;
}

export function buildTechnicalSupportWhatsAppMessage(params: {
  brand: string;
  model: string;
  service: string;
  notes?: string;
}): string {
  const cleanModel = params.model.trim();
  const deviceLabel = cleanModel ? `${params.brand} ${cleanModel}` : params.brand;
  const parts = [
    `Olá! Gostaria de solicitar um orçamento na assistência técnica.`,
    `Aparelho: ${deviceLabel}`,
    `Serviço / Problema: ${params.service}`,
  ];
  if (params.notes?.trim()) {
    parts.push(`Detalhes: ${params.notes.trim()}`);
  }
  return parts.join('\n');
}

export function buildProductWhatsAppMessage(product: Product): string {
  const priceText = formatBRL(product.price);
  if (product.availability === 'esgotado') {
    return `Olá! Vi o ${product.name}, modelo ${product.model}, no catálogo (atualmente esgotado). Vocês têm previsão de reposição ou alguma opção semelhante?`;
  }
  if (product.availability === 'reservado') {
    return `Olá! Vi o ${product.name}, modelo ${product.model}, anunciado por ${priceText} (status: reservado). Caso fique disponível novamente ou tenham outra unidade, tenho interesse!`;
  }
  return `Olá! Tenho interesse no ${product.name}, modelo ${product.model}, anunciado por ${priceText}. Ele ainda está disponível?`;
}

export function formatShortDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function parseNumericStorageGB(storage?: string): number {
  if (!storage) return 0;
  const upper = storage.toUpperCase();
  const num = parseFloat(upper.replace(',', '.').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num)) return 0;
  if (upper.includes('TB')) return num * 1024;
  return num;
}
