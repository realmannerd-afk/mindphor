import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error } = await supabase.from('feedback').delete().ilike('content', '%Stripe%');
  if (error) {
    console.error("Error deleting:", error);
  } else {
    console.log("Deleted fake Stripe data!");
  }
}
run();
