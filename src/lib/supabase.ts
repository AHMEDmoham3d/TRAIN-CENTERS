import { createClient } from "@supabase/supabase-js"

// ✅ اكتب القيم مباشرة بدل import.meta.env
const supabaseUrl = "https://biqzcfbcsflriybyvtur.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcXpjZmJjc2Zscml5Ynl2dHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTczMDQsImV4cCI6MjA3NTMzMzMwNH0.J9kVaVrOpv83CQs6Q9N7TJQ34HGBbPR_1Vf_XaycMT0"

// ✅ استعادة التوكن من localStorage لو موجود
const storedToken = localStorage.getItem("access_token")

// ✅ إنشاء عميل Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// ✅ دالة لاستعادة الجلسة بعد إعادة التحميل
export async function restoreSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) console.error("❌ Error restoring session:", error)
  if (data.session) {
    console.log("🔑 Supabase client session restored:", data.session.user.email)
  } else {
    console.warn("⚠️ No active Supabase session found.")
  }
}
