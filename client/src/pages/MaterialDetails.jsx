import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Eye,
  Heart,
  Send,
  ShieldCheck,
  Package,
  Layers,
  Phone,
  User,
  CheckCircle2,
  Edit,
  ArrowLeft,
  Share2,
  AlertCircle,
  Truck,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import EnquiryModal from '../components/common/EnquiryModal';
import MaterialCard from '../components/common/MaterialCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const MaterialDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, role } = useAuth();
  const { showToast } = useToast();

  const [material, setMaterial] = useState(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [relatedMaterials, setRelatedMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setLoading(true);
        setSelectedImageIdx(0);

        const res = await api.get(`/materials/${id}`);
        if (res.data?.material) {
          setMaterial(res.data.material);

          // Fetch related materials in the same category
          try {
            const relRes = await api.get(
              `/materials?category=${encodeURIComponent(res.data.material.category)}&limit=4`
            );
            if (relRes.data?.materials) {
              setRelatedMaterials(
                relRes.data.materials.filter((m) => m._id !== res.data.material._id)
              );
            }
          } catch (e) {
            console.warn('Failed to load related materials', e);
          }
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  // Check if currently favorited
  useEffect(() => {
    const checkFav = async () => {
      if (isAuthenticated && id) {
        try {
          const res = await api.get(`/favorites/check/${id}`);
          if (res.data) {
            setIsFavorited(Boolean(res.data.isFavorite));
          }
        } catch (e) {
          // ignore error
        }
      }
    };
    checkFav();
  }, [id, isAuthenticated]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showToast('Please log in to save materials to your favorites.', 'info');
      navigate('/login', { state: { from: { pathname: `/materials/${id}` } } });
      return;
    }

    try {
      if (isFavorited) {
        await api.delete(`/favorites/${id}`);
        setIsFavorited(false);
        showToast('Removed from favorites', 'info');
      } else {
        await api.post(`/favorites/${id}`);
        setIsFavorited(true);
        showToast('Saved to your favorites!', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleEnquiryClick = () => {
    if (!isAuthenticated) {
      showToast('Please log in to send enquiries to sellers.', 'info');
      navigate('/login', { state: { from: { pathname: `/materials/${id}` } } });
      return;
    }
    setEnquiryModalOpen(true);
  };

  const isOwner =
    isAuthenticated &&
    material?.sellerId &&
    (user?._id === material.sellerId._id || user?._id === material.sellerId);

  const isSoldOut =
    (material?.quantity ?? 0) <= 0 || String(material?.status).toLowerCase() === 'sold';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-[4/3] rounded-3xl bg-slate-200 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded-xl bg-slate-200 animate-pulse" />
            <div className="h-5 w-1/2 rounded-xl bg-slate-200 animate-pulse" />
            <div className="h-32 rounded-xl bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Listing Not Found</h2>
        <p className="text-sm text-slate-500">
          This material listing may have been sold, removed, or is no longer available.
        </p>
        <Link
          to="/materials"
          className="inline-block px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-amber-600"
        >
          Browse All Materials
        </Link>
      </div>
    );
  }

  const DEFAULT_MATERIAL_IMG =
    'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80';

  const activeImage =
    material.images?.[selectedImageIdx]?.url ||
    material.images?.[0]?.url ||
    DEFAULT_MATERIAL_IMG;

  const formattedDate = material.createdAt
    ? new Date(material.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/materials"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </Link>

        {isOwner && (
          <Link
            to={`/materials/${material._id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm"
          >
            <Edit className="w-3.5 h-3.5 text-amber-600" />
            <span>Edit Listing</span>
          </Link>
        )}
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Image Gallery Carousel */}
        <div className="space-y-4">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-md">
            <img
              src={activeImage}
              alt={material.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_MATERIAL_IMG;
              }}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {material.status === 'sold' && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="px-6 py-2 rounded-2xl bg-rose-600 text-white font-extrabold text-lg uppercase tracking-wider shadow-xl">
                  Sold Out
                </span>
              </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/95 text-slate-900 backdrop-blur-md shadow-sm">
                {material.category}
              </span>
              <StatusBadge type="condition" value={material.condition} />
            </div>
          </div>

          {/* Thumbnails */}
          {material.images?.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {material.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                    selectedImageIdx === idx
                      ? 'border-amber-600 scale-105 shadow-md'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_MATERIAL_IMG;
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Specifications & Actions */}
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Listed {formattedDate}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{material.views || 0} views</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {material.name}
            </h1>
          </div>

          {/* Price & Stock Card */}
          <div className="p-6 rounded-3xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-amber-800 block">
                Price per Unit
              </span>
              <div className="text-3xl font-black text-amber-600 mt-0.5">
                ₹{material.price.toLocaleString('en-IN')}
                <span className="text-sm font-medium text-slate-500"> / {material.unit}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500 block">
                Available Stock
              </span>
              <span
                className={`text-lg font-extrabold ${
                  isSoldOut ? 'text-rose-600' : 'text-slate-800'
                }`}
              >
                {isSoldOut ? `0 ${material.unit}` : `${material.quantity} ${material.unit}`}
              </span>
              {isSoldOut && (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                  SOLD OUT
                </span>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!isSoldOut ? (
              <button
                onClick={handleEnquiryClick}
                disabled={isOwner}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{isOwner ? 'Your Material Listing' : 'Send Purchase Request'}</span>
              </button>
            ) : (
              <div className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-slate-400 bg-slate-100 border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed">
                <span>Sold Out • Unavailable</span>
              </div>
            )}

            {role !== 'seller' && (
              <button
                onClick={handleToggleFavorite}
                className={`py-3.5 px-6 rounded-2xl font-bold border transition-all flex items-center justify-center gap-2 ${
                  isFavorited
                    ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current text-rose-600' : ''}`} />
                <span>{isFavorited ? 'Saved' : 'Save'}</span>
              </button>
            )}
          </div>

          {/* Material Description */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Material Description
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {material.description}
            </p>
          </div>

          {/* Location Details */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Site & Collection Location
            </h3>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-900">{material.address}</p>
                <p className="text-slate-500">
                  {material.city}, {material.district}, {material.state} - {material.pincode}
                </p>
              </div>
            </div>
          </div>

          {/* Safe Seller Info Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {material.sellerId?.profileImage ? (
                <img
                  src={material.sellerId.profileImage}
                  alt={material.sellerId?.name}
                  className="w-12 h-12 rounded-full object-cover border border-amber-300"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-base">
                  {material.sellerId?.name ? material.sellerId.name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Listed By Seller
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {material.sellerId?.name || 'Verified Construction Seller'}
                </p>
                <p className="text-xs text-slate-500">
                  Location: {material.sellerId?.city || material.city}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Seller</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Materials Section */}
      {relatedMaterials.length > 0 && (
        <div className="pt-12 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              More in {material.category}
            </h2>
            <Link
              to={`/materials?category=${encodeURIComponent(material.category)}`}
              className="text-sm font-bold text-amber-600 hover:text-amber-700"
            >
              See all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedMaterials.map((m) => (
              <MaterialCard key={m._id} material={m} />
            ))}
          </div>
        </div>
      )}

      {/* Enquiry Modal */}
      <EnquiryModal
        material={material}
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
      />
    </div>
  );
};

export default MaterialDetails;
