import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="font-mono-nums text-xs font-semibold text-zinc-500">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-zinc-950 sm:text-3xl">
        Página não encontrada
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        O endereço acessado não existe ou foi movido. Explore nosso catálogo de
        aparelhos ou nossa assistência técnica.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800 whitespace-nowrap"
        >
          Voltar para o início
        </Link>
        <Link
          href="/catalogo"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 whitespace-nowrap"
        >
          Ver catálogo
        </Link>
      </div>
    </main>
  );
}
