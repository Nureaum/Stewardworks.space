import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const catMap = {
    'Imperial County Bioregion': 'b656aac2-fff4-4bb7-87db-3e23a9b5f2bf',
    'Indigenous People of Imperial County': '7f7ac9ef-daa9-4de3-80b5-46815141a7e5',
    'Imperial County History': '669ca669-be95-4ce8-bd2a-353674bed365',
    'Imperial County & the Wider World': '6b36a928-d4a8-4278-890f-e4735636da7e'
  };

  const mockSpecialResources = [
    { title: 'Calscape - California Native Plant Society', url: 'https://calscape.org/', catName: 'Imperial County Bioregion', type: 'tool', note: 'Find native plants for your exact location and the wildlife they support.', date: 'Apr 2026' },
    { title: 'iNaturalist', url: 'https://www.inaturalist.org/', catName: 'Imperial County Bioregion', type: 'tool', note: 'Log and identify the desert plants and animals around you with a global community.', date: 'Apr 2026' },
    { title: 'Audubon Bird Guide', url: 'https://www.audubon.org/bird-guide', catName: 'Imperial County Bioregion', type: 'tool', note: 'Identify the birds of the Pacific Flyway and the Salton Sea.', date: 'Apr 2026' },
    { title: 'Quechan Indian Tribe - Fort Yuma', url: 'https://www.quechantribe.com/', catName: 'Indigenous People of Imperial County', type: 'article', note: 'The Quechan people of the lower Colorado River, in their own words.', date: 'Apr 2026' },
    { title: 'Native Land Digital', url: 'https://native-land.ca/', catName: 'Indigenous People of Imperial County', type: 'tool', note: 'Map the Indigenous territories, languages, and treaties beneath the valley.', date: 'Apr 2026' },
    { title: 'National Museum of the American Indian', url: 'https://americanindian.si.edu/', catName: 'Indigenous People of Imperial County', type: 'article', note: 'Smithsonian collections and teaching resources on Native nations.', date: 'Apr 2026' },
    { title: 'Calisphere - California digital archive', url: 'https://calisphere.org/', catName: 'Imperial County History', type: 'tool', note: 'Search historical photos and documents, including Imperial County.', date: 'Apr 2026' },
    { title: 'Salton Sea Authority', url: 'https://saltonseaauthority.org/', catName: 'Imperial County History', type: 'article', note: 'The agency managing the Salton Sea, central to the valley today.', date: 'Apr 2026' },
    { title: 'Imperial Irrigation District', url: 'https://www.iid.com/', catName: 'Imperial County History', type: 'article', note: 'The water and power that made the Imperial Valley farmable.', date: 'Apr 2026' },
    { title: 'Our World in Data', url: 'https://ourworldindata.org/', catName: 'Imperial County & the Wider World', type: 'tool', note: 'Global development and environment data to place the valley in context.', date: 'Apr 2026' },
    { title: 'World Resources Institute', url: 'https://www.wri.org/', catName: 'Imperial County & the Wider World', type: 'tool', note: 'Worldwide research linking local land and water to global trends.', date: 'Apr 2026' },
    { title: 'UN Sustainable Development Goals', url: 'https://sdgs.un.org/goals', catName: 'Imperial County & the Wider World', type: 'article', note: 'The global goals that frame local environmental stewardship.', date: 'Apr 2026' },
  ];

  // Insert one by one to get the inserted item ID for content_media
  let count = 0;
  for (const m of mockSpecialResources) {
    const item = {
      title: m.title,
      body: m.note,
      content_type: 'library_resource',
      category_id: catMap[m.catName],
      status: 'published',
      published_at: new Date().toISOString()
    };
    
    const { data: itemData, error: itemError } = await supabase.from('content_items').insert(item).select().single();
    
    if (itemError) {
      console.error('Error inserting item:', itemError);
      continue;
    }
    
    if (m.url) {
      const mediaItem = {
        content_item_id: itemData.id,
        media_type: m.type === 'tool' ? 'link' : 'document', // mapping
        url: m.url,
        sort_order: 0
      };
      
      const { error: mediaError } = await supabase.from('content_media').insert(mediaItem);
      if (mediaError) {
        console.error('Error inserting media:', mediaError);
      }
    }
    count++;
  }
  
  console.log(`Successfully inserted ${count} mock resources!`);
}

main();
