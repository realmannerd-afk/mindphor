const https = require('https');
const req = https.request(process.env.SUPABASE_URL + '/rest/v1/', { headers: { 'apikey': process.env.SUPABASE_SERVICE_KEY } }, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const s = JSON.parse(data);
    
    console.log("--- Query 1: apps columns ---");
    console.log("column_name | data_type");
    console.log("------------+-----------");
    for(let k in s.definitions.apps.properties){
      console.log(k.padEnd(12) + '| ' + s.definitions.apps.properties[k].type);
    }
    
    console.log("\n--- Query 2: feedback columns ---");
    console.log("column_name | data_type");
    console.log("------------+-----------");
    for(let k in s.definitions.feedback.properties){
      console.log(k.padEnd(12) + '| ' + s.definitions.feedback.properties[k].type);
    }
    
    console.log("\n--- Query 3: public tables ---");
    console.log("table_name");
    console.log("------------");
    for(let k in s.definitions){
      console.log(k);
    }
  });
});
req.end();
