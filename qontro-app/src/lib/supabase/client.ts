import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejwbnbkupsfvfpnsbhgw.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqd2JuYmt1cHNmdmZwbnNiaGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNTM4MjgsImV4cCI6MjA5ODYyOTgyOH0.rZURUan2lCQPJBL11PBeq5eqEmSMbNmvb_q_lMgfezE';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
