import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'user' | 'admin' | 'super_admin';

interface User {
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fallback users for when backend is offline (local dev without DB)
const FALLBACK_USERS: { [email: string]: { password: string; role: UserRole; name: string } } = {
  'bhavya.oberoi@learnapp.co': {
    password: 'Learnapp@123',
    role: 'super_admin',
    name: 'Bhavya Oberoi'
  },
  'preproduction@learnapp.com': {
    password: '123456',
    role: 'user',
    name: 'ShootFlow Team'
  },
  'admin@learnapp.com': {
    password: '123456',
    role: 'admin',
    name: 'Admin'
  }
};

const API_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : 'https://divine-nature-production-c49a.up.railway.app';

const AUTH_STORAGE_KEY = 'preproduction_auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const normalizedEmail = email.toLowerCase().trim();

    // Try backend login first
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        setUser({
          email: data.user.email,
          role: data.user.role as UserRole,
          name: data.user.name
        });
        return true;
      }

      if (response.status === 401) {
        // Invalid credentials — don't fall through to local fallback
        return false;
      }
    } catch {
      // Backend offline — fall through to local fallback
      console.warn('Backend unavailable, using local auth fallback');
    }

    // Fallback: check hardcoded users
    const userConfig = FALLBACK_USERS[normalizedEmail];
    if (userConfig && userConfig.password === password) {
      setUser({
        email: normalizedEmail,
        role: userConfig.role,
        name: userConfig.name
      });
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
    isAuthenticated: user !== null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
