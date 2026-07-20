import type { APIRoute } from "astro";
import { getSupabaseClient } from "../../../lib/supabase";

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = getSupabaseClient(cookies);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirect(next);
    }
  }

  // return the user to an error page with some instructions
  return redirect("/login?error=auth_callback_failed");
};
