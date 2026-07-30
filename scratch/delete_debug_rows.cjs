const fs = require('fs');
const dotenv = fs.readFileSync('.env', 'utf8');
const url = dotenv.match(/SUPABASE_URL="([^"]+)"/)[1].trim();
const key = dotenv.match(/SUPABASE_SERVICE_KEY="([^"]+)"/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(url, key);
sb.from('feedback').delete().like('content', 'DEBUG%').then(r => {
  if (r.error) console.error(r.error);
  else console.log('Successfully deleted the debug rows.');
}).catch(console.error);
