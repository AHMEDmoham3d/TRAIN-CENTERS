import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biqzcfbcsflriybyvtur.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcXpjZmJjc2Zscml5Ynl2dHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTczMDQsImV4cCI6MjA3NTMzMzMwNH0.J9kVaVrOpv83CQs6Q9N7TJQ34HGBbPR_1Vf_XaycMT0'

export const supabase = createClient(supabaseUrl, supabaseKey)
