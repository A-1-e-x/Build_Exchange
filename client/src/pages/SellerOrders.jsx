import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit,
  MessageSquare,
  Check,
  XCircle,
  Eye,
  User,
  Phone,
  ChevronRight,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import OrderCompletionModal from '../components/common/OrderCompletionModal';
import UpdatePickupModal from '../components/common/UpdatePickupModal';
import OrderChatModal from '../components/common/OrderChatModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const SellerOrders = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [completionOrder, setCompletionOrder] = useState(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);

  const [pickupOrder, setPickupOrder] = useState(null);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);

  const [chatOrder, setChatOrder] = useState(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchSellerOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/seller');
      if (res.data?.orders) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch seller orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const handleMarkReady = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const res = await api.patch(`/orders/${orderId}/ready`);
      showToast('Order marked as Ready for Pickup!', 'success');
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? res.data.order : o))
      );
    } catch (err) {
      showToast(err.message || 'Failed to update order.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt('Please enter a cancellation reason:');
    if (reason === null) return; // user cancelled prompt

    try {
      setActionLoadingId(orderId);
      const res = await api.patch(`/orders/${orderId}/cancel`, {
        reason: reason || 'Cancelled by seller',
      });
      showToast('Order cancelled successfully', 'info');
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? res.data.order : o))
      );
    } catch (err) {
      showToast(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOrderCompleted = (updatedOrder, updatedMaterial) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
    );
  };

  const handlePickupUpdated = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
    );
  };

  const filteredOrders =
    statusFilter === 'all'
      ? orders
      : orders.filter((o) => o.status.toLowerCase() === statusFilter.toLowerCase());

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
            Seller Management
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Seller Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage buyer orders, update pickup times, mark items ready, and complete collections.
          </p>
        </div>

        <Link
          to="/requests"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all self-start sm:self-auto"
        >
          <span>Incoming Requests</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { label: 'All Orders', value: 'all', count: orders.length },
          {
            label: 'Pickup Scheduled',
            value: 'pickup scheduled',
            count: orders.filter((o) => o.status === 'Pickup Scheduled').length,
          },
          {
            label: 'Ready for Pickup',
            value: 'ready for pickup',
            count: orders.filter((o) => o.status === 'Ready for Pickup').length,
          },
          {
            label: 'Completed',
            value: 'completed',
            count: orders.filter((o) => o.status === 'Completed').length,
          },
          {
            label: 'Cancelled',
            value: 'cancelled',
            count: orders.filter((o) => o.status === 'Cancelled').length,
          },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === tab.value
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === tab.value ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const material = order.materialId || {};
            const buyer = order.buyerId || {};
            const orderCode = `ORD-${order._id.slice(-6).toUpperCase()}`;

            return (
              <div
                key={order._id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Top header */}
                <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      Order #{orderCode}
                    </span>
                    <span className="text-xs text-slate-400">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge type="order" value={order.status} />
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Material Info & Pricing */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-start gap-4">
                      {material.images?.[0]?.url ? (
                        <img
                          src={material.images[0].url}
                          alt={material.name}
                          className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
                          <Package className="w-8 h-8" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Purchased Material
                        </span>
                        <h3 className="text-base font-bold text-slate-900">
                          {material._id ? (
                            <Link
                              to={`/materials/${material._id}`}
                              className="hover:text-amber-600 transition-colors"
                            >
                              {material.name}
                            </Link>
                          ) : (
                            <span>{material.name || 'Material Item'}</span>
                          )}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                          <p>
                            <span className="text-slate-400 font-medium">Quantity: </span>
                            <strong className="text-slate-900">
                              {order.quantity} {material.unit || 'pieces'}
                            </strong>
                          </p>
                          <p>
                            <span className="text-slate-400 font-medium">Unit Price: </span>
                            <strong className="text-slate-900">
                              ₹{order.unitPrice} / {material.unit || 'piece'}
                            </strong>
                          </p>
                          <p>
                            <span className="text-slate-400 font-medium">Total: </span>
                            <strong className="text-emerald-700 font-extrabold text-sm">
                              ₹{order.totalPrice?.toLocaleString('en-IN')}
                            </strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Buyer Information Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-600" />
                          <span>Buyer: {buyer.name || 'Interested Buyer'}</span>
                        </span>
                        <p className="text-slate-500">
                          {buyer.email} {buyer.phone ? `• Phone: ${buyer.phone}` : ''}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setChatOrder(order);
                          setChatModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                        <span>Message Buyer</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Pickup Schedule & Actions */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4 text-xs">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                          Pickup Information
                        </span>
                        {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              setPickupOrder(order);
                              setPickupModalOpen(true);
                            }}
                            className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>{order.pickupDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>
                            {order.pickupStartTime} – {order.pickupEndTime}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-slate-700 pt-1">
                          <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-900">{order.pickupAddress}</p>
                            <p className="text-slate-500">
                              {order.pickupCity}
                              {order.pickupDistrict ? `, ${order.pickupDistrict}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons (Section 14) */}
                    <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-2">
                      {order.status === 'Pickup Scheduled' && (
                        <button
                          onClick={() => handleMarkReady(order._id)}
                          disabled={actionLoadingId === order._id}
                          className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {actionLoadingId === order._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Mark Ready for Pickup</span>
                        </button>
                      )}

                      {order.status === 'Ready for Pickup' && (
                        <button
                          onClick={() => {
                            setCompletionOrder(order);
                            setCompletionModalOpen(true);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      )}

                      {order.status === 'Completed' && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold text-xs flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Completed on {new Date(order.completedAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      )}

                      {['Pickup Scheduled', 'Ready for Pickup'].includes(order.status) && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={actionLoadingId === order._id}
                          className="py-1.5 px-3 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1 self-center"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter !== 'all'
              ? `No seller orders matching status '${statusFilter}'.`
              : 'When you accept buyer purchase requests, active orders will appear here for pickup scheduling and completion.'}
          </p>
          <Link
            to="/requests"
            className="mt-3 inline-block px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 shadow-sm"
          >
            Check Buyer Requests
          </Link>
        </div>
      )}

      {/* Completion Modal */}
      {completionOrder && (
        <OrderCompletionModal
          order={completionOrder}
          isOpen={completionModalOpen}
          onClose={() => setCompletionModalOpen(false)}
          onCompleted={handleOrderCompleted}
        />
      )}

      {/* Pickup Update Modal */}
      {pickupOrder && (
        <UpdatePickupModal
          order={pickupOrder}
          isOpen={pickupModalOpen}
          onClose={() => setPickupModalOpen(false)}
          onUpdated={handlePickupUpdated}
        />
      )}

      {/* Chat modal */}
      {chatOrder && (
        <OrderChatModal
          order={chatOrder}
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SellerOrders;
