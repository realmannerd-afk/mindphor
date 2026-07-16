import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await request.json();
    const { name, url, description, playStoreUrl, appStoreUrl, redditSearchTerm } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "App name is required" }), { status: 400 });
    }

    const { data, error } = await supabase
      .from("apps")
      .insert({
        user_id: user.id,
        name,
        url: url || null,
        description: description || null,
        play_store_url: playStoreUrl || null,
        app_store_url: appStoreUrl || null,
        reddit_search_term: redditSearchTerm || null
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating app:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 201 });
  } catch (err: any) {
    console.error("API error creating app:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { error } = await supabase
      .from("apps")
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error("Error deleting app:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error("API error deleting app:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
