import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle,
  Clock,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Check,
  X,
  Inbox,
  AlertCircle,
  Loader2,
  DollarSign,
  TrendingUp,
  Truck,
  MessageSquare,
  Receipt,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import OrderCompletionModal from '../components/common/OrderCompletionModal';
import UpdatePickupModal from '../components/common/UpdatePickupModal';
import AcceptRequestModal from '../components/common/AcceptRequestModal';
import OrderChatModal from '../components/common/OrderChatModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const SellerDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [materials, setMaterials] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'requests' | 'orders' | 'ready' | 'completed'
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [acceptRequestModalOpen, setAcceptRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [selectedCompletionOrder, setSelectedCompletionOrder] = useState(null);

  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [selectedPickupOrder, setSelectedPickupOrder] = useState(null);

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatOrder, setSelectedChatOrder] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [matRes, reqRes, orderRes] = await Promise.all([
        api.get('/materials/my'),
        api.get('/requests/received'),
        api.get('/orders/seller'),
      ]);

      if (matRes.data?.materials) setMaterials(matRes.data.materials);
      if (reqRes.data?.requests) setRequests(reqRes.data.requests);
      if (orderRes.data?.orders) setOrders(orderRes.data.orders);
    } catch (err) {
      showToast(err.message || 'Failed to load seller dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Summary Metrics (Section 20: Active Listings, Pending Requests, Accepted Orders, Completed Orders)
  const activeListings = materials.filter((m) => m.status === 'available').length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const acceptedOrders = orders.filter((o) =>
    ['Accepted', 'Pickup Scheduled', 'Ready for Pickup'].includes(o.status)
  ).length;
  const completedOrders = orders.filter((o) => o.status === 'Completed').length;
  const readyOrders = orders.filter((o) => o.status === 'Ready for Pickup');

  const handleToggleStatus = async (materialId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'available' ? 'sold' : 'available';
      await api.patch(`/materials/${materialId}/status`, { status: nextStatus });
      showToast(`Listing marked as ${nextStatus}!`, 'success');
      setMaterials((prev) =>
        prev.map((m) => (m._id === materialId ? { ...m, status: nextStatus } : m))
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const confirmDeleteMaterial = (materialId) => {
    setSelectedMaterialId(materialId);
    setDeleteModalOpen(true);
  };

  const handleDeleteMaterial = async () => {
    if (!selectedMaterialId) return;
    try {
      setActionLoading(true);
      await api.delete(`/materials/${selectedMaterialId}`);
      showToast('Listing deleted successfully', 'info');
      setMaterials((prev) => prev.filter((m) => m._id !== selectedMaterialId));
      setDeleteModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      const res = await api.patch(`/orders/${orderId}/ready`);
      showToast('Order marked as Ready for Pickup!', 'success');
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? res.data.order : o))
      );
    } catch (err) {
      showToast(err.message || 'Failed to update order status.', 'error');
    }
  };

  const handleRequestAccepted = (newOrder, updatedRequest) => {
    setRequests((prev) =>
      prev.map((r) => (r._id === updatedRequest._id ? updatedRequest : r))
    );
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleOrderCompleted = (updatedOrder, updatedMaterial) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
    );
    if (updatedMaterial) {
      setMaterials((prev) =>
        prev.map((m) =>
          m._id === updatedMaterial._id
            ? { ...m, quantity: updatedMaterial.quantity, status: updatedMaterial.status }
            : m
        )
      );
    }
  };

  const handlePickupUpdated = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
    );
  };

  const filteredMaterials =
    statusFilter === 'all'
      ? materials
      : materials.filter((m) => m.status === statusFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
            Seller Management
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Seller Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your material listings, buyer enquiries, scheduled pickups, and settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/transactions"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Transactions</span>
          </Link>
          <Link
            to="/sell"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Material</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards (Section 20: Active Listings, Pending Requests, Accepted Orders, Completed Orders) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Listings"
          value={activeListings}
          icon={Package}
          color="amber"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          icon={Clock}
          color="rose"
        />
        <StatCard
          title="Accepted Orders"
          value={acceptedOrders}
          icon={Truck}
          color="blue"
        />
        <StatCard
          title="Completed Orders"
          value={completedOrders}
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex flex-wrap gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-4 relative transition-colors flex items-center gap-2 ${
              activeTab === 'listings'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Listings ({materials.length})</span>
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
            <span>Incoming Requests ({requests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 relative transition-colors flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Accepted Orders ({acceptedOrders})</span>
          </button>

          <button
            onClick={() => setActiveTab('ready')}
            className={`pb-4 relative transition-colors flex items-center gap-2 ${
              activeTab === 'ready'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-600" />
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
            <span>Completed Orders ({completedOrders})</span>
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
          {/* TAB 1: LISTINGS */}
          {activeTab === 'listings' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                {['all', 'available', 'sold'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      statusFilter === st
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st === 'sold' ? 'Sold Out' : st}
                  </button>
                ))}
              </div>

              {filteredMaterials.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No listings found</h3>
                  <p className="text-xs text-slate-500">
                    Post your surplus construction materials to begin receiving purchase requests.
                  </p>
                  <Link
                    to="/sell"
                    className="mt-3 inline-block px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 shadow-sm"
                  >
                    Post Material
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="py-4 px-5">Material</th>
                          <th className="py-4 px-5">Category</th>
                          <th className="py-4 px-5">Price</th>
                          <th className="py-4 px-5">Available Stock</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredMaterials.map((mat) => (
                          <tr key={mat._id} className="hover:bg-amber-50/20 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                {mat.images?.[0]?.url ? (
                                  <img
                                    src={mat.images[0].url}
                                    alt={mat.name}
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                                <div>
                                  <Link
                                    to={`/materials/${mat._id}`}
                                    className="font-bold text-slate-900 hover:text-amber-600 transition-colors"
                                  >
                                    {mat.name}
                                  </Link>
                                  <span className="text-[10px] text-slate-400 block">
                                    {mat.city}, {mat.state}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-5 font-medium text-slate-700">
                              {mat.category}
                            </td>

                            <td className="py-4 px-5 font-bold text-slate-900">
                              ₹{mat.price.toLocaleString('en-IN')} / {mat.unit}
                            </td>

                            <td className="py-4 px-5">
                              <span className="font-extrabold text-slate-800">
                                {mat.quantity} {mat.unit}
                              </span>
                            </td>

                            <td className="py-4 px-5">
                              <StatusBadge type="availability" value={mat.status} />
                            </td>

                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  to={`/materials/${mat._id}/edit`}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                  title="Edit Material"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Link>

                                <button
                                  onClick={() => handleToggleStatus(mat._id, mat.status)}
                                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border transition-colors ${
                                    mat.status === 'available'
                                      ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                      : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                  }`}
                                >
                                  {mat.status === 'available' ? 'Mark Sold' : 'Make Available'}
                                </button>

                                <button
                                  onClick={() => confirmDeleteMaterial(mat._id)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete Listing"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INCOMING REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
                  <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No incoming requests</h3>
                  <p className="text-xs text-slate-500">
                    When buyers submit purchase requests for your items, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((req) => (
                    <div
                      key={req._id}
                      className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <StatusBadge type="request" value={req.status} />
                          <span className="text-xs text-slate-400">
                            {new Date(req.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900">
                          {req.buyerId?.name || 'Buyer'} requested {req.quantity} {req.materialId?.unit} of{' '}
                          {req.materialId?.name || 'Material'}
                        </h4>

                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                          "{req.message}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        {req.status === 'pending' ? (
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setAcceptRequestModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept & Schedule Pickup</span>
                          </button>
                        ) : (
                          <Link
                            to="/seller/orders"
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1"
                          >
                            <span>Manage in Orders</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3, 4, 5: ORDERS (Active / Ready / Completed) */}
          {['orders', 'ready', 'completed'].includes(activeTab) && (
            <div className="space-y-4">
              {(() => {
                let displayOrders = orders.filter((o) =>
                  ['Accepted', 'Pickup Scheduled', 'Ready for Pickup'].includes(o.status)
                );
                if (activeTab === 'ready') displayOrders = readyOrders;
                if (activeTab === 'completed') displayOrders = orders.filter((o) => o.status === 'Completed');

                if (displayOrders.length === 0) {
                  return (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
                      <Truck className="w-12 h-12 text-slate-300 mx-auto" />
                      <h3 className="text-base font-bold text-slate-800">
                        {activeTab === 'ready'
                          ? 'No orders marked ready for pickup'
                          : activeTab === 'completed'
                          ? 'No completed orders yet'
                          : 'No active orders'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Accept buyer requests to schedule pickups and process orders.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {displayOrders.map((order) => {
                      const material = order.materialId || {};
                      const buyer = order.buyerId || {};

                      return (
                        <div
                          key={order._id}
                          className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:border-amber-300 transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-500">
                                #ORD-{order._id.slice(-6).toUpperCase()}
                              </span>
                              <StatusBadge type="order" value={order.status} />
                            </div>

                            <h3 className="text-base font-bold text-slate-900">
                              {material.name} • {order.quantity} {material.unit}
                            </h3>

                            <p className="text-xs text-slate-600">
                              Buyer: <strong className="text-slate-900">{buyer.name}</strong> • Total: <strong className="text-emerald-700">₹{order.totalPrice?.toLocaleString('en-IN')}</strong>
                            </p>

                            <p className="text-xs text-amber-900 font-semibold pt-1 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              <span>
                                Pickup: {order.pickupDate} ({order.pickupStartTime} – {order.pickupEndTime})
                              </span>
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                            <button
                              onClick={() => {
                                setSelectedChatOrder(order);
                                setChatModalOpen(true);
                              }}
                              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                              <span>Message</span>
                            </button>

                            {order.status === 'Pickup Scheduled' && (
                              <button
                                onClick={() => handleMarkReady(order._id)}
                                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark Ready</span>
                              </button>
                            )}

                            {order.status === 'Ready for Pickup' && (
                              <button
                                onClick={() => {
                                  setSelectedCompletionOrder(order);
                                  setCompletionModalOpen(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Mark Completed</span>
                              </button>
                            )}

                            {order.status !== 'Completed' && (
                              <button
                                onClick={() => {
                                  setSelectedPickupOrder(order);
                                  setPickupModalOpen(true);
                                }}
                                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                              >
                                Edit Pickup
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteMaterial}
        title="Delete Material Listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        confirmText="Delete Listing"
        confirmVariant="danger"
        loading={actionLoading}
      />

      {/* Accept Request Modal */}
      {selectedRequest && (
        <AcceptRequestModal
          request={selectedRequest}
          isOpen={acceptRequestModalOpen}
          onClose={() => setAcceptRequestModalOpen(false)}
          onAccepted={handleRequestAccepted}
        />
      )}

      {/* Completion Modal */}
      {selectedCompletionOrder && (
        <OrderCompletionModal
          order={selectedCompletionOrder}
          isOpen={completionModalOpen}
          onClose={() => setCompletionModalOpen(false)}
          onCompleted={handleOrderCompleted}
        />
      )}

      {/* Update Pickup Modal */}
      {selectedPickupOrder && (
        <UpdatePickupModal
          order={selectedPickupOrder}
          isOpen={pickupModalOpen}
          onClose={() => setPickupModalOpen(false)}
          onUpdated={handlePickupUpdated}
        />
      )}

      {/* Chat modal */}
      {selectedChatOrder && (
        <OrderChatModal
          order={selectedChatOrder}
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SellerDashboard;
