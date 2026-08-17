const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data: appsData } = await supabase.from('apps').select('*').limit(1);
  if (appsData && appsData.length > 0) {
    console.log('Apps:', Object.keys(appsData[0]));
  } else {
    console.log('Apps: table empty or not found');
  }

  const { data: feedbackData } = await supabase.from('feedback').select('*').limit(1);
  if (feedbackData && feedbackData.length > 0) {
    console.log('Feedback:', Object.keys(feedbackData[0]));
  } else {
    console.log('Feedback: table empty or not found');
  }
}

run();
