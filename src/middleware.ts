import { defineMiddleware } from "astro:middleware";
import { getSupabaseClient } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  if (url.pathname === '/logout') {
    cookies.delete('guest_mode', { path: '/' });
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

      const isGuestQuery = url.searchParams.get('guest') === 'true';
      const isGuestCookie = cookies.has('guest_mode');
      const isGuest = isGuestQuery || isGuestCookie;

      if (isGuestQuery) {
        cookies.set('guest_mode', 'true', { path: '/', maxAge: 86400, httpOnly: false });
      }

      if (isProtectedRoute && !hasSession && !isGuest) {
        return redirect("/login");
      }

      if (isPublicRoute && (hasSession || isGuest)) {
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
