/**
 * Constructs the public URL for a file in a Supabase storage bucket.
 * 
 * @param path The file path within the bucket (e.g., 'collection-videos/myfile.mp4').
 * @returns The full public URL to access the file.
 */
export function getSupabasePublicUrl(path: string): string {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('Supabase URL is not configured. Returning a placeholder URL.');
    return `https://example.com/storage/v1/object/public/${path}`;
  }
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
} 