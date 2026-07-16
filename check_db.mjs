import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data: envItems } = await supabase.from('environmental_catalog').select('*');
  console.log(`Total environmental_catalog items: ${envItems?.length || 0}`);
  if (envItems && envItems.length > 0) {
    console.log(envItems);
  }
}

main();
