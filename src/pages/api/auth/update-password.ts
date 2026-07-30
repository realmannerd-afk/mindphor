import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  const formData = await request.formData();
  const password = formData.get("password")?.toString();

  if (!password) {
    return new Response(JSON.stringify({ error: "Password is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Enforce password requirements (same as signup)
  if (password.length < 8) {
    return new Response(JSON.stringify({ error: "Password must be at least 8 characters long." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!/[a-z]/.test(password)) {
    return new Response(JSON.stringify({ error: "Password must contain at least one lowercase letter." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!/[A-Z]/.test(password)) {
    return new Response(JSON.stringify({ error: "Password must contain at least one uppercase letter." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return new Response(JSON.stringify({ error: "Password must contain at least one special character." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const supabase = getSupabaseClient(cookies);

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  // Sign out the user from other sessions? Optional.
  // For now, updating the password successfully is enough.
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
};
