const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixArchived() {
  const { data, error } = await supabase
    .from('content_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('title', 'teisng')
    .eq('source_tag', 'contributor')
    .select();
    
  console.log('Fixed matches:', data, error);
}
fixArchived();
