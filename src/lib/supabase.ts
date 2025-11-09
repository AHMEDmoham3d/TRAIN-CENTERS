import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biqzcfbcsflriybyvtur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcXpjZmJjc2Zscml5Ynl2dHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTczMDQsImV4cCI6MjA3NTMzMzMwNH0.J9kVaVrOpv83CQs6Q9N7TJQ34HGBbPR_1Vf_XaycMT0'; // زي ما عندك

const access_token = localStorage.getItem('access_token');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: access_token ? `Bearer ${access_token}` : '',
    },
  },
});
