export const GET = () => {
  return new Response(JSON.stringify({
    url: import.meta.env.SUPABASE_URL,
    key: import.meta.env.SUPABASE_ANON_KEY ? 'exists' : 'missing',
    dummy: "https://dummy-url.supabase.co"
  }), { headers: { 'Content-Type': 'application/json' } });
};
