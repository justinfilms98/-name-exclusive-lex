import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase server client for Route Handlers (App Router).
 * 
 * This implementation uses @supabase/ssr with Next.js cookies() to properly
 * read and write Supabase auth cookies in Route Handlers.
 * 
 * Why this works:
 * - cookies().getAll() reads all cookies from the request
 * - cookies().set() writes cookies to the response (though Route Handlers
 *   can't always set cookies, which is why we catch the error)
 * - This ensures Supabase auth session cookies are properly read from
 *   the incoming request headers
 */
export function supabaseRouteClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Route Handler.
            // Route Handlers can't always set cookies in the response.
            // This is expected and can be ignored if you have middleware
            // refreshing user sessions.
          }
        },
      },
    }
  );
}
