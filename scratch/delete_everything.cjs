const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8');
const url = dotenv.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const key = dotenv.match(/SUPABASE_SERVICE_KEY="([^"]+)"/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(url, key);

const tables = [
  'action_tasks',
  'alerts',
  'feedback',
  'competitors',
  'apps',
  'traces',
  'goals',
  'keys',
  'profiles'
];

async function run() {
  for (const table of tables) {
    console.log(`Deleting all rows from ${table}...`);
    let { data: rows, error: selectError } = await sb.from(table).select('id');
    if (selectError) {
      console.log(`Table ${table} might not have an 'id' column or doesn't exist:`, selectError.message);
      // Try to select user_id for profiles if id doesn't exist
      if (table === 'profiles') {
        const { data: pRows } = await sb.from('profiles').select('user_id');
        rows = pRows;
      }
    }

    if (rows && rows.length > 0) {
      const idCol = rows[0].id ? 'id' : (rows[0].user_id ? 'user_id' : null);
      if (!idCol) {
         console.log(`Could not find identifier for ${table}`);
         continue;
      }
      const ids = rows.map(r => r[idCol]);
      
      for (let i = 0; i < ids.length; i += 1000) {
        const batch = ids.slice(i, i + 1000);
        const { error } = await sb.from(table).delete().in(idCol, batch);
        if (error) console.error(`Error deleting from ${table}:`, error);
      }
      console.log(`Deleted ${rows.length} rows from ${table}`);
    } else {
      console.log(`No rows to delete in ${table}`);
    }
  }
  console.log('Done clearing database!');
}
run();
