import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function run() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('List Error:', listError);
    return;
  }
  
  if (buckets.find(b => b.name === 'fuel-receipts')) {
    console.log('Bucket fuel-receipts already exists');
  } else {
    const { data, error } = await supabase.storage.createBucket('fuel-receipts', {
      public: false,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      fileSizeLimit: 5242880
    });
    if (error) console.error('Create Error:', error);
    else console.log('Bucket created:', data);
  }
}
run();
