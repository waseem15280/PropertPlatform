import { useState } from 'react';
import { Building2, Search, Users, Handshake, Inbox } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';
import AuthScreen from './screens/AuthScreen';
import AppShell from './components/AppShell';
import TenantDashboard from './screens/TenantDashboard';
import DealerDashboard from './screens/DealerDashboard';
import SupportDashboard, { SupportTab } from './screens/SupportDashboard';

function RoleRouter() {
  const { profile, loading } = useAuth();
  const [active, setActive] = useState('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return <AuthScreen />;

  // Tenant
  if (profile.role === 'tenant') {
    return (
      <AppShell
        nav={[{ key: 'home', label: 'Browse & Inbox', icon: Search }]}
        active={active}
        onNavigate={setActive}
      >
        <TenantDashboard />
      </AppShell>
    );
  }

  // Dealer
  if (profile.role === 'dealer') {
    return (
      <AppShell
        nav={[{ key: 'home', label: 'My Listings', icon: Building2 }]}
        active={active}
        onNavigate={setActive}
      >
        <DealerDashboard />
      </AppShell>
    );
  }

  // Support & Admin both get the oversight console
  return (
    <AppShell
      nav={[
        { key: 'overview', label: 'Overview', icon: Building2 },
        { key: 'inboxes', label: 'Tenant Inboxes', icon: Inbox },
        { key: 'deals', label: 'Finalized Deals', icon: Handshake },
        { key: 'dealers', label: 'Property Dealers', icon: Users },
      ]}
      active={active}
      onNavigate={(k) => setActive(k as SupportTab)}
    >
      <SupportDashboard tab={active as SupportTab} setTab={(t) => setActive(t)} />
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RoleRouter />
    </AuthProvider>
  );
}
