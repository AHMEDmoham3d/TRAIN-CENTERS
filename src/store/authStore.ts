import { create } from 'zustand';

// Types for authentication
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
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

// Mock authentication data (to be replaced with real backend integration)
const mockUsers: User[] = [
  { id: '1', name: 'Student User', email: 'student@example.com', role: 'student' },
  { id: '2', name: 'Teacher User', email: 'teacher@example.com', role: 'teacher' },
  { id: '3', name: 'Parent User', email: 'parent@example.com', role: 'parent' },
  { id: '4', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
];

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: null, // Not initialized
  token: null,
  loading: false,
  error: null,

  initialize: () => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('trainify-user');
    const storedToken = localStorage.getItem('trainify-token');

    if (storedUser && storedToken) {
      set({
        user: JSON.parse(storedUser),
        token: storedToken,
        isAuthenticated: true,
      });
    } else {
      set({ isAuthenticated: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Find user by email (mock implementation)
      const user = mockUsers.find(u => u.email === email);

      // Simple validation (in a real app, this would be done by the backend)
      if (!user || password !== 'password') {
        throw new Error('Invalid email or password');
      }

      // Generate a mock token
      const token = `mock-jwt-token-${Date.now()}`;

      // Store in localStorage for persistence
      localStorage.setItem('trainify-user', JSON.stringify(user));
      localStorage.setItem('trainify-token', token);

      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
        isAuthenticated: false,
      });
    }
  },

  register: async (name, email, _password, role) => {
    set({ loading: true, error: null });

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Check if user already exists (mock implementation)
      if (mockUsers.some(u => u.email === email)) {
        throw new Error('Email already in use');
      }

      // Create new user (in a real app, this would be done by the backend)
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role: role as 'student' | 'teacher' | 'parent' | 'admin',
      };

      // Mock adding to the "database"
      mockUsers.push(newUser);

      // Generate a mock token
      const token = `mock-jwt-token-${Date.now()}`;

      // Store in localStorage for persistence
      localStorage.setItem('trainify-user', JSON.stringify(newUser));
      localStorage.setItem('trainify-token', token);

      set({
        user: newUser,
        token,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
        isAuthenticated: false,
      });
    }
  },

  logout: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    // Remove from localStorage
    localStorage.removeItem('trainify-user');
    localStorage.removeItem('trainify-token');

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
}));