// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://biqzcfbcsflriybyvtur.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcXpjZmJjc2Zscml5Ynl2dHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTczMDQsImV4cCI6MjA3NTMzMzMwNH0.J9kVaVrOpv83CQs6Q9N7TJQ34HGBbPR_1Vf_XaycMT0'

// ✅ إنشاء العميل
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// ✅ دالة لتفعيل التوكن (مهمة جدًا)
export const restoreSession = async () => {
  const token = localStorage.getItem("access_token")
  if (token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token,
    })

    if (error) {
      console.error("❌ Failed to restore session:", error)
    } else {
      console.log("🔑 Supabase session restored:", data.session?.user?.email)
    }
  }
}
