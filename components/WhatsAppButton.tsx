'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from './StoreProvider';
import {
  buildGeneralWhatsAppMessage,
  buildProductWhatsAppMessage,
  formatWhatsAppUrl,
} from '@/lib/format';
import { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

interface WhatsAppButtonProps {
  product?: Product;
  customMessage?: string;
  label?: string;
  variant?: 'primary' | 'dark' | 'outline' | 'dark-outline' | 'accent';
  className?: string;
  fullWidth?: boolean;
}

export function WhatsAppButton({
  product,
  customMessage,
  label,
  variant = 'accent',
  className = '',
  fullWidth = false,
}: WhatsAppButtonProps) {
  const { settings, notifyMissingWhatsApp } = useStore();

  const message =
    customMessage ||
    (product
      ? buildProductWhatsAppMessage(product)
      : buildGeneralWhatsAppMessage(settings.storeName));

  const waUrl = formatWhatsAppUrl(settings.whatsappNumber, message);

  const defaultLabel = product
    ? product.availability === 'esgotado'
      ? 'Consultar reposição'
      : 'Consultar no WhatsApp'
    : 'Falar no WhatsApp';

  const variantClasses: Record<string, string> = {
    accent:
      'bg-[#00C9A7] text-zinc-950 hover:bg-[#00b596] font-semibold',
    dark: 'bg-zinc-950 text-white hover:bg-zinc-800 font-medium',
    primary: 'bg-[#16A34A] text-white hover:bg-[#15803D] font-semibold',
    outline:
      'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 font-medium',
    'dark-outline':
      'border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 font-medium',
  };

  const baseClass = cn(
    'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
    fullWidth && 'w-full',
    variantClasses[variant],
    className
  );

  const styleProp =
    variant === 'accent' && settings.accentColor
      ? { backgroundColor: settings.accentColor }
      : undefined;

  if (!waUrl) {
    return (
      <button
        type="button"
        onClick={notifyMissingWhatsApp}
        style={styleProp}
        className={baseClass}
      >
        <MessageCircle className="h-4 w-4 shrink-0" />
        <span>{label || defaultLabel}</span>
      </button>
    );
  }

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={styleProp}
      className={baseClass}
    >
      <MessageCircle className="h-4 w-4 shrink-0" />
      <span>{label || defaultLabel}</span>
    </a>
  );
}
