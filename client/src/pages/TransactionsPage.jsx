import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  Package,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Loader2,
  User,
  ArrowUpRight,
  TrendingUp,
  Download,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const TransactionsPage = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/transactions');
      if (res.data?.transactions) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch transaction history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const totalValue = transactions.reduce((acc, t) => acc + (t.totalPrice || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Audit & Accounting
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Transaction History</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Permanent ledger of completed material collections and settlements.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Total Volume
            </span>
            <span className="text-base font-black text-emerald-900">
              ₹{totalValue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      ) : transactions.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-5">Transaction ID</th>
                  <th className="py-4 px-5">Material</th>
                  <th className="py-4 px-5">{role === 'seller' ? 'Buyer' : 'Seller'}</th>
                  <th className="py-4 px-5">Quantity</th>
                  <th className="py-4 px-5">Unit Price</th>
                  <th className="py-4 px-5">Total Price</th>
                  <th className="py-4 px-5">Pickup Date</th>
                  <th className="py-4 px-5">Completion Date</th>
                  <th className="py-4 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const material = tx.materialId || {};
                  const buyer = tx.buyerId || {};
                  const seller = tx.sellerId || {};
                  const txCode = `TXN-${tx._id.slice(-6).toUpperCase()}`;

                  return (
                    <tr
                      key={tx._id}
                      className="hover:bg-amber-50/30 transition-colors font-medium text-slate-800"
                    >
                      {/* Transaction ID */}
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                          #{txCode}
                        </span>
                      </td>

                      {/* Material */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          {material.images?.[0]?.url ? (
                            <img
                              src={material.images[0].url}
                              alt={material.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 line-clamp-1">
                              {material.name || 'Material Item'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {material.category || 'Construction'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Buyer / Seller */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">
                            {role === 'seller' ? buyer.name : seller.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {role === 'seller' ? buyer.city : seller.city}
                          </span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-5 font-bold text-slate-900">
                        {tx.quantity} {material.unit || 'units'}
                      </td>

                      {/* Unit Price */}
                      <td className="py-4 px-5 text-slate-600">
                        ₹{tx.unitPrice?.toLocaleString('en-IN')}
                      </td>

                      {/* Total Price */}
                      <td className="py-4 px-5 font-black text-emerald-600 text-sm">
                        ₹{tx.totalPrice?.toLocaleString('en-IN')}
                      </td>

                      {/* Pickup Date */}
                      <td className="py-4 px-5 text-slate-600">
                        {tx.pickupDate || '—'}
                      </td>

                      {/* Completion Date */}
                      <td className="py-4 px-5 text-slate-600">
                        {tx.completedAt
                          ? new Date(tx.completedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <StatusBadge type="order" value="Completed" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No completed transactions yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once materials are collected by buyers and orders are marked as completed by sellers,
            permanent transaction receipts will be archived here.
          </p>
          <Link
            to="/materials"
            className="mt-3 inline-block px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 shadow-sm"
          >
            Browse Marketplace
          </Link>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
