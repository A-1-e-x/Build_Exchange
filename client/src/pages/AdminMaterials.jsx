import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const AdminMaterials = () => {
  const { showToast } = useToast();

  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data?.categories) setCategories(res.data.categories);
      } catch (e) {
        // ignore
      }
    };
    fetchCats();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (approvalFilter !== 'all') params.append('approval', approvalFilter);
      params.append('page', page);
      params.append('limit', 10);

      const res = await api.get(`/admin/materials?${params.toString()}`);
      if (res.data) {
        setMaterials(res.data.materials || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [search, categoryFilter, statusFilter, approvalFilter, page]);

  const handleToggleApproval = async (material) => {
    try {
      const nextApproved = !material.isApproved;
      const res = await api.patch(`/admin/materials/${material._id}/approve`, {
        isApproved: nextApproved,
      });
      showToast(res.data.message, 'success');
      setMaterials((prev) =>
        prev.map((m) => (m._id === material._id ? { ...m, isApproved: nextApproved } : m))
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const confirmDelete = (material) => {
    setMaterialToDelete(material);
    setDeleteModalOpen(true);
  };

  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return;
    try {
      setActionLoading(true);
      await api.delete(`/admin/materials/${materialToDelete._id}`);
      showToast('Material listing removed successfully.', 'info');
      setMaterials((prev) => prev.filter((m) => m._id !== materialToDelete._id));
      setDeleteModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Material Listings Moderation
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Review marketplace listings, verify compliance, approve or remove inappropriate posts.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Listings: <span className="text-amber-600 font-extrabold text-sm">{total}</span>
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search material or location..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Approval:</span>
            <select
              value={approvalFilter}
              onChange={(e) => {
                setApprovalFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="sold">Sold Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      ) : materials.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Material</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Seller</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Approval</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map((mat) => (
                  <tr key={mat._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            mat.images?.[0]?.url ||
                            'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={mat.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80';
                          }}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <Link
                            to={`/materials/${mat._id}`}
                            className="font-bold text-slate-900 hover:text-amber-600 transition-colors line-clamp-1"
                          >
                            {mat.name}
                          </Link>
                          <span className="text-xs text-slate-400">
                            {mat.city}, {mat.state} • {mat.quantity} {mat.unit}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {mat.category}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <p className="font-semibold text-slate-900">
                        {mat.sellerId?.name || 'Seller'}
                      </p>
                      <p className="text-slate-400">{mat.sellerId?.email}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-600">
                      ₹{mat.price.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleApproval(mat)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                          mat.isApproved
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                        title="Click to toggle approval"
                      >
                        {mat.isApproved ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Approved</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Rejected</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge type="availability" value={mat.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/materials/${mat._id}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => confirmDelete(mat)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700">No material listings found</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Inappropriate Listing"
        message={`Are you sure you want to permanently delete '${materialToDelete?.name}' from the platform?`}
        confirmText="Delete Listing"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleDeleteMaterial}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default AdminMaterials;
