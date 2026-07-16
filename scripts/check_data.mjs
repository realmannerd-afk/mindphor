import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error, count } = await supabase.from('feedback').select('id, source, competitor_id, content', { count: 'exact' });
  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Total feedback rows: ${count}`);
    console.log("Sample data:");
    console.log(data.slice(0, 5));
    
    // Check competitors
    const { data: comps } = await supabase.from('competitors').select('id, domain');
    console.log("Competitors:", comps);
  }
}
run();
