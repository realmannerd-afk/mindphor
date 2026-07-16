import type { APIRoute } from 'astro';
import { getSupabaseClient } from '../../lib/supabase';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const url = new URL(request.url);
    const appId = url.searchParams.get('app_id');

    if (!appId) {
      return new Response(JSON.stringify({ error: "Missing app_id" }), { status: 400 });
    }




    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('app_id', appId)
      .eq('user_id', user.id);

    if (error) throw error;

    return new Response(JSON.stringify({ goals }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const { app_id, text, date, color } = body;



    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data, error } = await supabase
      .from('goals')
      .insert({ app_id, user_id: user.id, text, date, color })
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify({ goal: data }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return new Response(JSON.stringify({ error: "Missing id" }), { status: 400 });


    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
