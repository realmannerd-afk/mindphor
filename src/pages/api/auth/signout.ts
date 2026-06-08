import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const supabase = getSupabaseClient(cookies);
  await supabase.auth.signOut();
  return redirect("/login");
};

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const supabase = getSupabaseClient(cookies);
  await supabase.auth.signOut();
  return redirect("/login");
};
