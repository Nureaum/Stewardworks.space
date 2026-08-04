const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixBookmarks() {
  const { data, error } = await supabase
    .from('workshop_engagement')
    .select('id, title, url')
    .eq('kind', 'bookmark')
    .ilike('title', 'tesing the libarray%');
    
  console.log('Found bookmarks:', data);

  if (data && data.length > 0) {
    for (const b of data) {
      if (!b.title.includes('[UNAVAILABLE]')) {
        await supabase
          .from('workshop_engagement')
          .update({ title: `${b.title} [UNAVAILABLE]` })
          .eq('id', b.id);
        console.log('Fixed bookmark:', b.id);
      }
    }
  }
}
fixBookmarks();
