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
    const { name, url, description } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "App name is required" }), { status: 400 });
    }

    const { data, error } = await supabase
      .from("apps")
      .insert({
        user_id: user.id,
        name,
        url: url || null,
        description: description || null
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
