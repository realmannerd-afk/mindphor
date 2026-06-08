const url = 'https://ryewtqnqovpianuwsnpp.supabase.co/rest/v1/projects?select=api_key&limit=1';
fetch(url, {
  headers: {
    'apikey': 'sb_publishable_jqDfjscIIpPWp9lmhd_RxQ__iJhJXmo',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZXd0cW5xb3ZwaWFudXdzbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYzNTQxOSwiZXhwIjoyMDk2MjExNDE5fQ.wMR5dLOsMGF7fJkSgLp_UPuxg28qqHGfaEhImnu8YkA'
  }
}).then(r => r.json()).then(console.log);
