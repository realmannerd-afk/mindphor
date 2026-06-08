import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
async function run() {
  const { data: mem } = await supabase.from('memory_keys').select('*').limit(1);
  console.log('MEMORY_KEYS:', mem);
  const { data: alerts } = await supabase.from('alerts').select('*').limit(1);
  console.log('ALERTS:', alerts);
}
run();
