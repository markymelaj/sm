import Link from 'next/link';

import { LogoutButton } from '@/components/logout-button';
import type { SessionProfile } from '@/lib/auth';
import { formatIdentifier } from '@/lib/format';

export function AppHeader({
  profile,
  title,
  subtitle,
  links
}: {
  profile: SessionProfile;
  title: string;
  subtitle: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="container-shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-sky-300">Santa Magdalena</p>
          <h1 className="mt-1 break-words text-2xl font-bold text-white">{title}</h1>
          <p className="muted mt-1 break-words text-sm">
            {subtitle} · Usuario: {formatIdentifier(profile.identificador)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link className="btn btn-secondary" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
