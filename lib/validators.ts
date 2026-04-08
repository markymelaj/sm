import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/constants';

export function validateUpload(file: File) {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new Error('Solo se aceptan PDF, JPG o PNG.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('El archivo supera el máximo de 3 MB.');
  }
}
