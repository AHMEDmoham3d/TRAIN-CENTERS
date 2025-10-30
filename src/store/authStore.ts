import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'admin' | 'company';
  center_subdomain?: string;   // snake_case كما في قاعدة البيانات
  centerSubdomain?: string;    // camelCase اختياري
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: string,
    centerSlug: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: null,
  token: null,
  loading: false,
  error: null,

  // ✅ تهيئة المستخدم من Supabase أو من LocalStorage
  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        console.warn("⚠️ No session found.");
        set({ isAuthenticated: false });
        return;
      }

      // ✅ نحاول نقرأ المستخدم من localStorage أولاً
      const localUser = JSON.parse(localStorage.getItem("user") || "null");
      if (localUser && localUser.center_subdomain) {
        console.log("✅ Loaded user from localStorage:", localUser);
        set({
          user: localUser,
          token: session.access_token,
          isAuthenticated: true,
        });
        return;
      }

      // ✅ لو مفيش في localStorage، نجيب البيانات من Supabase
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("id, full_name, email, role, center_id")
        .eq("id", session.user.id)
        .single();

      if (profileError || !userProfile) {
        console.error("❌ Error loading profile:", profileError);
        set({ isAuthenticated: false });
        return;
      }

      // ✅ نجلب subdomain من جدول centers
      const { data: centerData, error: centerError } = await supabase
        .from("centers")
        .select("subdomain")
        .eq("id", userProfile.center_id)
        .maybeSingle();

      if (centerError || !centerData) {
        console.warn("⚠️ Center not found for user.");
      }

      const center_subdomain =
        centerData?.subdomain ||
        localStorage.getItem("center_subdomain") ||
        undefined;

      // ✅ إنشاء كائن المستخدم النهائي
      const userData = {
        id: session.user.id,
        name: userProfile.full_name || "",
        email: userProfile.email || "",
        role: userProfile.role,
        center_subdomain,
      };

      // ✅ حفظ بيانات المستخدم محليًا
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("center_subdomain", center_subdomain || "");

      console.log("✅ Final user data:", userData);

      // ✅ تحديث الحالة في Zustand
      set({
        user: userData,
        token: session.access_token,
        isAuthenticated: true,
      });
    } catch (err) {
      console.error("Initialize error:", err);
      set({ isAuthenticated: false });
    }
  },

  // ✅ تسجيل الدخول (غير مستخدم حاليًا لأننا بنسجله يدويًا في Login.tsx)
  login: async (email: string, password: string) => {
    set({ loading: false, error: null });
  },

  // ✅ تسجيل مستخدم جديد
  register: async (name, email, password, role, centerSlug) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        const { error: insertError } = await supabase
          .from("users")
          .insert([
            {
              id: data.user.id,
              full_name: name,
              email,
              role,
              center_subdomain: centerSlug, // ✅ نحفظ السنتر المسجل فيه
            },
          ]);

        if (insertError) throw insertError;

        const newUser = {
          id: data.user.id,
          name,
          email,
          role: role as User["role"],
          center_subdomain: centerSlug,
        };

        localStorage.setItem("user", JSON.stringify(newUser));
        localStorage.setItem("center_subdomain", centerSlug);

        set({
          user: newUser,
          token: data.session?.access_token || null,
          isAuthenticated: true,
          loading: false,
        });
      }
    } catch (err) {
      console.error("Register error:", err);
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Registration failed",
        isAuthenticated: false,
      });
    }
  },

  // ✅ تسجيل الخروج
  logout: async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("user");
      localStorage.removeItem("center_subdomain");
      set({ user: null, token: null, isAuthenticated: false });
      console.log("🚪 Logged out successfully.");
    } catch (err) {
      console.error("Logout error:", err);
    }
  },
}));
