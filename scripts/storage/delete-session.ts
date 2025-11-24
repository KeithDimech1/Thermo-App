/**
 * Delete extraction session files from Supabase Storage
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteSessionFiles(sessionId: string) {
  console.log(`Deleting files for session: ${sessionId}`);
  
  // List all files in the session folder
  const { data: files, error: listError } = await supabase.storage
    .from('extractions')
    .list(sessionId);

  if (listError) {
    console.error('Error listing files:', listError);
    return;
  }

  if (!files || files.length === 0) {
    console.log('No files found in root folder');
  } else {
    console.log(`Found ${files.length} items in root`);

    // Delete all files in the folder
    const filePaths = files.map(file => `${sessionId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from('extractions')
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting files:', deleteError);
    } else {
      console.log(`✅ Deleted ${files.length} files from root`);
    }
  }

  // Try to delete subfolders
  const subfolders = ['text', 'images/tables', 'images/figures', 'images'];
  for (const subfolder of subfolders) {
    const { data: subFiles, error: subListError } = await supabase.storage
      .from('extractions')
      .list(`${sessionId}/${subfolder}`);

    if (subFiles && subFiles.length > 0) {
      const subFilePaths = subFiles.map(file => `${sessionId}/${subfolder}/${file.name}`);
      await supabase.storage.from('extractions').remove(subFilePaths);
      console.log(`✅ Deleted ${subFiles.length} files from ${subfolder}`);
    }
  }

  console.log('✅ All session files deleted from storage');
}

const sessionId = process.argv[2];
if (!sessionId) {
  console.error('Usage: npx tsx scripts/storage/delete-session.ts <sessionId>');
  process.exit(1);
}

deleteSessionFiles(sessionId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
