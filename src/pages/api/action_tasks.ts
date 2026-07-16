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

    const { data: tasks, error } = await supabase
      .from('action_tasks')
      .select('*')
      .eq('app_id', appId)
      .eq('user_id', user.id)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ tasks }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const { app_id, text, completed, order_index } = body;



    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data, error } = await supabase
      .from('action_tasks')
      .insert({ app_id, user_id: user.id, text, completed, order_index })
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify({ task: data }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  // Update order or completed status (bulk or single)
  try {
    const supabase = getSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await request.json();
    const { tasks } = body; // Array of { id, order_index, completed }

    if (!tasks) return new Response(JSON.stringify({ error: "Missing tasks" }), { status: 400 });


    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    // Supabase JS doesn't support bulk upsert easily without specifying unique constraints in the insert method
    // For simplicity, we can iterate or use a stored procedure. Let's do simple iteration for small lists.
    for (const task of tasks) {
      let updatePayload: any = {};
      if (task.order_index !== undefined) updatePayload.order_index = task.order_index;
      if (task.completed !== undefined) updatePayload.completed = task.completed;
      if (task.text !== undefined) updatePayload.text = task.text;
      if (task.description !== undefined) updatePayload.description = task.description;
      if (task.due_date !== undefined) updatePayload.due_date = task.due_date;

      const { error } = await supabase
        .from('action_tasks')
        .update(updatePayload)
        .eq('id', task.id)
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
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
      .from('action_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
