import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkApps() {
    const { data, error } = await supabase
        .from('apps')
        .select('id, name, sync_frequency, last_synced_at')
        .not('sync_frequency', 'is', null);
        
    if (error) {
        console.error("DB Error:", error);
    } else {
        console.log("Apps with sync_frequency set:");
        console.table(data);
    }
}
checkApps();
