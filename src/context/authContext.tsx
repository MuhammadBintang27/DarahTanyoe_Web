// context/authContext.tsx
"use client";

import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  full_name?: string;
  institution_name?: string;
  institution_type?: 'hospital' | 'pmi';
  user_type?: string;
  [key: string]: any;
}

interface Session {
  access_token: string;
  refresh_token: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, session: Session) => void;
  logout: () => void;
  checkAuthStatus: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  checkAuthStatus: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Function to check auth status that can be called anytime
  const checkAuthStatus = useCallback((): boolean => {
    try {
      // Check both token and user data
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user_data');
      
      console.log('[Auth Check] Token exists:', !!token);
      console.log('[Auth Check] User data exists:', !!userData);
      
      return !!(token && userData);
    } catch (error) {
      console.error('[Auth Check] Error checking auth:', error);
      return false;
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    const initAuth = () => {
      console.log('[Auth] Initializing auth...');
      try {
        // Prevent multiple initializations
        if (initialized) return;
        
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');
        
        console.log('[Auth] Found token:', !!token);
        console.log('[Auth] Found user data:', !!userData);
        
        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            console.log('[Auth] Setting user:', parsedUser.email);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } catch (e) {
            console.error('[Auth] Error parsing user data:', e);
            // Clear invalid data
            localStorage.removeItem('user_data');
            localStorage.removeItem('access_token');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log('[Auth] No auth data found');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        setInitialized(true);
        console.log('[Auth] Initialization complete');
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initAuth, 100);
    return () => clearTimeout(timer);
  }, [initialized]);

  // Handle navigation based on auth status
  useEffect(() => {
    if (!loading && initialized) {
      const isLoggedIn = checkAuthStatus();
      console.log('[Auth] Current path:', pathname);
      console.log('[Auth] Is authenticated:', isLoggedIn);
      
      // Public routes that don't require authentication
      const publicRoutes = ['/login', '/register', '/'];
      const isPublicRoute = publicRoutes.includes(pathname);
      
      // If at login/register page but already logged in, redirect to dashboard
      if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
        console.log('[Auth] Already logged in, redirecting to dashboard');
        router.replace('/');
      }
      
      // If at protected route but not logged in, redirect to login
      if (!isLoggedIn && !isPublicRoute) {
        console.log('[Auth] Not authenticated, redirecting to login');
        router.replace('/login');
      }
    }
  }, [loading, initialized, pathname, router, checkAuthStatus]);

  const login = (userData: User, session: Session) => {
    try {
      console.log('[Auth] Logging in user:', userData.email);
      localStorage.setItem("access_token", session.access_token);
      localStorage.setItem("refresh_token", session.refresh_token);
      localStorage.setItem("user_data", JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      console.log('[Auth] Login successful');
    } catch (error) {
      console.error('[Auth] Login error:', error);
    }
  };

  const logout = () => {
    try {
      console.log('[Auth] Logging out user');
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_data");
      setUser(null);
      setIsAuthenticated(false);
      console.log('[Auth] Redirecting to login page');
      router.push("/login");
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      isAuthenticated,
      checkAuthStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);