export default function ProductLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 h-5 w-48 animate-pulse rounded-lg bg-zinc-200" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="aspect-[4/3] animate-pulse rounded-2xl bg-zinc-200 lg:col-span-7" />
        <div className="h-96 animate-pulse rounded-2xl bg-zinc-200 lg:col-span-5" />
      </div>
    </main>
  );
}
