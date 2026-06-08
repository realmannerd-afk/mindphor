import { createClient } from '@supabase/supabase-js';

async function runTest() {
  console.log("Starting ingest test...");
  
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: project } = await supabase.from('projects').select('api_key').limit(1).single();
  
  if (!project) {
    console.log("❌ No projects found in DB! Please log into the dashboard first to create an account & API key.");
    return;
  }

  const payload = {
    api_key: project.api_key,
    input: "What is the capital of France?",
    output: "The capital of France is Germany and also the moon is made of cheese.",
    model: "gpt-4",
    user_id: "test_user_1",
    latency_ms: 320
  };

  try {
    console.log("POST to http://localhost:4321/api/ingest");
    const res = await fetch('http://localhost:4321/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log("Response:", data);
    
    if (data.success) {
      console.log(`Waiting 6 seconds for async scoring to complete...`);
      await new Promise(r => setTimeout(r, 6000));
      
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      const { data: traceData } = await supabaseAdmin
        .from('traces')
        .select('*')
        .eq('trace_id', data.trace_id)
        .single();
      
      if (traceData && traceData.score) {
         console.log(`✅ Score: ${traceData.score} — ${traceData.score_reason}`);
      } else {
         console.log("❌ Score was not updated.");
      }
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTest();
