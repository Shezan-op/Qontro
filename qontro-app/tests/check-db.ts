import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local if not already set
function getEnv(key: string): string {
  if (process.env[key]) return process.env[key]!;
  try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [k, ...v] = trimmed.split('=');
          if (k.trim() === key) {
            return v.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      }
    }
  } catch {}
  return '';
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!url || !key) {
  console.error('Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  console.log('Testing Supabase connection...');
  const tables = [
    'workspaces',
    'workspace_members',
    'projects',
    'tasks',
    'task_comments',
    'task_history',
    'skills',
    'clients',
    'invoices',
    'expenses',
    'documents',
    'activity_logs',
    'ai_recommendations',
    'invitations'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(2);
      if (error) {
        console.log(`Table [${table}]: ERROR - ${error.message} (code: ${error.code})`);
      } else {
        console.log(`Table [${table}]: OK - count/rows returned: ${data.length}`);
        if (data.length > 0) {
          console.log(`  Sample:`, JSON.stringify(data[0]));
        }
      }
    } catch (e: any) {
      console.log(`Table [${table}]: EXCEPTION - ${e.message}`);
    }
  }
}

check().catch(console.error);
