import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error } = await supabase.from('feedback').select('id, content').ilike('content', '%Stripe%');
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Stripe data left:", data.length);
  }
}
run();
