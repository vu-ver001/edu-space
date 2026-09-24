/**
 * Format image URL:
 * - If already absolute (http://, https://, blob:, data:), return as is.
 * - If relative path (/uploads/spaces/..., uploads/...), prefix with backend base URL.
 */
export const formatImageUrl = (url?: string | null): string | null => {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  const backendBase = import.meta.env.VITE_API_URL || 'http://localhost:8081';
  return `${backendBase.replace(/\/+$/, '')}/${trimmed.replace(/^\/+/, '')}`;
};
