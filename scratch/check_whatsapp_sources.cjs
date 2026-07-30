const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8');
const url = dotenv.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const key = dotenv.match(/SUPABASE_SERVICE_KEY="([^"]+)"/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(url, key);

async function check() {
  const { data } = await sb.from('feedback').select('source').eq('app_id', 'e4a90f78-8a2d-4b64-b4b0-9783d202fe13');
  const counts = data.reduce((acc, row) => {
    acc[row.source] = (acc[row.source] || 0) + 1;
    return acc;
  }, {});
  console.log('WhatsApp sources:', counts);
}
check();
