'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Instagram, MapPin, Phone } from 'lucide-react';
import { useStore } from './StoreProvider';
import { WhatsAppButton } from './WhatsAppButton';

export function Footer() {
  const { settings } = useStore();
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const instagramHandle = settings.instagram?.trim();
  const instagramHref = instagramHandle
    ? instagramHandle.startsWith('http')
      ? instagramHandle
      : `https://instagram.com/${instagramHandle.replace(/^@/, '')}`
    : null;

  return (
    <footer className="border-t border-zinc-200 bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName}
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 rounded-lg object-cover border border-zinc-800"
                />
              ) : (
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 font-display text-lg font-bold border border-zinc-800"
                  style={{ color: settings.accentColor || '#00C9A7' }}
                >
                  {settings.storeName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="font-display text-xl font-bold tracking-tight text-white">
                {settings.storeName}
              </span>
            </div>
            {settings.tagline && (
              <p className="text-sm font-medium text-zinc-200">{settings.tagline}</p>
            )}
            <p className="text-sm leading-relaxed text-zinc-400">
              {settings.description}
            </p>
            <div className="pt-1">
              <WhatsAppButton variant="accent" label="Atendimento no WhatsApp" />
            </div>
          </div>

          {/* Col 2: Navigation & Policies */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-white">
              Navegação e Informações
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
                  Página inicial
                </Link>
              </li>
              <li>
                <Link
                  href="/catalogo"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Catálogo de aparelhos
                </Link>
              </li>
              <li>
                <Link
                  href="/assistencia"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Assistência técnica
                </Link>
              </li>
              <li>
                <a
                  href="/api/catalogo-pdf"
                  download="Verri-Imports-Catalogo.pdf"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Baixar catálogo em PDF
                </a>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Painel administrativo
                </Link>
              </li>
            </ul>
            {settings.commercialPolicies && (
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-xs font-medium text-zinc-300 mb-1">
                  Políticas da loja
                </p>
                <p className="text-xs leading-relaxed text-zinc-400 whitespace-pre-line">
                  {settings.commercialPolicies}
                </p>
              </div>
            )}
          </div>

          {/* Col 3: Configured Location & Socials */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-white">
              Atendimento e Canais
            </h3>
            <div className="space-y-3 text-sm text-zinc-400">
              {settings.address ? (
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                  <span className="whitespace-pre-line">{settings.address}</span>
                </div>
              ) : null}

              {settings.openingHours ? (
                <div className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                  <span>{settings.openingHours}</span>
                </div>
              ) : null}

              {settings.phone ? (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span className="font-mono-nums">{settings.phone}</span>
                </div>
              ) : null}

              {instagramHref && (
                <a
                  href={instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-zinc-200 hover:text-white transition-colors"
                >
                  <Instagram className="h-4 w-4 shrink-0" />
                  <span>{instagramHandle}</span>
                </a>
              )}

              {settings.otherSocials ? (
                <p className="text-xs text-zinc-400 whitespace-pre-line">
                  {settings.otherSocials}
                </p>
              ) : null}

              {!settings.address &&
                !settings.openingHours &&
                !settings.phone &&
                !instagramHref && (
                  <p className="text-xs text-zinc-500">
                    Endereço, horários e telefone podem ser configurados no Painel
                    Administrativo.
                  </p>
                )}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-zinc-800 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. Todos os direitos
            reservados.
          </p>
          {settings.customDomain && (
            <p className="font-mono-nums text-zinc-500">{settings.customDomain}</p>
          )}
        </div>
      </div>
    </footer>
  );
}
