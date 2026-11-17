'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { ArrowLeft, Lock, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useStore } from '@/components/StoreProvider';

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { user, authReady, isAdmin, settings } = useStore();
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('Login cancelado. Tente novamente quando estiver pronto.');
      } else {
        setErrorMsg(
          'Não foi possível entrar com o Google. Verifique se pop-ups estão liberados.'
        );
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />
          <p className="mt-3 text-sm text-zinc-600">
            Verificando acesso administrativo...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 text-white">
            <Lock className="h-5 w-5" />
          </div>

          <h1 className="mt-5 font-display text-2xl font-bold text-zinc-950">
            Painel Administrativo
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Entre com sua conta Google autorizada para gerenciar os aparelhos,
            fotografias, preços e configurações da loja{' '}
            <strong className="text-zinc-900">{settings.storeName}</strong>.
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>{signingIn ? 'Conectando...' : 'Entrar com Google'}</span>
          </button>

          <div className="mt-6 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
            <p>
              Somente contas autorizadas da loja conseguem alterar produtos ou
              configurações no banco de dados.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1.5 font-medium text-zinc-800 hover:text-zinc-950"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para a loja pública
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <h1 className="mt-5 font-display text-xl font-bold text-zinc-950">
            Acesso restrito ao proprietário
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            A conta <strong className="text-zinc-900">{user.email}</strong> não
            possui permissão administrativa para editar o catálogo da loja.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sair e entrar com outra conta
            </button>
            <Link
              href="/"
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Voltar para a loja
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
