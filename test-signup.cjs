const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const email = `test_signup_${Date.now()}@example.com`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'Password123!'
  });
  
  if (error) {
    console.log("Signup error:", error);
  } else {
    console.log("Signup success!");
    console.log("Session exists?:", !!data.session);
    console.log("User object:", JSON.stringify(data.user, null, 2));
    
    // Check if last_sign_in_at is null
    const { data: adminUser } = await supabase.auth.admin.getUserById(data.user.id);
    console.log("last_sign_in_at:", adminUser.user.last_sign_in_at);
  }
}
run();
