import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Building2, X, Check, Loader2 } from 'lucide-react';
import { createProperty, deleteProperty, getProperties, updateProperty, type Property } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PageHeader, Spinner, EmptyState, Badge } from '../components/ui';

const TYPES = ['apartment', 'house', 'villa', 'studio', 'commercial', 'plot'] as const;

export default function DealerDashboard() {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);

  async function load() {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await getProperties({ dealerId: profile.id });
      setProperties(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [profile?.id]);

  async function toggleAvailability(p: Property) {
    try {
      await updateProperty(p.id, { ...p, available: !p.available });
      setProperties((prev) => prev.map((x) => (x.id === p.id ? { ...x, available: !x.available } : x)));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to update availability');
    }
  }

  async function removeProperty(p: Property) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await deleteProperty(p.id);
      setProperties((prev) => prev.filter((x) => x.id !== p.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to delete property');
    }
  }

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile?.full_name || 'Dealer'}`}
        subtitle="Manage your property listings and availability."
        action={
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-emerald-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatBox label="Total Listings" value={properties.length} />
        <StatBox label="Available" value={properties.filter((p) => p.available).length} tone="green" />
        <StatBox label="Unavailable" value={properties.filter((p) => !p.available).length} tone="amber" />
      </div>

      {loading ? (
        <Spinner />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-6 h-6" />}
          title="No properties yet"
          subtitle="Add your first property listing to get started."
        />
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 truncate">{p.title}</h3>
                  {p.available ? <Badge tone="green">Available</Badge> : <Badge tone="red">Unavailable</Badge>}
                </div>
                <div className="text-sm text-slate-500 truncate">
                  {p.address}{p.address && p.city ? ', ' : ''}{p.city} · ${p.rent.toLocaleString()}/mo
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleAvailability(p)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    p.available
                      ? 'text-amber-700 hover:bg-amber-50 border border-amber-200'
                      : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  {p.available ? 'Mark Unavailable' : 'Mark Available'}
                </button>
                <button
                  onClick={() => {
                    setEditing(p);
                    setShowForm(true);
                  }}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-50 border border-slate-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeProperty(p)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PropertyForm
          property={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function StatBox({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'green' | 'amber' }) {
  const tones = {
    neutral: 'text-slate-900',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`text-2xl font-bold ${tones[tone]}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function PropertyForm({ property, onClose, onSaved }: { property: Property | null; onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    title: property?.title || '',
    description: property?.description || '',
    address: property?.address || '',
    city: property?.city || '',
    rent: property?.rent?.toString() || '',
    deposit: property?.deposit?.toString() || '',
    bedrooms: property?.bedrooms?.toString() || '1',
    bathrooms: property?.bathrooms?.toString() || '1',
    area_sqft: property?.area_sqft?.toString() || '',
    property_type: property?.property_type || 'apartment',
    video_url: property?.video_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      rent: Number(form.rent) || 0,
      deposit: Number(form.deposit) || 0,
      bedrooms: Number(form.bedrooms) || 1,
      bathrooms: Number(form.bathrooms) || 1,
      area_sqft: Number(form.area_sqft) || 0,
      available: property?.available ?? true,
      dealer_id: profile?.id || '1',
    };
    try {
      if (property) {
        await updateProperty(property.id, payload);
      } else {
        await createProperty(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-semibold text-slate-900">{property ? 'Edit Property' : 'Add Property'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Title">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="2BHK apartment with city view" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} min-h-[80px] resize-y`} placeholder="Verbal info / details about the property" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Address">
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} placeholder="123 Main St" />
            </Field>
            <Field label="City">
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} placeholder="Springfield" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly Rent ($)">
              <input type="number" min="0" required value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} className={inputCls} placeholder="1500" />
            </Field>
            <Field label="Deposit ($)">
              <input type="number" min="0" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} className={inputCls} placeholder="3000" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Bedrooms">
              <input type="number" min="0" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Bathrooms">
              <input type="number" min="0" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Area (sqft)">
              <input type="number" min="0" value={form.area_sqft} onChange={(e) => setForm({ ...form, area_sqft: e.target.value })} className={inputCls} placeholder="1200" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Property Type">
              <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} className={inputCls}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </Field>
            <Field label="Video URL">
              <input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className={inputCls} placeholder="https://..." />
            </Field>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {property ? 'Save Changes' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm text-slate-900 placeholder-slate-400';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
