export const POST = async ({ request, cookies }) => {
  const { getSupabaseClient } = await import('../../lib/supabase');
  const supabase = getSupabaseClient(cookies);

  const { data, error } = await supabase.auth.signUp({
    email: 'test' + Date.now() + '@example.com',
    password: 'TestPassword123!',
    options: {
      data: {
        name: 'Test',
      },
    },
  });

  return new Response(JSON.stringify({ error: error, data: data }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
