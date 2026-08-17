const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8');
const urlMatch = dotenv.match(/SUPABASE_URL="?([^"\n]+)"?/);
const keyMatch = dotenv.match(/SUPABASE_SERVICE_KEY="?([^"\n]+)"?/);

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function testCountry() {
    console.log("Querying apps table for country...");
    const res = await sb.from('apps').select('id, name, country').limit(1);
    console.log(res.error || res.data);

    console.log("Querying feedback table for country...");
    const res2 = await sb.from('feedback').select('id, country').limit(1);
    console.log(res2.error || res2.data);
}
testCountry();
