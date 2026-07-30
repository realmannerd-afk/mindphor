const fs = require('fs');
const http = require('http');
const dotenv = fs.readFileSync('.env', 'utf8');
const sbUrl = dotenv.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const sbKey = dotenv.match(/SUPABASE_SERVICE_KEY="([^"]+)"/)[1].trim();
const cronMatch = dotenv.match(/CRON_SECRET="([^"]+)"/);
const cronSecret = cronMatch ? cronMatch[1].trim() : '';

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(sbUrl, sbKey);
const APP2_ID = 'e4a90f78-8a2d-4b64-b4b0-9783d202fe13';

async function run() {
  await sb.from('feedback').delete().eq('app_id', APP2_ID);
  
  const { data: users } = await sb.auth.admin.listUsers();
  const userId = users.users[0].id;

  await sb.from('apps').upsert({
    id: APP2_ID,
    user_id: userId,
    name: 'WhatsApp (Test UK)',
    app_store_url: 'https://apps.apple.com/gb/app/whatsapp-messenger/id310633997',
    play_store_url: null,
    reddit_search_term: null,
    sync_frequency: 'daily',
    last_synced_at: new Date(Date.now() - 48*60*60*1000).toISOString()
  });

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
      const { data: fb } = await sb.from('feedback').select('source, content, created_at').eq('app_id', APP2_ID);
      const counts = fb.reduce((acc, row) => { acc[row.source] = (acc[row.source] || 0) + 1; return acc; }, {});
      console.log('CRON HTTP RESPONSE:', data);
      console.log('WhatsApp sources:', counts);
      console.log('Total Rows:', fb.length);
      process.exit(0);
    });
  });
  req.end();
}
run();
