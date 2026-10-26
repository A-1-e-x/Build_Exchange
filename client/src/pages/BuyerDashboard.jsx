import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle,
  Heart,
  Search,
  ExternalLink,
  Loader2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Inbox,
  Receipt,
  MessageSquare,
  AlertCircle,
  Truck,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import MaterialCard from '../components/common/MaterialCard';
import OrderChatModal from '../components/common/OrderChatModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'ready' | 'completed' | 'requests' | 'favorites'
  const [loading, setLoading] = useState(true);

  // Chat modal state
  const [chatOrder, setChatOrder] = useState(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [orderRes, reqRes, favRes] = await Promise.all([
        api.get('/orders/my'),
        api.get('/requests/my'),
        api.get('/favorites'),
      ]);

      if (orderRes.data?.orders) {
        setOrders(orderRes.data.orders);
      }
      if (reqRes.data?.requests) {
        setRequests(reqRes.data.requests);
      }
      if (favRes.data?.favorites) {
        setFavorites(favRes.data.favorites);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Summary Metrics (Section 19)
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => ['Pending', 'Pickup Scheduled'].includes(o.status)).length;
  const readyOrders = orders.filter((o) => o.status === 'Ready for Pickup');
  const completedOrders = orders.filter((o) => o.status === 'Completed');
  const totalFavorites = favorites.length;

  const handleFavoriteToggle = (materialId, nowFavorited) => {
    if (!nowFavorited) {
      setFavorites((prev) => prev.filter((f) => f.materialId?._id !== materialId));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
            Buyer Portal
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Buyer Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track your purchases, collection readiness, pickup timings, and saved listings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/transactions"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Transaction History</span>
          </Link>
          <Link
            to="/materials"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Browse Materials</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards (Section 19: Total Orders, Pending, Ready for Pickup, Completed) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={Package}
          color="amber"
        />
        <StatCard
          title="Pending / Scheduled"
          value={pendingOrders}
          icon={Clock}
          color="rose"
        />
        <StatCard
          title="Ready for Pickup"
          value={readyOrders.length}
          icon={Truck}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={completedOrders.length}
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* Ready for Pickup Alert Banner if any orders are waiting for collection */}
      {readyOrders.length > 0 && (
        <div className="p-4 rounded-3xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-900">
                You have {readyOrders.length} order{readyOrders.length > 1 ? 's' : ''} Ready for Pickup!
              </h4>
              <p className="text-xs text-blue-700 mt-0.5">
                The seller has prepared the materials for your collection. Please check pickup timings and site address.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('ready')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            View Ready Orders
          </button>
        </div>
      )}

      {/* Tabs Control */}
      <div className="border-b border-slate-200">
        <div className="flex flex-wrap gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 relative transition-colors flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ready')}
            className={`pb-4 relative transition-colors flex items-center gap-2 ${
              activeTab === 'ready'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Ready for Pickup ({readyOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-4 relative transition-colors flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Completed Orders ({completedOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-4 relative transition-colors flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>My Requests ({requests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-4 relative transition-colors flex items-center gap-2 ${
              activeTab === 'favorites'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Saved Materials ({favorites.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      ) : (
        <div>
          {/* ORDERS TAB (My Orders / Ready / Completed) */}
          {['orders', 'ready', 'completed'].includes(activeTab) && (
            <div className="space-y-4">
              {(() => {
                let displayOrders = orders;
                if (activeTab === 'ready') displayOrders = readyOrders;
                if (activeTab === 'completed') displayOrders = completedOrders;

                if (displayOrders.length === 0) {
                  return (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
                      <Package className="w-12 h-12 text-slate-300 mx-auto" />
                      <h3 className="text-base font-bold text-slate-800">
                        {activeTab === 'ready'
                          ? 'No orders are currently waiting for pickup'
                          : activeTab === 'completed'
                          ? 'No completed orders yet'
                          : 'No orders placed yet'}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Browse listings and submit purchase requests to order surplus construction materials.
                      </p>
                      <Link
                        to="/materials"
                        className="mt-3 inline-block px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 shadow-sm"
                      >
                        Browse Materials
                      </Link>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {displayOrders.map((order) => {
                      const material = order.materialId || {};
                      const seller = order.sellerId || {};
                      const orderCode = `ORD-${order._id.slice(-6).toUpperCase()}`;

                      return (
                        <div
                          key={order._id}
                          className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-amber-300 transition-all"
                        >
                          <div className="flex items-start gap-4">
                            {material.images?.[0]?.url ? (
                              <img
                                src={material.images[0].url}
                                alt={material.name}
                                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
                                <Package className="w-7 h-7" />
                              </div>
                            )}

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-500">
                                  #{orderCode}
                                </span>
                                <StatusBadge type="order" value={order.status} />
                              </div>

                              <h3 className="text-base font-bold text-slate-900">
                                {material.name || 'Construction Material'}
                              </h3>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                                <span>
                                  Quantity: <strong>{order.quantity} {material.unit}</strong>
                                </span>
                                <span>
                                  Total: <strong className="text-emerald-700">₹{order.totalPrice?.toLocaleString('en-IN')}</strong>
                                </span>
                                <span>Seller: {seller.name}</span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-amber-900 pt-1 font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                <span>
                                  Pickup: {order.pickupDate} ({order.pickupStartTime} – {order.pickupEndTime})
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end md:self-center">
                            <button
                              onClick={() => {
                                setChatOrder(order);
                                setChatModalOpen(true);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                              <span>Chat</span>
                            </button>

                            <Link
                              to="/orders"
                              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1"
                            >
                              <span>View Order Details</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
                  <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No requests sent yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When you enquire about listed materials, track your seller responses here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((req) => (
                    <div
                      key={req._id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <StatusBadge type="request" value={req.status} />
                          <span className="text-xs text-slate-400">
                            {new Date(req.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {req.materialId?.name || 'Material Item'}
                        </h4>
                        <p className="text-xs text-slate-600">
                          Requested: <strong>{req.quantity} {req.materialId?.unit}</strong> • Seller: {req.sellerId?.name}
                        </p>
                        {req.sellerNote && (
                          <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100 mt-1">
                            Note: {req.sellerNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status === 'accepted' ? (
                          <Link
                            to="/orders"
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-1"
                          >
                            <span>Scheduled Order</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <Link
                            to="/requests"
                            className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
                          >
                            View Details
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FAVORITES TAB */}
          {activeTab === 'favorites' && (
            <div>
              {favorites.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No saved materials</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click the heart icon on any material card to save items to your wishlist.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((fav) => (
                    <MaterialCard
                      key={fav._id}
                      material={fav.materialId}
                      isFavorited={true}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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

export default BuyerDashboard;
