import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from('student_history')
    .select('*')
    .limit(1);
    
  console.log("student_history test:", { data, error });
}

check();
