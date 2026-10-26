import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const AcceptRequestModal = ({ request, isOpen, onClose, onAccepted }) => {
  const { showToast } = useToast();

  if (!isOpen || !request) return null;

  const material = request.materialId || {};
  const buyer = request.buyerId || {};
  const requestedQty = request.quantity || 1;
  const unitPrice = material.price || 0;
  const totalPrice = requestedQty * unitPrice;
  const unit = material.unit || 'units';

  // Default pickup date: tomorrow or in 2 days
  const defaultDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  const [pickupAddress, setPickupAddress] = useState(material.address || '');
  const [pickupCity, setPickupCity] = useState(material.city || '');
  const [pickupDistrict, setPickupDistrict] = useState(material.district || '');
  const [pickupPincode, setPickupPincode] = useState(material.pincode || '');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [pickupDate, setPickupDate] = useState(defaultDate);
  const [pickupStartTime, setPickupStartTime] = useState('10:00 AM');
  const [pickupEndTime, setPickupEndTime] = useState('01:00 PM');
  const [sellerMessage, setSellerMessage] = useState(
    `Your request has been accepted. Please collect the materials from our construction site between ${pickupStartTime || '10 AM'} and ${pickupEndTime || '1 PM'}.`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!pickupAddress.trim() || !pickupCity.trim() || !pickupDate || !pickupStartTime || !pickupEndTime) {
      setError('Please provide all mandatory pickup schedule details.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.patch(`/requests/${request._id}/accept`, {
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

      showToast('Request accepted and pickup scheduled!', 'success');
      if (onAccepted) {
        onAccepted(res.data.order, res.data.request);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to accept request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Accept Purchase Request</h3>
            <p className="text-xs text-emerald-100">
              Set collection schedule and message for buyer
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 5 Display Specs Card */}
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Buyer
              </span>
              <span className="font-extrabold text-slate-900 truncate block text-sm">
                {buyer.name || 'Interested Buyer'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Material
              </span>
              <span className="font-extrabold text-slate-900 truncate block text-sm">
                {material.name || 'Material'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Requested Quantity
              </span>
              <span className="font-extrabold text-amber-600 block text-sm">
                {requestedQty} {unit}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Available Quantity
              </span>
              <span className="font-extrabold text-slate-700 block text-sm">
                {material.quantity} {unit}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Price
              </span>
              <span className="font-extrabold text-slate-900 block text-sm">
                ₹{unitPrice.toLocaleString('en-IN')} per {unit}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total
              </span>
              <span className="font-extrabold text-emerald-600 block text-sm">
                ₹{totalPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Schedule & Message Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Pickup Information</span>
            </h4>

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
                  placeholder="Site name, plot or street"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  placeholder="e.g. Alappuzha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pickup District
                </label>
                <input
                  type="text"
                  value={pickupDistrict}
                  onChange={(e) => setPickupDistrict(e.target.value)}
                  placeholder="e.g. Alappuzha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pickup Pincode
                </label>
                <input
                  type="text"
                  value={pickupPincode}
                  onChange={(e) => setPickupPincode(e.target.value)}
                  placeholder="6-digit pincode"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  placeholder="e.g. Near Metro Station / Ring Road"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Pickup Date & Timing</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pickup Date *
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pickup Start Time *
                </label>
                <input
                  type="text"
                  value={pickupStartTime}
                  onChange={(e) => setPickupStartTime(e.target.value)}
                  required
                  placeholder="10:00 AM"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pickup End Time *
                </label>
                <input
                  type="text"
                  value={pickupEndTime}
                  onChange={(e) => setPickupEndTime(e.target.value)}
                  required
                  placeholder="01:00 PM"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Seller Message *
            </label>
            <textarea
              rows={3}
              value={sellerMessage}
              onChange={(e) => setSellerMessage(e.target.value)}
              placeholder="Your request has been accepted. Please collect the materials..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
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
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Accept & Schedule Pickup</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcceptRequestModal;
