'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  demoUser: { email: string; name: string } | null;
  loginAsDemoUser: () => void;
  logoutDemoUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoUser, setDemoUser] = useState<{ email: string; name: string } | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    // Check if demo user saved in localStorage
    const savedDemo = localStorage.getItem('linktriage_demo_user');
    if (savedDemo) {
      try {
        setDemoUser(JSON.parse(savedDemo));
      } catch {
        // ignore
      }
    }

    if (!configured) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  const signInWithEmail = async (email: string, password: string) => {
    if (!configured) {
      return { error: 'Supabase is not configured. Please provide Supabase API keys or use Demo Mode.' };
    }
    const supabase = createClient();
    if (!supabase) return { error: 'Supabase client error' };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }
    return {};
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!configured) {
      return { error: 'Supabase is not configured. Please provide Supabase API keys or use Demo Mode.' };
    }
    const supabase = createClient();
    if (!supabase) return { error: 'Supabase client error' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user && !data.session) {
      return { message: 'Confirmation email sent. Please check your inbox to verify your account.' };
    }

    return {};
  };

  const signInWithGoogle = async () => {
    if (!configured) {
      return { error: 'Supabase is not configured. Please add Supabase URL and Anon Key to .env.local.' };
    }
    const supabase = createClient();
    if (!supabase) return { error: 'Supabase client error' };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    if (error) {
      return { error: error.message };
    }
    return {};
  };

  const signOut = async () => {
    logoutDemoUser();
    if (configured) {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }
    setUser(null);
    setSession(null);
  };

  const loginAsDemoUser = () => {
    const demo = { email: 'founder@linktriage.dev', name: 'Demo Founder' };
    setDemoUser(demo);
    localStorage.setItem('linktriage_demo_user', JSON.stringify(demo));
  };

  const logoutDemoUser = () => {
    setDemoUser(null);
    localStorage.removeItem('linktriage_demo_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured: configured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        demoUser,
        loginAsDemoUser,
        logoutDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
