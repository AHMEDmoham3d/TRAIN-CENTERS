import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ✅ استعادة التوكن من localStorage لو موجود
const storedToken = localStorage.getItem("access_token")

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
  }
}
