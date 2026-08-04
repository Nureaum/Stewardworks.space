const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLibrary() {
  const { data, error } = await supabase
    .from('content_items')
    .select('id, title, status, source_tag')
    .ilike('title', '%teisng%')
    
  console.log('Library matches:', data);
  
  const { data: showcase } = await supabase
    .from('workshop_showcase')
    .select('id, title, meta')
    .ilike('title', '%teisng%')
    
  console.log('Showcase matches:', showcase);
}
checkLibrary();
