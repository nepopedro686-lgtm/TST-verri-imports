'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, X } from 'lucide-react';
import { useStore } from './StoreProvider';
import { WhatsAppButton } from './WhatsAppButton';

export function Header() {
  const { settings } = useStore();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin route uses its own dedicated mobile-first workspace header
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/assistencia', label: 'Assistência' },
    { href: '/#destaques', label: 'Destaques' },
    { href: '/admin', label: 'Painel' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Brand wordmark (single line, no descriptor/subtitle attached) */}
        <Link
          href="/"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded-lg"
        >
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.storeName}
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-lg object-cover border border-zinc-200"
            />
          ) : (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 font-display text-base font-bold tracking-tight"
              style={{ color: settings.accentColor || '#00C9A7' }}
            >
              {settings.storeName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="font-display text-lg font-bold tracking-tight text-zinc-950">
            {settings.storeName}
          </span>
        </Link>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navegação principal">
          {navLinks.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href.replace('/#destaques', '/__none'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap shrink-0 text-sm font-medium transition-colors hover:text-zinc-950 ${
                  isActive
                    ? 'text-zinc-950 underline decoration-2 underline-offset-8'
                    : 'text-zinc-600'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action (desktop) + mobile menu toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:block">
            <WhatsAppButton variant="dark" label="WhatsApp" className="py-2 px-4 text-xs" />
          </div>

          <Link
            href="/catalogo"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100 md:hidden"
            aria-label="Buscar aparelhos no catálogo"
          >
            <Search className="h-5 w-5" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100 md:hidden"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Menu mobile">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 text-base font-medium text-zinc-800 hover:bg-zinc-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 border-t border-zinc-100 pt-3">
            <WhatsAppButton variant="accent" fullWidth label="Falar no WhatsApp" />
          </div>
        </div>
      )}
    </header>
  );
}
