import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const url = new URL(request.url);
  const appId = url.searchParams.get('id');
  const returnTo = url.searchParams.get('returnTo') || '/dashboard';

  if (appId) {
    cookies.set('mindphor_app_id', appId, { path: '/', maxAge: 31536000 });
  } else {
    cookies.delete('mindphor_app_id', { path: '/' });
  }

  return redirect(returnTo);
}
