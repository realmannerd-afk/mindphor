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
    const { feedback_id, reply_text } = body;

    if (!feedback_id || !reply_text) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
    }

    // Since this is a test/simulator, we just save the reply to the DB directly.
    // In a real scenario with API keys, we would fetch the app's keys and call Google/Apple APIs here.
    
    const { error } = await supabase
      .from('feedback')
      .update({
        reply_text: reply_text,
        replied_at: new Date().toISOString()
      })
      .eq('id', feedback_id)
      .eq('user_id', user.id); // Ensure they own this feedback

    if (error) {
      console.error("Error saving reply:", error);
      return new Response(JSON.stringify({ error: "Failed to save reply" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Reply API error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};
