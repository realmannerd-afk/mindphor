const fs = require('fs');
const http = require('http');

const dotenv = fs.readFileSync('.env', 'utf8');
const urlMatch = dotenv.match(/SUPABASE_URL="([^"]+)"/);
const keyMatch = dotenv.match(/SUPABASE_SERVICE_KEY="([^"]+)"/);
const cronMatch = dotenv.match(/CRON_SECRET="([^"]+)"/);
const sbUrl = urlMatch[1].trim();
const sbKey = keyMatch[1].trim();
const cronSecret = cronMatch ? cronMatch[1].trim() : '';

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(sbUrl, sbKey);

async function runTest() {
  console.log('Triggering Cron via HTTP...');
  const options = {
    hostname: 'localhost',
    port: 4321,
    path: '/api/cron/sync-all',
    method: 'GET',
    headers: {}
  };
  
  if (cronSecret) {
    options.headers['Authorization'] = `Bearer ${cronSecret}`;
  }

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', async () => {
      console.log('CRON RESPONSE:');
      console.log(data);
      
      const { count: c1 } = await sb.from('feedback').select('*', { count: 'exact', head: true }).eq('app_id', 'test-app-1');
      const { count: c2 } = await sb.from('feedback').select('*', { count: 'exact', head: true }).eq('app_id', 'test-app-2');

      console.log(`AFTER SYNC - Uber Eats (US): ${c1} reviews`);
      console.log(`AFTER SYNC - WhatsApp (UK): ${c2} reviews`);
      
      // Cleanup
      await sb.from('apps').delete().in('id', ['test-app-1', 'test-app-2']);
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

// Give server 5s to boot before firing
setTimeout(runTest, 5000);
