import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error } = await supabase.from('feedback').select('id, source, competitor_id, app_id, content').limit(5);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Sample data with app_id:");
    console.log(data);
  }
}
run();
