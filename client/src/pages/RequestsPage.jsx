import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Check,
  X,
  CheckCircle,
  Clock,
  Loader2,
  ArrowRight,
  Package,
  Calendar,
  Phone,
  User,
  ExternalLink,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import AcceptRequestModal from '../components/common/AcceptRequestModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const RequestsPage = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Accept Modal State
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const endpoint = role === 'seller' ? '/requests/received' : '/requests/my';
      const res = await api.get(endpoint);
      if (res.data?.requests) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [role]);

  const handleOpenAcceptModal = (req) => {
    setSelectedRequest(req);
    setAcceptModalOpen(true);
  };

  const handleRejectRequest = async (requestId) => {
    const reason = window.prompt('Optional reason for rejecting this request:');
    if (reason === null) return; // user cancelled prompt

    try {
      setRejectingId(requestId);
      const res = await api.patch(`/requests/${requestId}/reject`, {
        sellerNote: reason || 'Declined by seller',
      });
      showToast('Request declined.', 'info');
      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? { ...r, status: 'rejected', sellerNote: reason } : r))
      );
    } catch (err) {
      showToast(err.message || 'Failed to reject request', 'error');
    } finally {
      setRejectingId(null);
    }
  };

  const handleRequestAccepted = (newOrder, updatedRequest) => {
    setRequests((prev) =>
      prev.map((r) =>
        r._id === updatedRequest._id
          ? { ...r, status: 'accepted', orderId: newOrder._id }
          : r
      )
    );
  };

  const filteredRequests =
    statusFilter === 'all'
      ? requests
      : requests.filter((r) => r.status.toLowerCase() === statusFilter.toLowerCase());

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
            Communication Center
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {role === 'seller' ? 'Incoming Buyer Requests' : 'My Purchase Enquiries'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {role === 'seller'
              ? 'Review inquiries from buyers, schedule pickups, and confirm orders.'
              : 'Track the status and seller responses to your material purchase requests.'}
          </p>
        </div>

        <Link
          to={role === 'seller' ? '/seller/orders' : '/orders'}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all self-start sm:self-auto"
        >
          <Package className="w-4 h-4" />
          <span>{role === 'seller' ? 'View Orders' : 'My Orders'}</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { label: 'All Requests', value: 'all', count: requests.length },
          {
            label: 'Pending',
            value: 'pending',
            count: requests.filter((r) => r.status === 'pending').length,
          },
          {
            label: 'Accepted',
            value: 'accepted',
            count: requests.filter((r) => r.status === 'accepted').length,
          },
          {
            label: 'Declined',
            value: 'rejected',
            count: requests.filter((r) => r.status === 'rejected').length,
          },
          {
            label: 'Completed',
            value: 'completed',
            count: requests.filter((r) => r.status === 'completed').length,
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

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  {req.materialId?.images?.[0]?.url ? (
                    <img
                      src={req.materialId.images[0].url}
                      alt={req.materialId?.name || 'Material'}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <Inbox className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    {req.materialId?._id ? (
                      <Link
                        to={`/materials/${req.materialId._id}`}
                        className="text-base font-bold text-slate-900 hover:text-amber-600 transition-colors line-clamp-1"
                      >
                        {req.materialId?.name}
                      </Link>
                    ) : (
                      <span className="text-base font-bold text-slate-500 italic">
                        Material Listing
                      </span>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">
                      Requested on{' '}
                      {new Date(req.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      Requested Quantity:{' '}
                      <span className="text-amber-600 font-bold">
                        {req.quantity} {req.materialId?.unit || 'units'}
                      </span>{' '}
                      (Total ₹
                      {(req.quantity * (req.materialId?.price || 0)).toLocaleString('en-IN')})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start">
                  <StatusBadge type="request" value={req.status} />
                </div>
              </div>

              {/* Contact & Message */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    {role === 'seller' ? 'Buyer Information' : 'Seller Information'}
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {role === 'seller'
                      ? req.buyerId?.name || 'Interested Buyer'
                      : req.sellerId?.name || 'Material Seller'}
                  </p>
                  <p className="text-xs text-slate-600">
                    Phone: {role === 'seller' ? req.contactPhone : req.sellerId?.phone}
                  </p>
                  <p className="text-xs text-slate-500">
                    Location: {role === 'seller' ? req.buyerId?.city : req.sellerId?.city}
                  </p>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Buyer Message
                  </p>
                  <p className="text-xs text-slate-700 italic whitespace-pre-line bg-white p-3 rounded-xl border border-slate-200/60">
                    "{req.message}"
                  </p>
                  {req.sellerNote && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                      <span className="font-bold">Seller Note / Schedule: </span>
                      <span>{req.sellerNote}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Seller action controls */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {role === 'seller' && req.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleOpenAcceptModal(req)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Request</span>
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req._id)}
                      disabled={rejectingId === req._id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                      {rejectingId === req._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      <span>Decline</span>
                    </button>
                  </>
                )}

                {req.status === 'accepted' && (
                  <Link
                    to={role === 'seller' ? '/seller/orders' : '/orders'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                    <span>View Order & Pickup Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No requests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter !== 'all'
              ? `No requests matching status '${statusFilter}'.`
              : role === 'seller'
              ? 'When buyers send purchase requests for your listed materials, they will appear here.'
              : 'Browse our marketplace to find materials and send purchase requests to sellers.'}
          </p>
          {role !== 'seller' && (
            <Link
              to="/materials"
              className="mt-3 inline-block px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-amber-600 shadow-sm"
            >
              Browse Materials
            </Link>
          )}
        </div>
      )}

      {/* Accept Request Modal */}
      {selectedRequest && (
        <AcceptRequestModal
          request={selectedRequest}
          isOpen={acceptModalOpen}
          onClose={() => setAcceptModalOpen(false)}
          onAccepted={handleRequestAccepted}
        />
      )}
    </div>
  );
};

export default RequestsPage;
