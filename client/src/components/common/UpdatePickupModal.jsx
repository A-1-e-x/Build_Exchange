import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Loader2, AlertCircle, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const UpdatePickupModal = ({ order, isOpen, onClose, onUpdated }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const [pickupAddress, setPickupAddress] = useState(order.pickupAddress || '');
  const [pickupCity, setPickupCity] = useState(order.pickupCity || '');
  const [pickupDistrict, setPickupDistrict] = useState(order.pickupDistrict || '');
  const [pickupPincode, setPickupPincode] = useState(order.pickupPincode || '');
  const [pickupLandmark, setPickupLandmark] = useState(order.pickupLandmark || '');
  const [pickupDate, setPickupDate] = useState(order.pickupDate || '');
  const [pickupStartTime, setPickupStartTime] = useState(order.pickupStartTime || '10:00 AM');
  const [pickupEndTime, setPickupEndTime] = useState(order.pickupEndTime || '01:00 PM');
  const [sellerMessage, setSellerMessage] = useState(order.sellerMessage || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!pickupAddress.trim() || !pickupCity.trim() || !pickupDate || !pickupStartTime || !pickupEndTime) {
      setError('Please provide all mandatory pickup details.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.patch(`/orders/${order._id}/pickup`, {
        pickupAddress: pickupAddress.trim(),
        pickupCity: pickupCity.trim(),
        pickupDistrict: pickupDistrict.trim(),
        pickupPincode: pickupPincode.trim(),
        pickupLandmark: pickupLandmark.trim(),
        pickupDate: pickupDate.trim(),
        pickupStartTime: pickupStartTime.trim(),
        pickupEndTime: pickupEndTime.trim(),
        sellerMessage: sellerMessage.trim(),
      });

      showToast('Pickup details updated and buyer notified!', 'success');
      if (onUpdated) {
        onUpdated(res.data.order);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update pickup details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Update Pickup Details</h3>
            <p className="text-xs text-amber-100">
              Buyer will be notified immediately of changes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pickup Address *
              </label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pickup City *
              </label>
              <input
                type="text"
                value={pickupCity}
                onChange={(e) => setPickupCity(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Landmark
              </label>
              <input
                type="text"
                value={pickupLandmark}
                onChange={(e) => setPickupLandmark(e.target.value)}
                placeholder="Near landmark"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pickup Date *
              </label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Start Time *
                </label>
                <input
                  type="text"
                  value={pickupStartTime}
                  onChange={(e) => setPickupStartTime(e.target.value)}
                  placeholder="10:00 AM"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  End Time *
                </label>
                <input
                  type="text"
                  value={pickupEndTime}
                  onChange={(e) => setPickupEndTime(e.target.value)}
                  placeholder="01:00 PM"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Note / Message for Buyer
            </label>
            <textarea
              rows={3}
              value={sellerMessage}
              onChange={(e) => setSellerMessage(e.target.value)}
              placeholder="e.g. Pickup schedule updated. New Date: 16 October 2026, New Time: 11 AM – 2 PM"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Notify Buyer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePickupModal;
