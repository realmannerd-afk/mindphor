const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8');
const url = dotenv.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const key = dotenv.match(/SUPABASE_SERVICE_KEY="([^"]+)"/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(url, key);

const APP1_ID = 'bde11492-a972-4032-9ba0-4b0791aa3477';
const APP2_ID = 'e4a90f78-8a2d-4b64-b4b0-9783d202fe13';

async function check() {
  const { count: c1 } = await sb.from('feedback').select('*', { count: 'exact', head: true }).eq('app_id', APP1_ID);
  const { count: c2 } = await sb.from('feedback').select('*', { count: 'exact', head: true }).eq('app_id', APP2_ID);
  console.log(`AFTER SYNC - Uber Eats (US): ${c1} reviews inserted successfully.`);
  console.log(`AFTER SYNC - WhatsApp (UK): ${c2} reviews inserted successfully.`);
}
check();
