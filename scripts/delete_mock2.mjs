import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error } = await supabase.from('feedback').select('id, content, source, score, author, sentiment').neq('source', 'Google Play').limit(10);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Mock data not from Google Play:");
    console.log(data);
    
    // Delete them!
    const { error: delError } = await supabase.from('feedback').delete().neq('source', 'Google Play');
    if (!delError) console.log("Deleted all feedback not from Google Play!");
  }
}
run();
