import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// مثال: أضف الحقلين لتعويض أي استخدام
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'admin' | 'company';
  center_subdomain?: string;   // كما جاي من الـ DB / supabase
  centerSubdomain?: string;    // اختياري: مريح لو كودك يستخدم camelCase
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, centerSlug: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string, centerSlug: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: null,
  token: null,
  loading: false,
  error: null,

  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        set({ isAuthenticated: false });
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        set({ isAuthenticated: false });
        return;
      }

      set({
        user: {
          id: session.user.id,
          name: userProfile.name || '',
          email: userProfile.email || '',
          role: userProfile.role,
          center_subdomain: userProfile.center_subdomain,
        },
        token: session.access_token,
        isAuthenticated: true,
      });
    } catch (err) {
      console.error('Initialize error:', err);
      set({ isAuthenticated: false });
    }
  },

  login: async (email, password, centerSlug) => {
    set({ loading: true, error: null });

    try {
      // ✅ التحقق من المستخدم في جدول users المرتبط بالسنتر الحالي
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .ilike('center_subdomain', centerSlug)
        .maybeSingle();

      if (userError || !userRecord) {
        throw new Error('No user found for this center.');
      }

      // تسجيل الدخول
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({
        user: {
          id: data.user?.id || '',
          name: userRecord.name || data.user?.email || '',
          email: data.user?.email || '',
          role: userRecord.role,
          center_subdomain: userRecord.center_subdomain,
        },
        token: data.session?.access_token || null,
        isAuthenticated: true,
        loading: false,
      });
    } catch (err) {
      console.error('Login error:', err);
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Login failed',
        isAuthenticated: false,
      });
    }
  },

  register: async (name, email, password, role, centerSlug) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              name,
              email,
              role,
              center_subdomain: centerSlug, // ✅ حفظ السنتر المسجل فيه
            },
          ]);

        if (insertError) throw insertError;

        set({
          user: {
            id: data.user.id,
            name,
            email,
            role: role as User['role'],
            center_subdomain: centerSlug,
          },
          token: data.session?.access_token || null,
          isAuthenticated: true,
          loading: false,
        });
      }
    } catch (err) {
      console.error('Register error:', err);
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Registration failed',
        isAuthenticated: false,
      });
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, token: null, isAuthenticated: false });
    } catch (err) {
      console.error('Logout error:', err);
    }
  },
}));
