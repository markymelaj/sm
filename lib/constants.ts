export const INTERNAL_ROLES = ['admin', 'auditor'] as const;
export const ROLE_OPTIONS = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'auditor', label: 'Auditor' }
] as const;
export const MAX_FILE_SIZE = 3 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
