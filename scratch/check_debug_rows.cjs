const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8');
const url = dotenv.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const key = dotenv.match(/SUPABASE_SERVICE_KEY="([^"]+)"/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(url, key);
sb.from('feedback').select('id, content, created_at').like('content', 'DEBUG%').then(r => {
  if (r.error) console.error(r.error);
  else console.log(JSON.stringify(r.data, null, 2));
}).catch(console.error);
