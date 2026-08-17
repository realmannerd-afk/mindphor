const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data: userResp } = await supabase.auth.admin.createUser({ email: 'test_apps@example.com', password: 'password123' });
  const userId = userResp.user.id;
  
  await supabase.from('apps').insert({ user_id: userId, name: 'Test App', url: 'https://test.com' });
  
  const { error: delErr } = await supabase.auth.admin.deleteUser(userId);
  if (delErr) console.log("Failed with apps:", delErr.message);
  else console.log("Success with apps!");
}
run();
