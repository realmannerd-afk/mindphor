const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8');
const url = dotenv.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const key = dotenv.match(/SUPABASE_SERVICE_KEY="([^"]+)"/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(url, key);

async function setup() {
  const { data: users } = await sb.auth.admin.listUsers();
  const userId = users.users[0].id;

  // 1. Uber Eats US
  const { data: app1 } = await sb.from('apps').upsert({
    id: 'test-app-1',
    user_id: userId,
    name: 'Uber Eats (Test US)',
    app_store_url: 'https://apps.apple.com/us/app/uber-eats-food-delivery/id1058959277',
    play_store_url: null,
    sync_frequency: 'daily',
    last_synced_at: new Date(Date.now() - 48*60*60*1000).toISOString()
  }).select().single();

  // 2. WhatsApp UK
  const { data: app2 } = await sb.from('apps').upsert({
    id: 'test-app-2',
    user_id: userId,
    name: 'WhatsApp (Test UK)',
    app_store_url: 'https://apps.apple.com/gb/app/whatsapp-messenger/id310633997',
    play_store_url: null,
    sync_frequency: 'daily',
    last_synced_at: new Date(Date.now() - 48*60*60*1000).toISOString()
  }).select().single();

  const { count: c1 } = await sb.from('feedback').select('*', { count: 'exact', head: true }).eq('app_id', 'test-app-1');
  const { count: c2 } = await sb.from('feedback').select('*', { count: 'exact', head: true }).eq('app_id', 'test-app-2');

  console.log(`BEFORE SYNC - Uber Eats (US): ${c1} reviews`);
  console.log(`BEFORE SYNC - WhatsApp (UK): ${c2} reviews`);
}

setup().catch(console.error);
