import { Bed, Bath, Maximize, MapPin, Video, Bookmark, BookmarkCheck } from 'lucide-react';
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

export default function PropertyCard({
  property,
  saved,
  onToggleSave,
  onSelect,
}: {
  property: Property;
  saved?: boolean;
  onToggleSave?: () => void;
  onSelect?: () => void;
}) {
  return (
    <div className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 hover:border-slate-300 transition-all">
      {/* Video / media header */}
      <div
        className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 cursor-pointer"
        onClick={onSelect}
      >
        {property.video_url ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Video className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            No video provided
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge tone="neutral">{TYPE_LABELS[property.property_type] || property.property_type}</Badge>
          {!property.available && <Badge tone="red">Unavailable</Badge>}
        </div>
        {onToggleSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-md hover:bg-white transition-colors"
            title={saved ? 'Remove from inbox' : 'Save to inbox'}
          >
            {saved ? (
              <BookmarkCheck className="w-4.5 h-4.5 text-emerald-600" />
            ) : (
              <Bookmark className="w-4.5 h-4.5 text-slate-500" />
            )}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-semibold text-slate-900 leading-snug cursor-pointer hover:text-emerald-700 transition-colors line-clamp-1"
            onClick={onSelect}
          >
            {property.title}
          </h3>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-slate-900">
              ${property.rent.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">/month</div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {property.address}{property.address && property.city ? ', ' : ''}{property.city}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <Bed className="w-4 h-4 text-slate-400" />
            {property.bedrooms} bd
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-4 h-4 text-slate-400" />
            {property.bathrooms} ba
          </span>
          {property.area_sqft > 0 && (
            <span className="flex items-center gap-1">
              <Maximize className="w-4 h-4 text-slate-400" />
              {property.area_sqft.toLocaleString()} sqft
            </span>
          )}
        </div>

        {property.deposit > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Deposit: <span className="font-medium text-slate-700">${property.deposit.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
