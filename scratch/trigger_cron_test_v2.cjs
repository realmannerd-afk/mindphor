const fs = require('fs');
const http = require('http');

const dotenv = fs.readFileSync('.env', 'utf8');
const sbUrl = dotenv.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const sbKey = dotenv.match(/SUPABASE_SERVICE_KEY="([^"]+)"/)[1].trim();
const cronMatch = dotenv.match(/CRON_SECRET="([^"]+)"/);
const cronSecret = cronMatch ? cronMatch[1].trim() : '';

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(sbUrl, sbKey);

const APP1_ID = 'bde11492-a972-4032-9ba0-4b0791aa3477';
const APP2_ID = 'e4a90f78-8a2d-4b64-b4b0-9783d202fe13';

async function run() {
  const { data: users } = await sb.auth.admin.listUsers();
  const userId = users.users[0].id;

  console.log("Setting up test apps...");
  const { error: e1 } = await sb.from('apps').upsert({
    id: APP1_ID,
    user_id: userId,
    name: 'Uber Eats (Test US)',
    app_store_url: 'https://apps.apple.com/us/app/uber-eats-food-delivery/id1058959277',
    play_store_url: null,
    sync_frequency: 'daily',
    last_synced_at: new Date(Date.now() - 48*60*60*1000).toISOString()
  });
  if (e1) { console.error(e1); return; }

  const { error: e2 } = await sb.from('apps').upsert({
    id: APP2_ID,
    user_id: userId,
    name: 'WhatsApp (Test UK)',
    app_store_url: 'https://apps.apple.com/gb/app/whatsapp-messenger/id310633997',
    play_store_url: null,
    sync_frequency: 'daily',
    last_synced_at: new Date(Date.now() - 48*60*60*1000).toISOString()
  });
  if (e2) { console.error(e2); return; }

  const { count: c1Before } = await sb.from('feedback').select('*', { count: 'exact', head: true }).eq('app_id', APP1_ID);
  const { count: c2Before } = await sb.from('feedback').select('*', { count: 'exact', head: true }).eq('app_id', APP2_ID);
  
  console.log(`BEFORE SYNC - Uber Eats (US): ${c1Before} reviews`);
  console.log(`BEFORE SYNC - WhatsApp (UK): ${c2Before} reviews`);

  console.log('Triggering Cron via HTTP (this might take a couple minutes)...');
  const options = {
    hostname: 'localhost',
    port: 4322,
    path: '/api/cron/sync-all',
    method: 'GET',
    headers: {}
  };
  if (cronSecret) options.headers['Authorization'] = `Bearer ${cronSecret}`;

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', async () => {
      console.log('CRON HTTP RESPONSE:');
      console.log(data);
      
      const { count: c1After } = await sb.from('feedback').select('*', { count: 'exact', head: true }).eq('app_id', APP1_ID);
      const { count: c2After } = await sb.from('feedback').select('*', { count: 'exact', head: true }).eq('app_id', APP2_ID);

      console.log(`AFTER SYNC - Uber Eats (US): ${c1After} reviews`);
      console.log(`AFTER SYNC - WhatsApp (UK): ${c2After} reviews`);
      
      // Cleanup
      await sb.from('apps').delete().in('id', [APP1_ID, APP2_ID]);
      console.log('Test apps cleaned up.');
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
    process.exit(1);
  });
  req.end();
}

run().catch(console.error);
