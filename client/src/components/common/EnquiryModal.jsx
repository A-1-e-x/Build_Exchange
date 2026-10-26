import React, { useState } from 'react';
import { X, Send, Calculator, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const EnquiryModal = ({ material, isOpen, onClose, onRequestSent }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(
    `I would like to purchase these ${material?.name ? material.name.toLowerCase() : 'materials'}.`
  );
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !material) return null;

  const requestedQty = Number(quantity);
  const isOverQuantity = requestedQty > material.quantity;
  const estimatedTotal = (requestedQty > 0 ? requestedQty : 0) * (material.price || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!requestedQty || requestedQty <= 0) {
      setError('Please enter a valid requested quantity.');
      return;
    }

    // Exact required validation message
    if (requestedQty > material.quantity) {
      setError(`Only ${material.quantity} units are currently available.`);
      return;
    }

    if (!message.trim()) {
      setError('Please provide a message for the seller.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/requests', {
        materialId: material._id,
        quantity: requestedQty,
        message: message.trim(),
        contactPhone: contactPhone.trim() || user?.phone || '',
        contactEmail: contactEmail.trim() || user?.email || '',
      });

      showToast('Purchase request sent to seller successfully!', 'success');
      if (onRequestSent) {
        onRequestSent(res.data.request);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit purchase request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Purchase Request</h3>
            <p className="text-xs text-amber-100 truncate max-w-xs sm:max-w-sm">
              Seller: {material.sellerId?.name || 'Verified Seller'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Specifications Table Card (Section 2) */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Material Name
              </span>
              <span className="font-extrabold text-slate-900 truncate block">
                {material.name}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Available Quantity
              </span>
              <span className="font-extrabold text-amber-700 block">
                {material.quantity} {material.unit}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Price per Unit
              </span>
              <span className="font-extrabold text-slate-900 block">
                ₹{material.price.toLocaleString('en-IN')} / {material.unit}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Estimated Total
              </span>
              <span className="font-extrabold text-emerald-600 block">
                ₹{estimatedTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error / Validation Warning */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isOverQuantity && !error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Only {material.quantity} units are currently available.</span>
            </div>
          )}

          {/* Requested Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Requested Quantity ({material.unit}) *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                if (Number(e.target.value) > material.quantity) {
                  setError(`Only ${material.quantity} units are currently available.`);
                } else {
                  setError('');
                }
              }}
              required
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                isOverQuantity
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                  : 'border-slate-300 focus:ring-amber-500'
              }`}
              placeholder={`Enter quantity up to ${material.quantity}`}
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Available in stock: <strong className="text-slate-800">{material.quantity} {material.unit}</strong>
            </span>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Message to Seller *
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder="I would like to purchase these bricks."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-800 resize-none"
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Your Phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="10-digit number"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Your Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || isOverQuantity || requestedQty <= 0}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-md shadow-amber-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Purchase Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnquiryModal;
