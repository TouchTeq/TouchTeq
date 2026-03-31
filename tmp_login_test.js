import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin() {
  console.log('Attempting login...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'info@touchteq.co.za',
    password: 'password123', // Just a guess, or maybe I don't need the password if the error is configuration.
  });
  
  if (error) {
    console.error('Login error:', error.message);
  } else {
    console.log('Login success:', data.user.id);
  }
}

testLogin();
