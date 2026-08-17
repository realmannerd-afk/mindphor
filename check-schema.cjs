const { createClient } = require('@supabase/supabase-js');
async function run() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  
  // Actually we can just query with select and look at the error, but information_schema is better.
  // We can't query information_schema directly with standard Supabase JS client because it only queries public schema.
  // Let's just insert a dummy row or use a bad column name to get the hint, or fetch with postgrest options.
  
  // Wait, let's just make a fetch to the REST API with an OPTIONS request
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/feedback`, {
    method: 'OPTIONS',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
    }
  });
  
  const text = await res.text();
  console.log("Feedback OPTIONS:", text);
}
run();
