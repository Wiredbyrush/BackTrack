import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://imdumigrlvujbyvczbpm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZHVtaWdybHZ1amJ5dmN6YnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NjcwMTQsImV4cCI6MjA4NDQ0MzAxNH0.cm68e3sGIolEqIl-H4vlJGhE7YISe1vKqAoQncKWYsE';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const config = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};
