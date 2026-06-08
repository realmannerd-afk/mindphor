import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = getSupabaseClient(cookies);

  // Check auth
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Generate a secure random string (Edge-compatible)
    const rawKey = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const newApiKey = `mp_live_${rawKey}`;

    // Update the project with the new key
    const { error: updateError } = await supabase
      .from('projects')
      .update({ api_key: newApiKey })
      .eq('user_id', authData.user.id);

    if (updateError) {
      console.error("Failed to update API key:", updateError);
      return new Response(JSON.stringify({ error: "Failed to generate new API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, api_key: newApiKey }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Generate API key error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
