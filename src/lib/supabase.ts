/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://bpvwkmkwecjqwjyvtzuh.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwdndrbWt3ZWNqcXdqeXZ0enVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTE0NTMsImV4cCI6MjA5MTUyNzQ1M30.tvxInTWS0sAU3iX5G0qPcmPdr5mjLA5NIEdtNp-CjCY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
