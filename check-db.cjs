const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8');
const urlMatch = dotenv.match(/SUPABASE_URL="?([^"\n]+)"?/);
const keyMatch = dotenv.match(/SUPABASE_SERVICE_KEY="?([^"\n]+)"?/);

if (!urlMatch || !keyMatch) {
    console.error("Could not find SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
    process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function run() {
    const { data, error } = await sb
        .from('apps')
        .select('id, name, sync_frequency, last_synced_at')
        .not('sync_frequency', 'is', null);
    
    if (error) console.error(error);
    else console.table(data);
}
run();
