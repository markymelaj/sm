create extension if not exists pgcrypto;

create or replace function public.normalize_identifier(input text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(input, ''), '[^0-9A-Za-z]', '', 'g'));
$$;

create or replace function public.clean_rut(input text)
returns text
language sql
immutable
as $$
  select public.normalize_identifier(input);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  identificador text not null unique,
  rut text unique,
  nombre_completo text not null,
  email text,
  parcela text,
  rol text not null default 'cliente' check (rol in ('admin', 'auditor', 'cliente')),
  requiere_cambio_pass boolean not null default true,
  activo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint perfiles_identificador_clean_chk check (identificador = public.normalize_identifier(identificador)),
  constraint perfiles_rut_clean_chk check (rut is null or rut = public.clean_rut(rut))
);

create table if not exists public.fichas_cliente (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null unique references public.perfiles(id) on delete cascade,
  titular_parcela text,
  rut_titular text,
  numero_rol_parcela text,
  numero_parcela text,
  parcela text,
  telefono text,
  email_contacto text,
  direccion_referencia text,
  observaciones text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ficha_rut_titular_clean_chk check (rut_titular is null or rut_titular = public.clean_rut(rut_titular))
);

create table if not exists public.ficha_estado_tipos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  etiqueta text not null,
  tipo_input text not null check (tipo_input in ('boolean', 'text', 'select', 'date')),
  opciones_json jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 50,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ficha_estado_valores (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null references public.fichas_cliente(id) on delete cascade,
  estado_tipo_id uuid not null references public.ficha_estado_tipos(id) on delete cascade,
  valor_bool boolean,
  valor_texto text,
  valor_fecha date,
  observacion text,
  updated_by uuid references public.perfiles(id) on delete restrict,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (ficha_id, estado_tipo_id)
);

create table if not exists public.seguimiento_parcela (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null unique references public.perfiles(id) on delete cascade,
  ficha_id uuid not null unique references public.fichas_cliente(id) on delete cascade,
  avance_particular text,
  updated_by uuid references public.perfiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cuotas (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  concepto text not null,
  monto_total numeric(12,2) not null check (monto_total > 0),
  fecha_vencimiento date not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_revision', 'pagado', 'rechazado')),
  comprobante_url text,
  motivo_rechazo text,
  transaccion_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cuota_auditorias (
  id uuid primary key default gen_random_uuid(),
  cuota_id uuid not null references public.cuotas(id) on delete cascade,
  actor_id uuid not null references public.perfiles(id) on delete restrict,
  accion text not null,
  detalle text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.avances_obra (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  fecha date not null default current_date,
  created_by uuid not null references public.perfiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  creada_por uuid not null references public.perfiles(id) on delete restrict,
  tipo text not null check (tipo in ('consulta', 'indicacion', 'solicitud')),
  asunto text not null,
  detalle_inicial text not null,
  estado text not null default 'abierta' check (estado in ('abierta', 'en_revision', 'aprobada', 'rechazada', 'respondida', 'cerrada')),
  prioridad text not null default 'media' check (prioridad in ('baja', 'media', 'alta')),
  categoria text,
  motivo_rechazo text,
  revisada_por uuid references public.perfiles(id) on delete restrict,
  fecha_revision timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.solicitud_mensajes (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes(id) on delete cascade,
  autor_id uuid not null references public.perfiles(id) on delete restrict,
  mensaje text not null,
  es_interno boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.perfiles(id) on delete restrict,
  entidad text not null,
  entidad_id uuid,
  accion text not null,
  detalle jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_perfiles_rol on public.perfiles(rol);
create index if not exists idx_perfiles_identificador on public.perfiles(identificador);
create index if not exists idx_fichas_perfil on public.fichas_cliente(perfil_id);
create index if not exists idx_estado_valores_ficha on public.ficha_estado_valores(ficha_id);
create index if not exists idx_cuotas_perfil on public.cuotas(perfil_id);
create index if not exists idx_cuotas_estado on public.cuotas(estado);
create index if not exists idx_avances_fecha on public.avances_obra(fecha desc);
create index if not exists idx_solicitudes_perfil on public.solicitudes(perfil_id);
create index if not exists idx_solicitudes_estado on public.solicitudes(estado);
create index if not exists idx_solicitud_mensajes_solicitud on public.solicitud_mensajes(solicitud_id);
create index if not exists idx_audit_log_entidad on public.audit_log(entidad, entidad_id);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles where id = auth.uid() and rol = 'admin' and activo = true
  );
$$;

create or replace function public.is_internal_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles where id = auth.uid() and rol in ('admin', 'auditor') and activo = true
  );
$$;

create or replace function public.mark_password_changed()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  perform set_config('app.allow_password_change', '1', true);

  update public.perfiles
  set requiere_cambio_pass = false
  where id = auth.uid();

  return true;
end;
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_internal_user() to authenticated;
grant execute on function public.mark_password_changed() to authenticated;


create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  incoming_identifier text;
  incoming_rut text;
  incoming_name text;
  incoming_email text;
  incoming_parcela text;
  incoming_role text;
  incoming_requires_change boolean;
  incoming_active boolean;
  ficha_uuid uuid;
begin
  incoming_identifier := public.normalize_identifier(coalesce(new.raw_user_meta_data ->> 'identificador', new.raw_user_meta_data ->> 'rut', split_part(new.email, '@', 1)));
  incoming_rut := case
    when coalesce(new.raw_user_meta_data ->> 'rut', '') <> '' then public.clean_rut(new.raw_user_meta_data ->> 'rut')
    when coalesce(new.raw_user_meta_data ->> 'rol', 'cliente') = 'cliente' then incoming_identifier
    else null
  end;
  incoming_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre_completo'), ''), 'Usuario sin nombre');
  incoming_email := nullif(trim(coalesce(new.raw_user_meta_data ->> 'email', '')), '');
  incoming_parcela := nullif(trim(coalesce(new.raw_user_meta_data ->> 'parcela', '')), '');
  incoming_role := coalesce(nullif(new.raw_user_meta_data ->> 'rol', ''), 'cliente');
  incoming_requires_change := coalesce((new.raw_user_meta_data ->> 'requiere_cambio_pass')::boolean, true);
  incoming_active := coalesce((new.raw_user_meta_data ->> 'activo')::boolean, true);

  insert into public.perfiles (
    id, identificador, rut, nombre_completo, email, parcela, rol, requiere_cambio_pass, activo
  )
  values (
    new.id,
    incoming_identifier,
    incoming_rut,
    incoming_name,
    incoming_email,
    incoming_parcela,
    case when incoming_role in ('admin', 'auditor', 'cliente') then incoming_role else 'cliente' end,
    incoming_requires_change,
    incoming_active
  )
  on conflict (id) do update
  set identificador = excluded.identificador,
      rut = excluded.rut,
      nombre_completo = excluded.nombre_completo,
      email = excluded.email,
      parcela = excluded.parcela,
      rol = excluded.rol,
      requiere_cambio_pass = excluded.requiere_cambio_pass,
      activo = excluded.activo;

  if incoming_role = 'cliente' then
    insert into public.fichas_cliente (perfil_id, parcela)
    values (new.id, incoming_parcela)
    on conflict (perfil_id) do update set parcela = excluded.parcela
    returning id into ficha_uuid;

    if ficha_uuid is null then
      select id into ficha_uuid from public.fichas_cliente where perfil_id = new.id;
    end if;

    insert into public.seguimiento_parcela (perfil_id, ficha_id)
    values (new.id, ficha_uuid)
    on conflict (perfil_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.protect_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if auth.uid() is null or auth.uid() <> old.id then
    raise exception 'No autorizado';
  end if;

  if new.identificador is distinct from old.identificador
     or new.rut is distinct from old.rut
     or new.rol is distinct from old.rol
     or new.activo is distinct from old.activo
     or new.nombre_completo is distinct from old.nombre_completo
     or new.email is distinct from old.email
     or new.parcela is distinct from old.parcela then
    raise exception 'No puedes modificar tu perfil directamente';
  end if;

  if new.requiere_cambio_pass is distinct from old.requiere_cambio_pass
     and current_setting('app.allow_password_change', true) is distinct from '1' then
    raise exception 'No puedes cambiar este campo directamente';
  end if;

  return new;
end;
$$;

create or replace function public.protect_cliente_quota_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_internal_user() then
    return new;
  end if;

  if auth.uid() is null or auth.uid() <> old.perfil_id then
    raise exception 'No autorizado';
  end if;

  if old.estado not in ('pendiente', 'rechazado') then
    raise exception 'La cuota no admite cambios del cliente';
  end if;

  if new.perfil_id is distinct from old.perfil_id
     or new.concepto is distinct from old.concepto
     or new.monto_total is distinct from old.monto_total
     or new.fecha_vencimiento is distinct from old.fecha_vencimiento
     or new.motivo_rechazo is distinct from old.motivo_rechazo then
    raise exception 'No puedes modificar datos internos de la cuota';
  end if;

  if new.estado not in ('en_revision', old.estado) then
    raise exception 'Solo puedes enviar la cuota a revisión';
  end if;

  return new;
end;
$$;

create or replace function public.can_access_comprobante(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  folders text[];
begin
  if public.is_internal_user() then
    return true;
  end if;

  if auth.uid() is null then
    return false;
  end if;

  folders := storage.foldername(object_name);

  if array_length(folders, 1) < 2 then
    return false;
  end if;

  return exists (
    select 1
    from public.cuotas c
    where folders[1] = auth.uid()::text
      and folders[2] = c.id::text
      and c.perfil_id = auth.uid()
  );
end;
$$;

grant execute on function public.can_access_comprobante(text) to authenticated;

drop trigger if exists set_perfiles_updated_at on public.perfiles;
create trigger set_perfiles_updated_at before update on public.perfiles for each row execute function public.set_updated_at();
drop trigger if exists set_fichas_updated_at on public.fichas_cliente;
create trigger set_fichas_updated_at before update on public.fichas_cliente for each row execute function public.set_updated_at();
drop trigger if exists set_estado_valores_updated_at on public.ficha_estado_valores;
create trigger set_estado_valores_updated_at before update on public.ficha_estado_valores for each row execute function public.set_updated_at();
drop trigger if exists set_seguimiento_updated_at on public.seguimiento_parcela;
create trigger set_seguimiento_updated_at before update on public.seguimiento_parcela for each row execute function public.set_updated_at();
drop trigger if exists set_cuotas_updated_at on public.cuotas;
create trigger set_cuotas_updated_at before update on public.cuotas for each row execute function public.set_updated_at();
drop trigger if exists set_solicitudes_updated_at on public.solicitudes;
create trigger set_solicitudes_updated_at before update on public.solicitudes for each row execute function public.set_updated_at();

drop trigger if exists protect_profile_update on public.perfiles;
create trigger protect_profile_update before update on public.perfiles for each row execute function public.protect_profile_update();
drop trigger if exists protect_cliente_quota_update on public.cuotas;
create trigger protect_cliente_quota_update before update on public.cuotas for each row execute function public.protect_cliente_quota_update();

alter table public.perfiles enable row level security;
alter table public.fichas_cliente enable row level security;
alter table public.ficha_estado_tipos enable row level security;
alter table public.ficha_estado_valores enable row level security;
alter table public.seguimiento_parcela enable row level security;
alter table public.cuotas enable row level security;
alter table public.cuota_auditorias enable row level security;
alter table public.avances_obra enable row level security;
alter table public.solicitudes enable row level security;
alter table public.solicitud_mensajes enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists perfiles_select_self_or_internal on public.perfiles;
create policy perfiles_select_self_or_internal on public.perfiles
for select to authenticated
using (id = auth.uid() or public.is_internal_user());

drop policy if exists perfiles_update_admin_only on public.perfiles;
create policy perfiles_update_admin_only on public.perfiles
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists fichas_select_self_or_internal on public.fichas_cliente;
create policy fichas_select_self_or_internal on public.fichas_cliente
for select to authenticated
using (public.is_internal_user() or perfil_id = auth.uid());

drop policy if exists fichas_update_admin_only on public.fichas_cliente;
create policy fichas_update_admin_only on public.fichas_cliente
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists ficha_tipos_select_authenticated on public.ficha_estado_tipos;
create policy ficha_tipos_select_authenticated on public.ficha_estado_tipos
for select to authenticated
using (true);

drop policy if exists ficha_tipos_admin_mutation on public.ficha_estado_tipos;
create policy ficha_tipos_admin_mutation on public.ficha_estado_tipos
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists ficha_valores_select_self_or_internal on public.ficha_estado_valores;
create policy ficha_valores_select_self_or_internal on public.ficha_estado_valores
for select to authenticated
using (
  public.is_internal_user()
  or exists (
    select 1 from public.fichas_cliente fc where fc.id = ficha_id and fc.perfil_id = auth.uid()
  )
);

drop policy if exists ficha_valores_admin_mutation on public.ficha_estado_valores;
create policy ficha_valores_admin_mutation on public.ficha_estado_valores
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists seguimiento_select_self_or_internal on public.seguimiento_parcela;
create policy seguimiento_select_self_or_internal on public.seguimiento_parcela
for select to authenticated
using (public.is_internal_user() or perfil_id = auth.uid());

drop policy if exists seguimiento_update_admin_only on public.seguimiento_parcela;
create policy seguimiento_update_admin_only on public.seguimiento_parcela
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists cuotas_select_self_or_internal on public.cuotas;
create policy cuotas_select_self_or_internal on public.cuotas
for select to authenticated
using (public.is_internal_user() or perfil_id = auth.uid());

drop policy if exists cuotas_insert_internal on public.cuotas;
create policy cuotas_insert_internal on public.cuotas
for insert to authenticated
with check (public.is_internal_user());

drop policy if exists cuotas_update_internal on public.cuotas;
create policy cuotas_update_internal on public.cuotas
for update to authenticated
using (public.is_internal_user())
with check (public.is_internal_user());

drop policy if exists cuotas_update_owner on public.cuotas;
create policy cuotas_update_owner on public.cuotas
for update to authenticated
using (perfil_id = auth.uid())
with check (perfil_id = auth.uid());

drop policy if exists cuota_auditorias_internal on public.cuota_auditorias;
create policy cuota_auditorias_internal on public.cuota_auditorias
for all to authenticated
using (public.is_internal_user())
with check (public.is_internal_user());

drop policy if exists avances_select_authenticated on public.avances_obra;
create policy avances_select_authenticated on public.avances_obra
for select to authenticated
using (true);

drop policy if exists avances_admin_mutation on public.avances_obra;
create policy avances_admin_mutation on public.avances_obra
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists solicitudes_select_self_or_internal on public.solicitudes;
create policy solicitudes_select_self_or_internal on public.solicitudes
for select to authenticated
using (public.is_internal_user() or perfil_id = auth.uid());

drop policy if exists solicitudes_insert_owner_or_internal on public.solicitudes;
create policy solicitudes_insert_owner_or_internal on public.solicitudes
for insert to authenticated
with check (
  public.is_internal_user()
  or (perfil_id = auth.uid() and creada_por = auth.uid())
);

drop policy if exists solicitudes_update_internal on public.solicitudes;
create policy solicitudes_update_internal on public.solicitudes
for update to authenticated
using (public.is_internal_user())
with check (public.is_internal_user());

drop policy if exists solicitud_mensajes_select on public.solicitud_mensajes;
create policy solicitud_mensajes_select on public.solicitud_mensajes
for select to authenticated
using (
  public.is_internal_user()
  or (
    es_interno = false
    and exists (
      select 1 from public.solicitudes s where s.id = solicitud_id and s.perfil_id = auth.uid()
    )
  )
);

drop policy if exists solicitud_mensajes_insert on public.solicitud_mensajes;
create policy solicitud_mensajes_insert on public.solicitud_mensajes
for insert to authenticated
with check (
  public.is_internal_user()
  or (
    es_interno = false
    and autor_id = auth.uid()
    and exists (
      select 1 from public.solicitudes s where s.id = solicitud_id and s.perfil_id = auth.uid()
    )
  )
);

drop policy if exists audit_log_internal on public.audit_log;
create policy audit_log_internal on public.audit_log
for all to authenticated
using (public.is_internal_user())
with check (public.is_internal_user());

insert into public.ficha_estado_tipos (codigo, etiqueta, tipo_input, opciones_json, is_active, sort_order)
values
  ('inscripcion', 'Inscripción', 'boolean', null, true, 10),
  ('contrato_notaria', 'Contrato en notaría', 'boolean', null, true, 20),
  ('firmado_retiro', 'Firmado para retiro', 'boolean', null, true, 30)
on conflict (codigo) do update
set etiqueta = excluded.etiqueta,
    tipo_input = excluded.tipo_input,
    opciones_json = excluded.opciones_json,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprobantes',
  'comprobantes',
  false,
  3145728,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists comprobantes_select on storage.objects;
create policy comprobantes_select
on storage.objects
for select to authenticated
using (bucket_id = 'comprobantes' and public.can_access_comprobante(name));

drop policy if exists comprobantes_insert on storage.objects;
create policy comprobantes_insert
on storage.objects
for insert to authenticated
with check (bucket_id = 'comprobantes' and public.can_access_comprobante(name));

drop policy if exists comprobantes_update_internal on storage.objects;
create policy comprobantes_update_internal
on storage.objects
for update to authenticated
using (bucket_id = 'comprobantes' and public.is_internal_user())
with check (bucket_id = 'comprobantes' and public.is_internal_user());

drop policy if exists comprobantes_delete_internal on storage.objects;
create policy comprobantes_delete_internal
on storage.objects
for delete to authenticated
using (bucket_id = 'comprobantes' and public.is_internal_user());
