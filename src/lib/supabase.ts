import { createServerClient } from "@supabase/ssr";

export const getSupabaseClient = (cookies: any) => {
  const url = import.meta.env.SUPABASE_URL || "https://dummy-url.supabase.co";
  const key = import.meta.env.SUPABASE_ANON_KEY || "dummy-anon-key";
  console.log('Initializing Supabase with URL:', url);
  return createServerClient(
    url,
    key,
    {
      global: {
        fetch: async (reqUrl, init) => {
          console.log('Supabase fetch:', reqUrl, init?.method);
          try {
            const res = await fetch(reqUrl, init);
            console.log('Supabase fetch res:', res.status);
            return res;
          } catch (err) {
            console.log('Supabase fetch ERROR:', err);
            throw err;
          }
        }
      },
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
            cookies.delete(key, { ...options, path: '/' });
          } catch (error) {
            // Ignored
          }
        }
      },
    }
  );
};
