import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="card w-full max-w-lg p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-sky-300">No encontrado</p>
        <h1 className="mt-3 text-3xl font-bold text-white">La ruta no existe</h1>
        <p className="muted mt-3 text-sm">Revisa la dirección o vuelve al inicio del portal.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link className="btn btn-primary" href="/">
            Ir al inicio
          </Link>
          <Link className="btn btn-secondary" href="/login">
            Ir al acceso
          </Link>
        </div>
      </div>
    </main>
  );
}
