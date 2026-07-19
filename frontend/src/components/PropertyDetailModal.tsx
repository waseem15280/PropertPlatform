import { X, Bed, Bath, Maximize, MapPin, Video, Bookmark, BookmarkCheck, Calendar, Building } from 'lucide-react';
import type { Property } from '../lib/api';
import { Badge } from './ui';

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartment',
  house: 'House',
  villa: 'Villa',
  studio: 'Studio',
  commercial: 'Commercial',
  plot: 'Plot',
};

export default function PropertyDetailModal({
  property,
  saved,
  onToggleSave,
  onClose,
}: {
  property: Property;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header media */}
        <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200">
          {property.video_url ? (
            <a
              href={property.video_url}
              target="_blank"
              rel="noreferrer"
              className="absolute inset-0 flex items-center justify-center group"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Video className="w-7 h-7 text-emerald-600" />
              </div>
            </a>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              No video provided
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md hover:bg-white transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge tone="neutral">{TYPE_LABELS[property.property_type] || property.property_type}</Badge>
            {property.available ? <Badge tone="green">Available</Badge> : <Badge tone="red">Unavailable</Badge>}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{property.title}</h2>
              <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                <MapPin className="w-4 h-4" />
                {property.address}{property.address && property.city ? ', ' : ''}{property.city}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-slate-900">${property.rent.toLocaleString()}</div>
              <div className="text-xs text-slate-400">per month</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            <Stat icon={<Bed className="w-4 h-4" />} label="Bedrooms" value={property.bedrooms} />
            <Stat icon={<Bath className="w-4 h-4" />} label="Bathrooms" value={property.bathrooms} />
            <Stat icon={<Maximize className="w-4 h-4" />} label="Area" value={property.area_sqft ? `${property.area_sqft.toLocaleString()} sqft` : '—'} />
            <Stat icon={<Building className="w-4 h-4" />} label="Deposit" value={`$${property.deposit.toLocaleString()}`} />
          </div>

          {/* Description */}
          {property.description && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>
          )}

          {/* Video link */}
          {property.video_url && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Property Video</h3>
              <a
                href={property.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
              >
                <Video className="w-4 h-4" />
                Watch property video
              </a>
            </div>
          )}

          {/* Brokerage note */}
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <span className="font-medium">Visit charge</span> applies for physical property tours.
                Brokerage equal to <span className="font-medium">1 month rent</span> (${property.rent.toLocaleString()}) is due on deal finalization.
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={onToggleSave}
            className={`mt-6 w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              saved
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20'
            }`}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {saved ? 'Saved to inbox' : 'Save to inbox'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <div className="flex justify-center text-slate-400 mb-1">{icon}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
