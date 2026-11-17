import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { StoreProvider } from '@/components/StoreProvider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageTransition } from '@/components/PageTransition';

const outfit = localFont({
  src: [
    { path: './fonts/outfit-latin-ext.woff2', weight: '500 700', style: 'normal' },
    { path: './fonts/outfit-latin.woff2', weight: '500 700', style: 'normal' },
  ],
  variable: '--font-outfit',
  display: 'swap',
});

const dmSans = localFont({
  src: [
    { path: './fonts/dm-sans-latin-ext.woff2', weight: '400 700', style: 'normal' },
    { path: './fonts/dm-sans-latin.woff2', weight: '400 700', style: 'normal' },
  ],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = localFont({
  src: [
    { path: './fonts/jetbrains-mono-latin-ext.woff2', weight: '500 700', style: 'normal' },
    { path: './fonts/jetbrains-mono-latin.woff2', weight: '500 700', style: 'normal' },
  ],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Verri Imports — Catálogo de Celulares e Acessórios',
    template: '%s | Verri Imports',
  },
  description:
    'Catálogo digital de smartphones novos e seminovos, áudio e acessórios com atendimento direto pelo WhatsApp.',
  openGraph: {
    title: 'Verri Imports — Catálogo de Celulares e Acessórios',
    description:
      'Catálogo digital de smartphones novos e seminovos, áudio e acessórios com atendimento direto pelo WhatsApp.',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verri Imports — Catálogo de Celulares e Acessórios',
    description:
      'Catálogo digital de smartphones novos e seminovos, áudio e acessórios com atendimento direto pelo WhatsApp.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${outfit.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning className="min-h-screen flex flex-col bg-[#FAFAFA] text-zinc-950">
        <StoreProvider>
          <Header />
          <PageTransition>{children}</PageTransition>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
