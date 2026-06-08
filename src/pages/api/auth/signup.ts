import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const name = formData.get("name")?.toString();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Mandatory Secure Web Skill: Enforce strong passwords with specific errors
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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ success: true }), { 
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
