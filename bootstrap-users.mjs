import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const users = [
  {
    identificador: 'ADMIN',
    nombre: 'Administrador principal',
    rol: 'admin',
    password: 'Admin#Santa2026!'
  },
  {
    identificador: 'RTENORIO',
    nombre: 'René Tenorio',
    rol: 'auditor',
    password: 'Rtenorio#Obra2026!'
  }
];

const technicalEmail = (id) => `${id.toLowerCase()}@clientes.portal.local`;

async function upsertInternalUser(user) {
  const { data: profile } = await supabase
    .from('perfiles')
    .select('id')
    .eq('identificador', user.identificador)
    .maybeSingle();

  let userId = profile?.id ?? null;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: technicalEmail(user.identificador),
      password: user.password,
      emailConfirm: true,
      userMetadata: {
        identificador: user.identificador,
        nombre_completo: user.nombre,
        rol: user.rol,
        requiere_cambio_pass: false,
        activo: true
      }
    });

    if (error) throw error;
    userId = data.user?.id ?? null;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: user.password,
      userMetadata: {
        identificador: user.identificador,
        nombre_completo: user.nombre,
        rol: user.rol,
        requiere_cambio_pass: false,
        activo: true
      }
    });

    if (error) throw error;
  }

  const { error: profileError } = await supabase
    .from('perfiles')
    .update({
      identificador: user.identificador,
      nombre_completo: user.nombre,
      rol: user.rol,
      requiere_cambio_pass: false,
      activo: true,
      email: null,
      parcela: null
    })
    .eq('id', userId);

  if (profileError) throw profileError;

  return {
    identificador: user.identificador.toLowerCase(),
    password: user.password,
    rol: user.rol
  };
}

const output = [];
for (const user of users) {
  output.push(await upsertInternalUser(user));
}

fs.writeFileSync('credenciales-iniciales.json', JSON.stringify(output, null, 2));
console.log('Usuarios internos listos:');
console.table(output);
