import { defineMiddleware } from "astro:middleware";
import { getSupabaseClient } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  if (url.pathname === '/logout') {
    cookies.delete('sb-ryewtqnqovpianuwsnpp-auth-token', { path: '/' });
    return redirect("/login");
  }

  // Protect all dashboard, docs, and feature routes
  const isProtectedRoute = 
    url.pathname.startsWith("/dashboard") || 
    url.pathname.startsWith("/docs") || 
    url.pathname.startsWith("/memory") || 
    url.pathname.startsWith("/alerts") || 
    url.pathname.startsWith("/traces");

  const isPublicRoute = 
    url.pathname === "/" || 
    url.pathname === "/login" || 
    url.pathname === "/signup";

  if (isProtectedRoute || isPublicRoute) {
    try {
      const supabase = getSupabaseClient(cookies);
      const { data } = await supabase.auth.getSession();
      const hasSession = !!data?.session;

      if (isProtectedRoute && !hasSession) {
        return redirect("/login");
      }

      if (isPublicRoute && hasSession) {
        return redirect("/dashboard");
      }
    } catch (err) {
      console.error("Middleware Supabase error:", err);
      if (isProtectedRoute) {
        return redirect("/login");
      }
    }
  }

  return next();
});
