import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { clearSession, getProfile, getStoredSession, type Profile } from './api';

interface AuthContextValue {
  session: { userId: string; profile: Profile } | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ userId: string; profile: Profile } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncSession = async () => {
      const stored = getStoredSession();
      if (stored?.userId) {
        setSession(stored);
        const freshProfile = await getProfile(stored.userId);
        setProfile(freshProfile);
      } else {
        setProfile(null);
        setSession(null);
      }
      setLoading(false);
    };

    syncSession();

    const handleAuthChange = () => {
      const stored = getStoredSession();
      if (stored?.userId) {
        setSession(stored);
        setProfile(stored.profile);
      } else {
        setSession(null);
        setProfile(null);
      }
    };

    window.addEventListener('auth:changed', handleAuthChange);
    return () => window.removeEventListener('auth:changed', handleAuthChange);
  }, []);

  async function refreshProfile() {
    const stored = getStoredSession();
    if (!stored?.userId) return;
    const freshProfile = await getProfile(stored.userId);
    if (freshProfile) {
      setProfile(freshProfile);
      setSession({ userId: stored.userId, profile: freshProfile });
    }
  }

  async function signOut() {
    clearSession();
    setProfile(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
