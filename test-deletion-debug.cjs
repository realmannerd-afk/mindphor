const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const userId = '1cbb8e65-619b-4c63-9b96-1a537ce4349c';
  
  const tables = ['feedback', 'competitors', 'alerts', 'action_tasks', 'goals', 'api_keys', 'subscriptions', 'apps', 'profiles'];
  
  for (const table of tables) {
    console.log(`\nAttempting to delete user...`);
    const { error: delErr } = await supabase.auth.admin.deleteUser(userId);
    if (!delErr) {
      console.log(`User deleted successfully after clearing ${table}!`);
      return;
    }
    console.log(`Delete failed (likely FK constraint). Now manually deleting from ${table}...`);
    let col = table === 'profiles' ? 'id' : 'user_id';
    await supabase.from(table).delete().eq(col, userId);
  }
  
  const { error: finalErr } = await supabase.auth.admin.deleteUser(userId);
  if (!finalErr) {
    console.log("User finally deleted.");
  } else {
    console.log("Still failed to delete user:", finalErr);
  }
}

run();
