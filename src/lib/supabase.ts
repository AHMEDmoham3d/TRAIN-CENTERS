// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// ✅ بيانات مشروعك في Supabase
const supabaseUrl = 'https://biqzcfbcsflriybyvtur.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcXpjZmJjc2Zscml5Ynl2dHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTczMDQsImV4cCI6MjA3NTMzMzMwNH0.J9kVaVrOpv83CQs6Q9N7TJQ34HGBbPR_1Vf_XaycMT0'

// ✅ إنشاء عميل Supabase مع إعدادات الجلسة
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,         // يحافظ على الجلسة بعد إعادة التحميل
    autoRefreshToken: true,       // يحدث التوكن تلقائيًا
    detectSessionInUrl: true      // يدعم تسجيل الدخول عبر redirect
  }
})

// ✅ عند تحميل الصفحة، نحاول استعادة الـ access_token من localStorage
const token = localStorage.getItem("access_token")

if (token) {
  supabase.auth.setSession({
    access_token: token,
    refresh_token: token, // نستخدم نفس التوكن لتجنب أي خطأ
  })
  console.log("🔑 Supabase client session restored")
}
