/**
 * List all contents of Supabase storage buckets
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllBuckets() {
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('❌ Error listing buckets:', error.message);
    return;
  }

  console.log('━'.repeat(80));
  console.log('SUPABASE STORAGE BUCKETS');
  console.log('━'.repeat(80));
  console.log();

  for (const bucket of buckets) {
    console.log(`\n📦 Bucket: ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    console.log(`   ID: ${bucket.id}`);
    console.log(`   Created: ${new Date(bucket.created_at).toLocaleString()}`);

    // List top-level contents
    const { data: files, error: listError } = await supabase.storage
      .from(bucket.name)
      .list('', { limit: 1000 });

    if (listError) {
      console.log(`   ❌ Error listing contents: ${listError.message}`);
      continue;
    }

    if (!files || files.length === 0) {
      console.log(`   Empty`);
      continue;
    }

    console.log(`   Contents (${files.length} items):`);
    for (const file of files) {
      const type = file.metadata?.mimetype || file.id ? '📁 folder' : '📄 file';
      const size = file.metadata?.size ? ` (${(file.metadata.size / 1024).toFixed(2)} KB)` : '';
      console.log(`     ${type} ${file.name}${size}`);

      // If it looks like a folder, list its contents too
      if (file.id) {
        const { data: subFiles, error: subError } = await supabase.storage
          .from(bucket.name)
          .list(file.name, { limit: 100 });

        if (!subError && subFiles && subFiles.length > 0) {
          console.log(`       → ${subFiles.length} files inside`);
          for (const subFile of subFiles.slice(0, 5)) {
            console.log(`          - ${subFile.name}`);
          }
          if (subFiles.length > 5) {
            console.log(`          ... and ${subFiles.length - 5} more`);
          }
        }
      }
    }
  }

  console.log('\n' + '━'.repeat(80));
}

listAllBuckets().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
