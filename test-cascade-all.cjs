const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const tables = ['feedback', 'competitors', 'alerts', 'action_tasks', 'goals', 'api_keys', 'subscriptions', 'profiles'];
  
  for (const table of tables) {
    const { data: userResp } = await supabase.auth.admin.createUser({ email: `test_${table}@example.com`, password: 'password123' });
    const userId = userResp.user.id;
    
    // We need an app for app_id dependent tables
    let appId = null;
    if (['feedback', 'competitors', 'alerts', 'action_tasks', 'goals'].includes(table)) {
      const { data: app } = await supabase.from('apps').insert({ user_id: userId, name: 'Test App', url: 'https://test.com' }).select();
      appId = app[0].id;
    }
    
    // Insert into the target table
    if (table === 'feedback') await supabase.from('feedback').insert({ user_id: userId, app_id: appId, source: 'test', content: 'test' });
    if (table === 'competitors') await supabase.from('competitors').insert({ user_id: userId, app_id: appId, name: 'test' });
    if (table === 'alerts') await supabase.from('alerts').insert({ user_id: userId, app_id: appId, message: 'test' });
    if (table === 'action_tasks') await supabase.from('action_tasks').insert({ user_id: userId, app_id: appId, title: 'test', status: 'pending' });
    if (table === 'goals') await supabase.from('goals').insert({ user_id: userId, app_id: appId, title: 'test', target: 'test' });
    if (table === 'api_keys') await supabase.from('api_keys').insert({ user_id: userId, key: 'test' });
    if (table === 'subscriptions') await supabase.from('subscriptions').insert({ user_id: userId, status: 'active', plan: 'pro', paddle_subscription_id: 'sub', paddle_customer_id: 'cus' });
    if (table === 'profiles') await supabase.from('profiles').insert({ id: userId, email: 'test' });
    
    const { error: delErr } = await supabase.auth.admin.deleteUser(userId);
    if (delErr) {
      console.log(`[ORPHANED] Table ${table} blocks user deletion: ${delErr.message}`);
      // Cleanup manually
      let col = table === 'profiles' ? 'id' : 'user_id';
      await supabase.from(table).delete().eq(col, userId);
      await supabase.auth.admin.deleteUser(userId);
    } else {
      console.log(`[CASCADED] Table ${table} successfully cascaded/deleted with user.`);
    }
  }
}
run();
