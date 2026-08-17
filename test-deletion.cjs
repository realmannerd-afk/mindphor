const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  console.log("--- Starting Account Deletion Test ---");
  
  // 1. Create a throwaway user
  const { data: userResp, error: userErr } = await supabase.auth.admin.createUser({
    email: 'throwaway_delete_test@example.com',
    password: 'password123',
    email_confirm: true
  });
  if (userErr) {
    console.error("Failed to create user:", userErr);
    return;
  }
  const userId = userResp.user.id;
  console.log(`Created test user: ${userId}`);
  
  // 2. Insert dummy data into every table
  // We need to fetch table dependencies to insert in the right order
  // apps, profiles, api_keys, subscriptions can be inserted first.
  const { data: profile } = await supabase.from('profiles').insert({ id: userId, email: 'throwaway_delete_test@example.com' }).select();
  const { data: app } = await supabase.from('apps').insert({ user_id: userId, name: 'Test App', url: 'https://test.com', api_key: 'test_key' }).select();
  const appId = app ? app[0].id : null;
  const { data: sub } = await supabase.from('subscriptions').insert({ user_id: userId, status: 'active', plan: 'pro', paddle_subscription_id: 'sub_123', paddle_customer_id: 'cus_123' }).select();
  const { data: apiKey } = await supabase.from('api_keys').insert({ user_id: userId, key: 'test_api_key' }).select();
  
  // Dependent tables
  if (appId) {
    await supabase.from('feedback').insert({ app_id: appId, user_id: userId, source: 'test', content: 'test review' });
    await supabase.from('competitors').insert({ app_id: appId, user_id: userId, name: 'Test Comp' });
    await supabase.from('alerts').insert({ app_id: appId, user_id: userId, message: 'Test Alert' });
    await supabase.from('action_tasks').insert({ app_id: appId, user_id: userId, title: 'Test Task', status: 'pending' });
    await supabase.from('goals').insert({ app_id: appId, user_id: userId, title: 'Test Goal', target: 'Test' });
  }

  // 3. Count rows before deletion
  const tables = ['apps', 'feedback', 'subscriptions', 'competitors', 'alerts', 'action_tasks', 'goals', 'api_keys', 'profiles'];
  console.log("\nRow counts BEFORE deletion:");
  for (const table of tables) {
    let col = table === 'profiles' ? 'id' : 'user_id';
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq(col, userId);
    console.log(`${table}: ${count}`);
  }

  // 4. Delete the user
  console.log("\nDeleting user via supabase.auth.admin.deleteUser...");
  const { error: delErr } = await supabase.auth.admin.deleteUser(userId);
  if (delErr) {
    console.error("Failed to delete user:", delErr);
    return;
  }
  
  // Wait a moment for triggers/cascades
  await new Promise(r => setTimeout(r, 2000));

  // 5. Count rows after deletion
  console.log("\nRow counts AFTER deletion (leftovers/orphans):");
  for (const table of tables) {
    let col = table === 'profiles' ? 'id' : 'user_id';
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq(col, userId);
    console.log(`${table}: ${count}`);
  }
  
  console.log("--- Test Complete ---");
}

run();
