import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await request.json();
    const { app_id, play_console_json, apple_issuer_id, apple_key_id, apple_private_key } = body;

    if (!app_id) {
      return new Response(JSON.stringify({ error: "app_id is required" }), { status: 400 });
    }

    const updateData: any = {};
    if (play_console_json !== undefined) updateData.play_console_json = play_console_json;
    if (apple_issuer_id !== undefined) updateData.apple_issuer_id = apple_issuer_id;
    if (apple_key_id !== undefined) updateData.apple_key_id = apple_key_id;
    if (apple_private_key !== undefined) updateData.apple_private_key = apple_private_key;

    const { error } = await supabase
      .from('apps')
      .update(updateData)
      .eq('id', app_id)
      .eq('user_id', user.id);

    if (error) {
      console.error("Error saving credentials:", error);
      return new Response(JSON.stringify({ error: "Failed to save credentials" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Credentials API error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};
