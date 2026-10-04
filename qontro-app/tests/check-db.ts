import { createClient } from '@supabase/supabase-js';

const url = 'https://ejwbnbkupsfvfpnsbhgw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqd2JuYmt1cHNmdmZwbnNiaGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNTM4MjgsImV4cCI6MjA5ODYyOTgyOH0.rZURUan2lCQPJBL11PBeq5eqEmSMbNmvb_q_lMgfezE';

const supabase = createClient(url, key);

async function check() {
  console.log('Testing Supabase connection...');
  const tables = [
    'workspaces',
    'workspace_members',
    'profiles',
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
    'ai_recommendations'
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
