import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Heart, ArrowUpRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const DEFAULT_MATERIAL_IMG =
  'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80';

const MaterialCard = ({ material, isFavorited = false, onFavoriteToggle }) => {
  if (!material) return null;

  const { isAuthenticated, role } = useAuth();
  const { showToast } = useToast();
  const [favorite, setFavorite] = useState(isFavorited);
  const [loadingFav, setLoadingFav] = useState(false);

  const mainImage =
    material?.images && material.images.length > 0
      ? material.images[0].url
      : DEFAULT_MATERIAL_IMG;

  const isSoldOut =
    material.quantity <= 0 || String(material.status).toLowerCase() === 'sold';

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please log in as a buyer to save favorite materials.', 'info');
      return;
    }

    try {
      setLoadingFav(true);
      if (favorite) {
        await api.delete(`/favorites/${material._id}`);
        setFavorite(false);
        showToast('Removed from favorites', 'info');
      } else {
        await api.post(`/favorites/${material._id}`);
        setFavorite(true);
        showToast('Saved to your favorites!', 'success');
      }
      if (onFavoriteToggle) {
        onFavoriteToggle(material._id, !favorite);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingFav(false);
    }
  };

  const formattedDate = material?.createdAt
    ? new Date(material.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={mainImage}
          alt={material.name || 'Construction Material'}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_MATERIAL_IMG;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center z-10">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm">
            {material.category}
          </span>
          <StatusBadge type="condition" value={material.condition} />
        </div>

        {/* Favorite Heart Button */}
        {role !== 'seller' && (
          <button
            onClick={handleFavoriteClick}
            disabled={loadingFav}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-md transition-all z-10 ${
              favorite
                ? 'bg-rose-500 text-white hover:bg-rose-600 scale-105'
                : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Sold overlay badge (Section 9 & 23) */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 z-10">
            <span className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-extrabold text-sm tracking-wider uppercase shadow-lg">
              SOLD OUT
            </span>
            <span className="text-[11px] font-semibold text-rose-100">
              0 {material.unit} remaining
            </span>
          </div>
        )}
      </div>

      {/* Content details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location & Date */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1 font-medium truncate max-w-[65%]">
              <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="truncate">{material.city}, {material.district || material.state}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formattedDate}</span>
            </span>
          </div>

          {/* Title */}
          <Link to={`/materials/${material._id}`}>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2 mb-2 leading-snug">
              {material.name}
            </h3>
          </Link>

          {/* Available Quantity Display (Section 23) */}
          <div className="text-xs mb-3 flex items-center justify-between">
            <span className="text-slate-500">Available:</span>
            <span className={`font-extrabold ${isSoldOut ? 'text-rose-600' : 'text-slate-800'}`}>
              {isSoldOut ? `0 ${material.unit}` : `${material.quantity} ${material.unit}`}
            </span>
          </div>
        </div>

        {/* Footer / Price & CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
              Price
            </span>
            <span className="text-base font-extrabold text-amber-600">
              ₹{material.price.toLocaleString('en-IN')}
              <span className="text-xs font-medium text-slate-500"> / {material.unit}</span>
            </span>
          </div>

          <Link
            to={`/materials/${material._id}`}
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
              isSoldOut
                ? 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                : 'text-slate-700 bg-slate-100 group-hover:bg-amber-600 group-hover:text-white'
            }`}
          >
            <span>{isSoldOut ? 'Unavailable' : 'Details'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MaterialCard;
