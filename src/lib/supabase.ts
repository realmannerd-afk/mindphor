import { createServerClient } from "@supabase/ssr";

export const getSupabaseClient = (cookies: any) => {
  return createServerClient(
    import.meta.env.SUPABASE_URL || "https://dummy-url.supabase.co",
    import.meta.env.SUPABASE_ANON_KEY || "dummy-anon-key",
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
        set(key: string, value: string, options: any) {
          try {
            cookies.set(key, value, { 
              ...options,
              httpOnly: true,
              secure: import.meta.env.PROD,
              sameSite: "lax",
              path: "/"
            });
          } catch (error) {
            // Ignored if called from a Server Component
          }
        },
        remove(key: string, options: any) {
          try {
            cookies.delete(key, options);
          } catch (error) {
            // Ignored
          }
        }
      },
    }
  );
};
