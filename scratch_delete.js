require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const idsToDelete = [
  "275059bf-1f8e-40b8-a623-3c23a87cba5c", // asdfghj
  "2ca16d88-566a-4c31-9934-ea1772a55517", // hi / anonymous
  "0bc28a78-33b4-4807-a255-dc3ff24b5d2f", // teismg phases 2
  "4cf2c096-3d0f-4864-805d-e2458d3d87f5", // tesing phase
  "77ea1484-4a68-46ba-8ee4-221aa8498e60"  // hi / hi
];

async function run() {
  const { data, error } = await supabase
    .from('content_items')
    .delete()
    .in('id', idsToDelete);
    
  if (error) console.error(error);
  else console.log('Successfully deleted ' + idsToDelete.length + ' junk items');
}

run();
