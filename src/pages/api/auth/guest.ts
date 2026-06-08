import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.set('guest_mode', 'true', { path: '/', maxAge: 86400, sameSite: 'lax' });
  return redirect('/dashboard');
};
