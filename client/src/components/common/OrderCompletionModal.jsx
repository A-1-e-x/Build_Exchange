import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const OrderCompletionModal = ({ order, isOpen, onClose, onCompleted }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const material = order.materialId || {};
  const currentAvailable = material.quantity ?? 0;
  const orderQuantity = order.quantity || 0;
  const unit = material.unit || 'units';
  const remainingStock = Math.max(0, currentAvailable - orderQuantity);
  const isInsufficient = currentAvailable < orderQuantity;

  const handleConfirm = async () => {
    setError('');
    if (isInsufficient) {
      setError(
        `Insufficient quantity available. Current stock: ${currentAvailable} ${unit}, requested: ${orderQuantity} ${unit}.`
      );
      return;
    }

    try {
      setLoading(true);
      const res = await api.patch(`/orders/${order._id}/complete`);
      showToast(res.data.message || 'Order completed and quantity deducted successfully!', 'success');
      if (onCompleted) {
        onCompleted(res.data.order, res.data.material);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to complete order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Confirm Product Collection</h3>
            <p className="text-xs text-blue-100">
              Finalize transaction & deduct stock
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Details (Section 25) */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Material:</span>
              <span className="font-extrabold text-slate-900">{material.name || 'Bricks'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Order Quantity:</span>
              <span className="font-extrabold text-amber-700">
                {orderQuantity} {unit}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Current Available:</span>
              <span className="font-bold text-slate-700">
                {currentAvailable} {unit}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Remaining After Completion:</span>
              <span className={`font-extrabold ${remainingStock === 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {remainingStock} {unit} {remainingStock === 0 ? '(Listing will be SOLD OUT)' : ''}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Has the buyer collected the product? Marking this completed will permanently deduct{' '}
              <strong>{orderQuantity} {unit}</strong> from your available inventory.
            </p>
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
              type="button"
              onClick={handleConfirm}
              disabled={loading || isInsufficient}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deducting Stock...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Completion</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCompletionModal;
