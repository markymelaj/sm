"use server";

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export async function changePasswordAction(_: { error?: string } | undefined, formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (password.length < 8) {
    return { error: 'La nueva contraseña debe tener al menos 8 caracteres.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' };
  }

  const supabase = await createClient();

  const { error: authError } = await supabase.auth.updateUser({ password });
  if (authError) {
    return { error: authError.message || 'No se pudo actualizar la contraseña.' };
  }

  const { error: rpcError } = await supabase.rpc('mark_password_changed');
  if (rpcError) {
    return { error: rpcError.message || 'No se pudo actualizar la contraseña.' };
  }

  redirect('/');
}
