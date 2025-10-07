import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// Types for authentication
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'admin' | 'company';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean | null; // null means not initialized yet
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: null, // Not initialized
  token: null,
  loading: false,
  error: null,

  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        set({ isAuthenticated: false });
        return;
      }

      if (session?.user) {
        // Get user profile from users table
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error getting user profile:', profileError);
          set({ isAuthenticated: false });
          return;
        }

        set({
          user: {
            id: session.user.id,
            name: userProfile.name || session.user.email || '',
            email: session.user.email || '',
            role: userProfile.role,
          },
          token: session.access_token,
          isAuthenticated: true,
        });
      } else {
        set({ isAuthenticated: false });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isAuthenticated: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Get user profile from users table
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        set({
          user: {
            id: data.user.id,
            name: userProfile.name || data.user.email || '',
            email: data.user.email || '',
            role: userProfile.role,
          },
          token: data.session?.access_token || null,
          isAuthenticated: true,
          loading: false,
        });
      }
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
        isAuthenticated: false,
      });
    }
  },

  register: async (name, email, password, role) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Insert into users table
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              name,
              email,
              role,
            },
          ]);

        if (insertError) {
          throw insertError;
        }

        set({
          user: {
            id: data.user.id,
            name,
            email,
            role: role as User['role'],
          },
          token: data.session?.access_token || null,
          isAuthenticated: true,
          loading: false,
        });
      }
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
        isAuthenticated: false,
      });
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
      }

      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },
}));
