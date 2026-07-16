import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error } = await supabase.from('feedback').select('id, content, source, score, author, sentiment').is('source', null);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Mock data left:", data.length);
    if (data.length > 0) {
      console.log(data.slice(0, 5));
    }
    
    // Delete them!
    const { error: delError } = await supabase.from('feedback').delete().is('source', null);
    if (!delError) console.log("Deleted all feedback where source is null!");
  }
}
run();
