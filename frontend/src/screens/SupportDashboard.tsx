import { useEffect, useState } from 'react';
import { Inbox, Users, Handshake, Building2, Bookmark } from 'lucide-react';
import { getProperties, getUsers, type Deal, type Profile, type Property, type TenantInboxItem } from '../lib/api';
import { PageHeader, Spinner, EmptyState, Badge, Card } from '../components/ui';

export type SupportTab = 'overview' | 'inboxes' | 'deals' | 'dealers';

const INBOX_STORAGE_KEY = 'property-platform-inbox';

export default function SupportDashboard({ tab, setTab }: { tab: SupportTab; setTab: (t: SupportTab) => void }) {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Profile[]>([]);
  const [dealers, setDealers] = useState<Profile[]>([]);
  const [inboxItems, setInboxItems] = useState<(TenantInboxItem & { property?: Property })[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [users, props] = await Promise.all([getUsers(), getProperties()]);
        const all = users.filter((user) => user.role !== 'support' && user.role !== 'admin');
        setTenants(all.filter((user) => user.role === 'tenant'));
        setDealers(all.filter((user) => user.role === 'dealer'));
        setProperties(props);

        const inboxFromStorage = readInboxItems();
        setInboxItems(inboxFromStorage);
        setDeals(readDeals());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const finalizedDeals = deals.filter((d) => d.status === 'finalized');
  const inboxByTenant = tenants.map((t) => ({
    tenant: t,
    items: inboxItems.filter((i) => i.tenant_id === t.id),
  }));

  const tabs: { key: SupportTab; label: string; icon: typeof Inbox }[] = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'inboxes', label: 'Tenant Inboxes', icon: Inbox },
    { key: 'deals', label: 'Finalized Deals', icon: Handshake },
    { key: 'dealers', label: 'Property Dealers', icon: Users },
  ];

  return (
    <div>
      <PageHeader title="Support Console" subtitle="Read-only oversight of tenant activity, deals, and dealers." />

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {tab === 'overview' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Users className="w-5 h-5" />} label="Tenants" value={tenants.length} tone="blue" />
              <StatCard icon={<Building2 className="w-5 h-5" />} label="Property Dealers" value={dealers.length} tone="emerald" />
              <StatCard icon={<Bookmark className="w-5 h-5" />} label="Saved Properties" value={inboxItems.length} tone="amber" />
              <StatCard icon={<Handshake className="w-5 h-5" />} label="Finalized Deals" value={finalizedDeals.length} tone="violet" />
              <div className="col-span-2 lg:col-span-4">
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Inbox Activity</h3>
                  {inboxItems.length === 0 ? (
                    <p className="text-sm text-slate-400">No saved properties yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {inboxItems.slice(0, 5).map((i) => (
                        <li key={i.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 truncate">{i.property?.title || 'Unknown property'}</span>
                          <span className="text-xs text-slate-400">{new Date(i.saved_at).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </div>
          )}

          {tab === 'inboxes' && (
            <div className="space-y-4">
              {inboxByTenant.length === 0 ? (
                <EmptyState icon={<Inbox className="w-6 h-6" />} title="No tenants yet" />
              ) : (
                inboxByTenant.map(({ tenant, items }) => (
                  <Card key={tenant.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-slate-900">{tenant.full_name || tenant.email}</div>
                        <div className="text-xs text-slate-400">{tenant.email}</div>
                      </div>
                      <Badge tone={items.length > 0 ? 'green' : 'neutral'}>{items.length} saved</Badge>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-sm text-slate-400">Inbox empty.</p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {items.map((i) => (
                          <li key={i.id} className="py-2 flex items-center justify-between text-sm">
                            <span className="text-slate-700 truncate">{i.property?.title || '—'}</span>
                            <span className="text-xs text-slate-400">{i.property ? `$${i.property.rent.toLocaleString()}/mo` : ''}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === 'deals' && (
            <>
              {finalizedDeals.length === 0 ? (
                <EmptyState icon={<Handshake className="w-6 h-6" />} title="No finalized deals" subtitle="Deals marked finalized by dealers will appear here." />
              ) : (
                <Card className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Property</th>
                        <th className="text-left px-4 py-3 font-medium">Tenant</th>
                        <th className="text-left px-4 py-3 font-medium">Dealer</th>
                        <th className="text-right px-4 py-3 font-medium">Brokerage</th>
                        <th className="text-right px-4 py-3 font-medium">Finalized</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {finalizedDeals.map((d) => {
                        const prop = properties.find((p) => p.id === d.property_id);
                        const tenant = tenants.find((t) => t.id === d.tenant_id);
                        const dealer = dealers.find((dd) => dd.id === d.dealer_id);
                        return (
                          <tr key={d.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-900">{prop?.title || '—'}</td>
                            <td className="px-4 py-3 text-slate-600">{tenant?.full_name || tenant?.email || '—'}</td>
                            <td className="px-4 py-3 text-slate-600">{dealer?.full_name || dealer?.email || '—'}</td>
                            <td className="px-4 py-3 text-right text-slate-900 font-medium">${d.brokerage_amount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-slate-500">{d.finalized_at ? new Date(d.finalized_at).toLocaleDateString() : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              )}
            </>
          )}

          {tab === 'dealers' && (
            <>
              {dealers.length === 0 ? (
                <EmptyState icon={<Users className="w-6 h-6" />} title="No property dealers" />
              ) : (
                <div className="space-y-3">
                  {dealers.map((d) => {
                    const dealerProps = properties.filter((p) => p.dealer_id === d.id);
                    return (
                      <Card key={d.id} className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold shrink-0">
                          {(d.full_name || d.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900">{d.full_name || 'Unnamed'}</div>
                          <div className="text-sm text-slate-400 truncate">{d.email}</div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-slate-900">{dealerProps.length}</div>
                            <div className="text-xs text-slate-400">Listings</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-emerald-600">{dealerProps.filter((p) => p.available).length}</div>
                            <div className="text-xs text-slate-400">Available</div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function readInboxItems(): (TenantInboxItem & { property?: Property })[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(INBOX_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as (TenantInboxItem & { property?: Property })[];
  } catch {
    return [];
  }
}

function readDeals(): Deal[] {
  return [];
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'blue' | 'emerald' | 'amber' | 'violet' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <Card className="p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${tones[tone]}`}>{icon}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </Card>
  );
}
