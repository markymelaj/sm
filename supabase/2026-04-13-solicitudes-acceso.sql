create table if not exists public.solicitudes_acceso (
  id uuid primary key default gen_random_uuid(),
  rut text not null,
  parcela text not null,
  nombre_completo text not null,
  telefono text not null,
  email text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  observacion_admin text,
  perfil_id uuid references public.perfiles(id) on delete set null,
  processed_by uuid references public.perfiles(id) on delete restrict,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint solicitudes_acceso_rut_clean_chk check (rut = public.clean_rut(rut))
);

create index if not exists idx_solicitudes_acceso_estado on public.solicitudes_acceso(estado);
create index if not exists idx_solicitudes_acceso_rut on public.solicitudes_acceso(rut);
create index if not exists idx_solicitudes_acceso_parcela on public.solicitudes_acceso(parcela);

drop trigger if exists set_solicitudes_acceso_updated_at on public.solicitudes_acceso;
create trigger set_solicitudes_acceso_updated_at
before update on public.solicitudes_acceso
for each row execute function public.set_updated_at();

alter table public.solicitudes_acceso enable row level security;

drop policy if exists solicitudes_acceso_admin_only on public.solicitudes_acceso;
create policy solicitudes_acceso_admin_only on public.solicitudes_acceso
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
