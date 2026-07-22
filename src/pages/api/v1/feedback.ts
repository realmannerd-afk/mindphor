import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const GET: APIRoute = async ({ request }) => {
  const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_KEY
  );

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const keyHash = crypto.createHash("sha256").update(token).digest("hex");

  const { data: keyRecord, error: keyError } = await supabase
    .from("api_keys")
    .select("user_id, revoked, id")
    .eq("key_hash", keyHash)
    .single();

  if (keyError || !keyRecord || keyRecord.revoked) {
    return new Response(JSON.stringify({ error: "Invalid or revoked API key" }), { status: 401 });
  }

  // Update last_used_at (non-blocking)
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id)
    .then();

  // Fetch feedback for this user
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const { data: feedback, error: fbError } = await supabase
    .from("feedback")
    .select("*")
    .eq("user_id", keyRecord.user_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (fbError) {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }

  return new Response(JSON.stringify({
    data: feedback,
    meta: {
      count: feedback.length,
      limit
    }
  }), { status: 200, headers: { "Content-Type": "application/json" } });
};
