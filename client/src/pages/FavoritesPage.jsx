import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, Loader2, ArrowRight } from 'lucide-react';
import MaterialCard from '../components/common/MaterialCard';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/favorites');
      if (res.data?.favorites) {
        setFavorites(res.data.favorites);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleFavoriteToggle = (materialId, nowFavorited) => {
    if (!nowFavorited) {
      setFavorites((prev) => prev.filter((f) => f.materialId?._id !== materialId));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block mb-1">
          Saved Collection
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Your Favorite Materials ({favorites.length})
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Quickly access construction materials you have bookmarked for upcoming projects.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map((fav) => (
            <MaterialCard
              key={fav._id}
              material={fav.materialId}
              isFavorited={true}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            No favorite materials saved yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tap the heart icon on any material card across the marketplace to save it here for later reference.
          </p>
          <Link
            to="/materials"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Browse Materials</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
