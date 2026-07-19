import { useEffect, useMemo, useState } from 'react';
import { Search, Bookmark, Inbox, X } from 'lucide-react';
import { getProperties, type Property, type TenantInboxItem } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PageHeader, Spinner, EmptyState } from '../components/ui';
import PropertyCard from '../components/PropertyCard';
import PropertyDetailModal from '../components/PropertyDetailModal';

const INBOX_STORAGE_KEY = 'property-platform-inbox';

export default function TenantDashboard() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'browse' | 'inbox'>('browse');
  const [properties, setProperties] = useState<Property[]>([]);
  const [inbox, setInbox] = useState<TenantInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [selected, setSelected] = useState<Property | null>(null);

  const savedIds = useMemo(() => new Set(inbox.map((i) => i.property_id)), [inbox]);

  function readInbox() {
    try {
      const raw = window.localStorage.getItem(INBOX_STORAGE_KEY);
      if (!raw) return [] as TenantInboxItem[];
      return JSON.parse(raw) as TenantInboxItem[];
    } catch {
      return [] as TenantInboxItem[];
    }
  }

  function writeInbox(items: TenantInboxItem[]) {
    window.localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(items));
  }

  async function loadProperties() {
    setLoading(true);
    try {
      const data = await getProperties();
      setProperties(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadInbox() {
    const items = readInbox().filter((item) => item.tenant_id === profile?.id);
    setInbox(items);
  }

  useEffect(() => {
    loadProperties();
    loadInbox();
  }, [profile?.id]);

  async function toggleSave(propertyId: string) {
    if (!profile?.id) return;
    const existing = inbox.find((item) => item.tenant_id === profile.id && item.property_id === propertyId);
    if (existing) {
      const next = inbox.filter((item) => !(item.tenant_id === profile.id && item.property_id === propertyId));
      setInbox(next);
      writeInbox(next);
      return;
    }

    const property = properties.find((item) => item.id === propertyId);
    const nextItem: TenantInboxItem = {
      id: `${profile.id}-${propertyId}`,
      tenant_id: profile.id,
      property_id: propertyId,
      saved_at: new Date().toISOString(),
      property,
    };
    const next = [nextItem, ...inbox];
    setInbox(next);
    writeInbox(next);
  }

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (tab === 'browse' && !p.available) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      }
      if (city && !p.city.toLowerCase().includes(city.toLowerCase())) return false;
      if (maxRent && p.rent > Number(maxRent)) return false;
      return true;
    });
  }, [properties, tab, search, city, maxRent]);

  const inboxProperties = useMemo(
    () => inbox.map((i) => i.property).filter(Boolean) as Property[],
    [inbox]
  );

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile?.full_name || 'Tenant'}`}
        subtitle="Browse available properties and save the ones you like."
      />

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setTab('browse')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'browse' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Search className="w-4 h-4" />
          Browse
        </button>
        <button
          onClick={() => setTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'inbox' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          My Inbox
          {inbox.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold">
              {inbox.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'browse' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or description..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm text-slate-900 placeholder-slate-400"
              />
            </div>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm text-slate-900 placeholder-slate-400 w-40"
            />
            <input
              type="number"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              placeholder="Max rent"
              className="px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm text-slate-900 placeholder-slate-400 w-32"
            />
            {(search || city || maxRent) && (
              <button
                onClick={() => {
                  setSearch('');
                  setCity('');
                  setMaxRent('');
                }}
                className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Search className="w-6 h-6" />} title="No properties found" subtitle="Try adjusting your filters." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  saved={savedIds.has(p.id)}
                  onToggleSave={() => toggleSave(p.id)}
                  onSelect={() => setSelected(p)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'inbox' && (
        <>
          {inboxProperties.length === 0 ? (
            <EmptyState icon={<Inbox className="w-6 h-6" />} title="Your inbox is empty" subtitle="Save properties while browsing to see them here." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {inboxProperties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  saved
                  onToggleSave={() => toggleSave(p.id)}
                  onSelect={() => setSelected(p)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {selected && (
        <PropertyDetailModal
          property={selected}
          saved={savedIds.has(selected.id)}
          onToggleSave={() => toggleSave(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
