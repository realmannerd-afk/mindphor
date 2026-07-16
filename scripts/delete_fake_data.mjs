import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data: comp } = await supabase.from('competitors').select('id').eq('domain', 'linear.app').single();
  if (!comp) {
    console.log("No competitor found");
    return;
  }
  const { error } = await supabase.from('feedback').delete().eq('competitor_id', comp.id);
  if (error) {
    console.error("Error deleting:", error);
  } else {
    console.log("Fake data for linear.app deleted!");
  }
}
run();
