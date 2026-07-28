require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('content_items')
    .select('id, title, body')
    .eq('category_id', 'f4fc9a34-ce7f-4e1c-a360-f28d8a55becc')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
    
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

run();
