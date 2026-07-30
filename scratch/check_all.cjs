const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8');
const url = dotenv.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const key = dotenv.match(/SUPABASE_SERVICE_KEY="([^"]+)"/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(url, key);
async function run() {
  const { data } = await sb.from('feedback').select('app_id, source, id');
  const grouped = data.reduce((acc, row) => {
    if (!acc[row.app_id]) acc[row.app_id] = {};
    acc[row.app_id][row.source] = (acc[row.app_id][row.source] || 0) + 1;
    return acc;
  }, {});
  console.log('All feedback counts by app and source:', JSON.stringify(grouped, null, 2));
}
run();
