"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-50 p-6 text-stone-900">
      <p className="text-lg font-medium">No se pudo cargar esta página</p>
      <p className="max-w-md text-center text-sm text-stone-600">
        Revisa{" "}
        <a href="/api/health" className="underline">
          /api/health
        </a>
        . Si <code className="text-xs">schema</code> es false, falta aplicar
        migraciones en prod (<code className="text-xs">prisma migrate deploy</code>
        ).
      </p>
      {error.digest ? (
        <p className="text-xs text-stone-400">digest: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white"
      >
        Reintentar
      </button>
    </main>
  );
}
