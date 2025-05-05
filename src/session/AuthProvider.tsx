import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../db/supabaseClient';

const ENABLE_LOGS = true; // Set to false to disable logs

interface AuthContextType {
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ENABLE_LOGS) {
      console.log('AuthProvider mounted');
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (ENABLE_LOGS) {
        if (data.session?.user) {
          console.log('User session active');
        } else {
          console.log('No login or expired token');
        }
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (ENABLE_LOGS) {
        if (session?.user) {
          console.log('User logged in');
        } else {
          console.log('User logged out or token expired');
        }
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
      if (ENABLE_LOGS) {
        console.log('AuthProvider unmounted');
      }
    };
  }, []);

  useEffect(() => {
    if (ENABLE_LOGS) {
      console.log('Auth state changed:', { user, loading });
    }
  }, [user, loading]);

  const signOut = async () => {
    if (ENABLE_LOGS) {
      console.log('User signed out');
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 