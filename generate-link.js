const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function main() {
  const email = 'new_participant@example.com';
  console.log(`Generating Magic Link for ${email}...`);
  
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: {
      redirectTo: 'http://localhost:3000/auth/callback'
    }
  });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('\n✅ SUCCESS! Copy and paste this exact link into your browser to log in instantly without waiting for an email:');
    console.log('\n----------------------------------------');
    console.log(data.properties.action_link);
    console.log('----------------------------------------\n');
  }
}

main();
