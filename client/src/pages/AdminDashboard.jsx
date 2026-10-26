import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  Inbox,
  ShieldCheck,
  CheckCircle,
  Clock,
  TrendingUp,
  FolderTree,
  UserCheck,
  ArrowRight,
  Loader2,
  HardHat,
  BarChart3,
  Layers,
  Sparkles,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/stats');
        if (res.data?.stats) {
          setStats(res.data.stats);
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center">
        <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
      </div>
    );
  }

  const {
    users = {},
    materials = {},
    requests = {},
    categoryBreakdown = [],
    conditionBreakdown = [],
    recentActivity = {},
    ai = {},
  } = stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header & Admin Nav Quick Links */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">
            System Administration
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Admin Master Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor platform activity, manage registered users, approve material listings, and categories.
          </p>
        </div>

        {/* Quick Management Links */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/ai-monitoring"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Image Monitoring</span>
            {(ai.pendingReview || 0) > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
            )}
          </Link>
          <Link
            to="/admin/users"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Manage Users</span>
          </Link>
          <Link
            to="/admin/materials"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5 text-amber-600" />
            <span>Manage Materials</span>
          </Link>
          <Link
            to="/admin/categories"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm flex items-center gap-1.5"
          >
            <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
            <span>Categories</span>
          </Link>
        </div>
      </div>

      {/* AI Duplicate Detection Highlight Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-600/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">AI Image Duplicate Monitoring</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                pHash DCT-64
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {ai.pendingReview || 0} flagged images awaiting review • {ai.likelyDuplicates || 0} likely duplicates detected • {ai.total || 0} total photos indexed
            </p>
          </div>
        </div>
        <Link
          to="/admin/ai-monitoring"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <span>Open AI Monitoring</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Primary KPI Metrics (Section 13) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={users.total || 0}
          subtitle={`${users.buyers || 0} Buyers • ${users.sellers || 0} Sellers`}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Total Listings"
          value={materials.total || 0}
          subtitle={`${materials.active || 0} Active • ${materials.sold || 0} Sold`}
          icon={Package}
          color="amber"
        />
        <StatCard
          title="Total Inquiries"
          value={requests.total || 0}
          subtitle={`${requests.completed || 0} Closed Deals`}
          icon={Inbox}
          color="blue"
        />
        <StatCard
          title="Pending Approvals"
          value={materials.pendingApproval || 0}
          subtitle="Listings awaiting review"
          icon={Clock}
          color={materials.pendingApproval > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Distribution Breakdown Chart/Bars */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-lg">
                Material Listings by Category
              </h3>
            </div>
            <Link
              to="/admin/categories"
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              Configure
            </Link>
          </div>

          <div className="space-y-4">
            {categoryBreakdown.map((item, idx) => {
              const maxCount = Math.max(...categoryBreakdown.map((c) => c.count), 1);
              const percentage = Math.round((item.count / (materials.total || 1)) * 100);

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{item.category}</span>
                    <span className="text-slate-500">
                      {item.count} items ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                      style={{ width: `${Math.max((item.count / maxCount) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Condition Distribution Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-lg">
                Condition Quality Distribution
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {materials.total || 0} Total Listings
            </span>
          </div>

          <div className="space-y-4">
            {conditionBreakdown.map((item, idx) => {
              const percentage = Math.round((item.count / (materials.total || 1)) * 100);
              const colorClasses = {
                New: 'from-emerald-500 to-emerald-600',
                'Like New': 'from-cyan-500 to-cyan-600',
                Good: 'from-blue-500 to-blue-600',
                Used: 'from-amber-500 to-amber-600',
                Damaged: 'from-rose-500 to-rose-600',
              }[item.condition] || 'from-slate-500 to-slate-600';

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <StatusBadge type="condition" value={item.condition} />
                    <span className="text-slate-600 font-bold">
                      {item.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${colorClasses} transition-all duration-500`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Registered Users */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base">
              Recently Registered Users
            </h3>
            <Link
              to="/admin/users"
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivity.users?.map((u) => (
              <div key={u._id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">
                    {u.city || 'India'}
                  </span>
                  <StatusBadge type="role" value={u.role} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Material Listings */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base">
              Recently Posted Materials
            </h3>
            <Link
              to="/admin/materials"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivity.materials?.map((m) => (
              <div key={m._id} className="py-3 flex items-center justify-between">
                <div>
                  <Link
                    to={`/materials/${m._id}`}
                    className="text-sm font-bold text-slate-900 hover:text-amber-600 transition-colors line-clamp-1"
                  >
                    {m.name}
                  </Link>
                  <p className="text-xs text-slate-400">
                    By {m.sellerId?.name || 'Seller'} • {m.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-600">₹{m.price}</p>
                  <StatusBadge type="condition" value={m.condition} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
