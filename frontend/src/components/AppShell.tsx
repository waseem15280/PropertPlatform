import { type ReactNode } from 'react';
import { Building2, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import type { Role } from '../lib/api';

const ROLE_LABELS: Record<Role, string> = {
  tenant: 'Tenant',
  dealer: 'Property Dealer',
  support: 'Support Executive',
  admin: 'System Admin',
};

interface NavItem {
  key: string;
  label: string;
  icon: typeof Building2;
}

export default function AppShell({
  nav,
  active,
  onNavigate,
  children,
}: {
  nav: NavItem[];
  active: string;
  onNavigate: (key: string) => void;
  children: ReactNode;
}) {
  const { profile, signOut } = useAuth();
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 leading-tight">EstateHub</div>
              <div className="text-xs text-slate-400">Property Platform</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200">
          <div className="px-2 py-2 mb-2">
            <div className="text-sm font-medium text-slate-900 truncate">{profile.full_name || profile.email}</div>
            <div className="text-xs text-emerald-600 font-medium">{ROLE_LABELS[profile.role]}</div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
