import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data: items } = await supabase.from('content_items').select('id, title').order('created_at', { ascending: false }).limit(12);
  
  const mockSpecialResources = [
    { title: 'Calscape - California Native Plant Society', url: 'https://calscape.org/' },
    { title: 'iNaturalist', url: 'https://www.inaturalist.org/' },
    { title: 'Audubon Bird Guide', url: 'https://www.audubon.org/bird-guide' },
    { title: 'Quechan Indian Tribe - Fort Yuma', url: 'https://www.quechantribe.com/' },
    { title: 'Native Land Digital', url: 'https://native-land.ca/' },
    { title: 'National Museum of the American Indian', url: 'https://americanindian.si.edu/' },
    { title: 'Calisphere - California digital archive', url: 'https://calisphere.org/' },
    { title: 'Salton Sea Authority', url: 'https://saltonseaauthority.org/' },
    { title: 'Imperial Irrigation District', url: 'https://www.iid.com/' },
    { title: 'Our World in Data', url: 'https://ourworldindata.org/' },
    { title: 'World Resources Institute', url: 'https://www.wri.org/' },
    { title: 'UN Sustainable Development Goals', url: 'https://sdgs.un.org/goals' },
  ];

  for (const item of items) {
    const match = mockSpecialResources.find(m => m.title === item.title);
    if (match) {
      await supabase.from('content_media').insert({
        content_item_id: item.id,
        media_type: 'external_link',
        url: match.url,
        sort_order: 0
      });
      console.log('Inserted media for', item.title);
    }
  }
}
main();
