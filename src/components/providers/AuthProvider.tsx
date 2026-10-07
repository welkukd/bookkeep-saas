'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User, Session } from '@supabase/supabase-js';
import { Profile, Household, HouseholdMember } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  household: Household | null;
  householdMembers: HouseholdMember[];
  loading: boolean;
  switchHousehold: (householdId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Simple mock client that won't crash during build
function createMockSupabaseClient() {
  // Create a mock that returns proper types
  const mockQuery: any = {
    select: () => mockQuery,
    eq: () => mockQuery,
    single: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } }),
  };

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => mockQuery,
    update: () => Promise.resolve({ error: { message: 'Not available during build' } }),
  };
}

// Lazy Supabase client creation with defensive checks
function getSupabaseClient() {
  // Server-side: return a minimal mock that won't crash during build
  if (typeof window === 'undefined') {
    return createMockSupabaseClient();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Supabase environment variables not configured');
    return createMockSupabaseClient();
  }

  return createBrowserClient(url, key);
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  household: Household | null;
  householdMembers: HouseholdMember[];
  loading: boolean;
  switchHousehold: (householdId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setHousehold(null);
        setHouseholdMembers([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const supabase: any = getSupabaseClient();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
        
        if (profileData.default_household_id) {
          await fetchHousehold(profileData.default_household_id);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchHousehold = async (householdId: string) => {
    try {
      const supabase: any = getSupabaseClient();
      const { data: householdData } = await supabase
        .from('households')
        .select('*')
        .eq('id', householdId)
        .single();

      if (householdData) {
        setHousehold(householdData);
        
        // Fetch members
        const { data: members } = await supabase
          .from('household_members')
          .select(`
            *,
            profile:profiles(*)
          `)
          .eq('household_id', householdId);
        
        setHouseholdMembers(members || []);
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  };

  const switchHousehold = async (householdId: string) => {
    if (!user) return;
    
    const supabase: any = getSupabaseClient();
    await supabase
      .from('profiles')
      .update({ default_household_id: householdId })
      .eq('id', user.id);
    
    await fetchHousehold(householdId);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    const supabase: any = getSupabaseClient();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      household,
      householdMembers,
      loading,
      switchHousehold,
      refreshProfile,
      signOut,
    }}>
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