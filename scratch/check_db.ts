import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const urlMatch = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

const supabase = createClient(urlMatch![1], keyMatch![1]);

async function run() {
  const { data, error } = await supabase.from('teams').select('*').limit(1);
  console.log('Select result:', data, error);
}
run();
