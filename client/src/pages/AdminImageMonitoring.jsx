import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  ArrowRight,
  Layers,
  Database,
  Loader2,
  FileText,
  Info,
  Camera,
  Cpu,
  Globe,
  ShieldCheck,
  Check,
  Hash,
  ExternalLink,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const AdminImageMonitoring = () => {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState(null);
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('not_reviewed');

  // Review Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState('confirmed');
  const [overrideStatus, setOverrideStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [modalTab, setModalTab] = useState('comparison'); // 'comparison' | 'metadata' | 'forensics'

  const fetchStats = async () => {
    try {
      const res = await api.get('/ai/stats');
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.warn('Could not fetch AI stats:', err.message);
    }
  };

  const fetchFlagged = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 8,
        verificationStatus: verificationFilter,
        reviewStatus: statusFilter,
      });

      const res = await api.get(`/ai/flagged?${params.toString()}`);
      if (res.data) {
        setFlaggedItems(res.data.flagged || []);
        setTotalItems(res.data.total || 0);
        setCurrentPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchFlagged(currentPage);
  }, [verificationFilter, statusFilter, currentPage]);

  const handleBatchSync = async () => {
    try {
      setSyncing(true);
      const res = await api.post('/ai/sync');
      showToast(res.data?.message || 'Database images verified successfully!', 'success');
      fetchStats();
      fetchFlagged(1);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const openReviewModal = (item, defaultAction = 'confirmed') => {
    setSelectedItem(item);
    setReviewAction(defaultAction);
    setOverrideStatus(item.verificationStatus || '');
    setReviewNotes(item.reviewNotes || '');
    setModalTab('comparison');
    setModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setSubmittingReview(true);
      const res = await api.patch(`/ai/${selectedItem._id}/review`, {
        reviewStatus: reviewAction,
        reviewNotes,
        overrideStatus: overrideStatus !== selectedItem.verificationStatus ? overrideStatus : undefined,
      });

      showToast(res.data?.message || 'Review status saved.', 'success');
      setModalOpen(false);
      setSelectedItem(null);
      fetchStats();
      fetchFlagged(currentPage);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleQuickStatus = async (item, status) => {
    try {
      const res = await api.patch(`/ai/${item._id}/review`, {
        reviewStatus: status,
        reviewNotes: `Quick action: marked as ${status} from monitoring panel.`,
      });
      showToast(`Flag updated to ${status}.`, 'success');
      fetchStats();
      fetchFlagged(currentPage);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">
              AI Security & Integrity
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Multi-Signal Authenticity Engine v2.1
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-amber-600" />
            <span>AI Image Verification & Monitoring</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Detect camera-original, web-downloaded, synthetic AI-generated, and duplicate construction material photos.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBatchSync}
            disabled={syncing}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            ) : (
              <Database className="w-4 h-4 text-amber-600" />
            )}
            <span>{syncing ? 'Verifying Catalog...' : 'Verify Existing Materials'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchFlagged(currentPage);
            }}
            className="p-2.5 rounded-xl text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-all"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Scans"
          value={stats?.totalAnalyses ?? '...'}
          icon={Layers}
          color="slate"
        />
        <StatCard
          title="Duplicates"
          value={stats?.duplicateCount ?? stats?.likelyDuplicates ?? '...'}
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="AI-Generated"
          value={stats?.aiGeneratedCount ?? 0}
          icon={Cpu}
          color="purple"
        />
        <StatCard
          title="Web Downloads"
          value={stats?.downloadedCount ?? 0}
          icon={Globe}
          color="amber"
        />
        <StatCard
          title="Pending Review"
          value={stats?.pendingReview ?? '...'}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Confirmed Flags"
          value={stats?.confirmedDuplicates ?? '...'}
          icon={ShieldAlert}
          color="rose"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Verification Signal:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Flags' },
              { id: 'DUPLICATE_DETECTED', label: 'Duplicates' },
              { id: 'POSSIBLY_AI_GENERATED', label: 'AI Generated' },
              { id: 'POSSIBLY_DOWNLOADED', label: 'Web Downloads' },
              { id: 'MANUAL_REVIEW_REQUIRED', label: 'Manual Review' },
              { id: 'LIKELY_ORIGINAL', label: 'Likely Original' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  setVerificationFilter(btn.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  verificationFilter === btn.id
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Review Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Review:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Reviews</option>
            <option value="not_reviewed">Pending Review</option>
            <option value="confirmed">Confirmed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Flagged Images List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
            <p className="text-xs font-medium">Loading image authenticity logs...</p>
          </div>
        ) : flaggedItems.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Flagged Images Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              There are no images matching your current filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3.5">Suspect Image</th>
                  <th className="px-5 py-3.5">Material & Seller</th>
                  <th className="px-5 py-3.5">Verification Status</th>
                  <th className="px-5 py-3.5">Forensic Signals</th>
                  <th className="px-5 py-3.5">Review Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flaggedItems.map((item) => {
                  const status = item.verificationStatus || 'LIKELY_ORIGINAL';
                  return (
                    <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Image Thumbnail */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="relative group cursor-pointer" onClick={() => openReviewModal(item)}>
                          <img
                            src={item.imageUrl}
                            alt="Uploaded material"
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs group-hover:opacity-90"
                          />
                          <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </td>

                      {/* 2. Material & Seller */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="space-y-1">
                          <Link
                            to={item.materialId ? `/materials/${item.materialId._id}` : '#'}
                            className="font-bold text-slate-900 hover:text-amber-600 line-clamp-1 flex items-center gap-1"
                          >
                            <span>{item.materialId?.name || 'Listing in progress'}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span>By:</span>
                            <span className="font-semibold text-slate-700 truncate">
                              {item.sellerId?.name || 'Unknown Seller'}
                            </span>
                          </div>
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {item.materialId?.category || 'Construction'}
                          </span>
                        </div>
                      </td>

                      {/* 3. Verification Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <StatusBadge type="verification" value={status} />
                          {item.riskScore !== undefined && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <span>Risk Score:</span>
                              <span
                                className={`font-bold ${
                                  item.riskScore >= 70
                                    ? 'text-rose-600'
                                    : item.riskScore >= 40
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {item.riskScore}/100
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Forensic Signals Summary */}
                      <td className="px-5 py-4 max-w-sm">
                        <div className="space-y-1 text-[11px] text-slate-600">
                          {/* Camera EXIF */}
                          <div className="flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">
                              {item.metadataFindings?.cameraMake
                                ? `${item.metadataFindings.cameraMake} ${item.metadataFindings.cameraModel || ''}`
                                : 'EXIF Stripped / Web Image'}
                            </span>
                          </div>

                          {/* AI Score */}
                          {item.aiGeneratedScore !== null && item.aiGeneratedScore !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                              <span>AI Score: <strong>{Math.round(item.aiGeneratedScore * 100)}%</strong></span>
                            </div>
                          )}

                          {/* Duplicate Similarity */}
                          {item.closestMatch && (
                            <div className="flex items-center gap-1.5 text-amber-700">
                              <Layers className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span>
                                {item.similarityScore}% match with #{item.closestMatch.materialName}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Review Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge type="aiReview" value={item.reviewStatus} />
                      </td>

                      {/* 6. Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openReviewModal(item)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            Inspect
                          </button>

                          {item.reviewStatus === 'not_reviewed' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleQuickStatus(item, 'confirmed')}
                                title="Confirm Flag"
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickStatus(item, 'dismissed')}
                                title="Dismiss Flag (Authentic)"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {currentPage} of {totalPages} ({totalItems} total flagged records)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Side-by-Side Review & Inspection Modal */}
      {modalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Image Authenticity & Forensic Audit
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review side-by-side evidence, EXIF metadata, and synthetic probability before deciding.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-4 text-xs font-bold text-slate-600 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setModalTab('comparison')}
                className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  modalTab === 'comparison'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Visual Comparison</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('metadata')}
                className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  modalTab === 'metadata'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>EXIF & Camera Hardware</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('forensics')}
                className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  modalTab === 'forensics'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>AI Forensics & Spectral</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* TAB 1: Visual Comparison */}
              {modalTab === 'comparison' && (
                <div className="space-y-6">
                  {/* Side-by-Side Images Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Suspect Photo */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Suspect Uploaded Image</span>
                        </span>
                        <StatusBadge type="verification" value={selectedItem.verificationStatus} />
                      </div>
                      <div className="aspect-4/3 rounded-2xl overflow-hidden border-2 border-rose-200 bg-slate-100 flex items-center justify-center shadow-xs">
                        <img
                          src={selectedItem.imageUrl}
                          alt="Suspect uploaded"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p><strong>Listing:</strong> {selectedItem.materialId?.name || 'New Listing'}</p>
                        <p><strong>Seller:</strong> {selectedItem.sellerId?.name || 'Unknown'}</p>
                        <p className="font-mono text-[10px] text-slate-400 truncate">
                          SHA-256: {selectedItem.exactFileHash || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Right: Matched Catalog Photo OR Source Match */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Matched Catalog Listing Photo</span>
                        </span>
                        {selectedItem.closestMatch && (
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                            {selectedItem.similarityScore}% Visual Match
                          </span>
                        )}
                      </div>

                      {selectedItem.closestMatch?.imageUrl ? (
                        <>
                          <div className="aspect-4/3 rounded-2xl overflow-hidden border-2 border-amber-200 bg-slate-100 flex items-center justify-center shadow-xs">
                            <img
                              src={selectedItem.closestMatch.imageUrl}
                              alt="Matched catalog"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="text-xs space-y-1 text-slate-600 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                            <p><strong>Matched Material:</strong> {selectedItem.closestMatch.materialName}</p>
                            <p><strong>Hamming Distance:</strong> {selectedItem.hammingDistance}/64 bits</p>
                            <p className="text-[11px] text-amber-800">
                              {selectedItem.closestMatch.isExactByteMatch
                                ? '⚠️ Exact 100% SHA-256 byte match'
                                : 'Visual perceptual hash match (pHash DCT-64)'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="aspect-4/3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                          <CheckCircle2 className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-600">No Internal Catalog Match</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            This flag was triggered by synthetic AI frequency analysis or stripped metadata.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reasons List */}
                  {selectedItem.reasons && selectedItem.reasons.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Detection Evidence & Rationale
                      </h4>
                      <div className="space-y-1 text-xs text-slate-600">
                        {selectedItem.reasons.map((r, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EXIF & Camera Hardware */}
              {modalTab === 'metadata' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Camera Make</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {selectedItem.metadataFindings?.cameraMake || 'Not Present'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Camera Model</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {selectedItem.metadataFindings?.cameraModel || 'Not Present'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Date Captured</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                        {selectedItem.metadataFindings?.dateTimeOriginal
                          ? new Date(selectedItem.metadataFindings.dateTimeOriginal).toLocaleString()
                          : 'Not Present'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Dimensions</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {selectedItem.metadataFindings?.dimensions || 'Unknown'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Software / Processing</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                        {selectedItem.metadataFindings?.software || 'None'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">C2PA Credentials</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {selectedItem.provenanceFindings?.c2paManifestFound ? 'Verified C2PA Box' : 'No C2PA Manifest'}
                      </p>
                    </div>
                  </div>

                  {selectedItem.metadataFindings?.warnings?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                      <p className="font-bold">Metadata Warnings:</p>
                      {selectedItem.metadataFindings.warnings.map((w, idx) => (
                        <p key={idx} className="flex items-center gap-1.5">• {w}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: AI Forensics & Spectral Breakdown */}
              {modalTab === 'forensics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <span className="text-xs font-bold uppercase text-slate-400 block">
                        Synthetic / Generative Probability
                      </span>
                      <div className="text-2xl font-black text-slate-900">
                        {selectedItem.aiGeneratedScore !== null
                          ? `${Math.round(selectedItem.aiGeneratedScore * 100)}%`
                          : 'N/A'}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Calibrated forensic score combining Error Level Analysis (ELA) and 2D Discrete Fourier Transform power spectrum.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <span className="text-xs font-bold uppercase text-slate-400 block">
                        Perceptual Hash Fingerprint
                      </span>
                      <div className="font-mono text-sm font-bold text-amber-700 break-all">
                        {selectedItem.imageHash || 'N/A'}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Zauner 2D-DCT 64-bit fingerprint robust against JPEG recompression and scaling.
                      </p>
                    </div>
                  </div>

                  <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 text-xs text-purple-900 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-purple-600" />
                      <span>Model Architecture: {selectedItem.modelName || 'MultiSignal-Forensics-v2.1'}</span>
                    </p>
                    <p className="leading-relaxed text-purple-800">
                      Forensic detector checks for frequency grid spikes characteristic of generative diffusion decoders
                      (Frank et al., ICML 2020) and unnatural micro-texture smoothing.
                    </p>
                  </div>
                </div>
              )}

              {/* Review Decision Form */}
              <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Administrator Audit Decision
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'confirmed', label: 'Confirm Inauthentic / Duplicate', color: 'rose' },
                    { id: 'dismissed', label: 'Dismiss Flag (Authentic Photo)', color: 'emerald' },
                    { id: 'reviewed', label: 'Mark as Reviewed / Inconclusive', color: 'blue' },
                  ].map((act) => (
                    <label
                      key={act.id}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        reviewAction === act.id
                          ? 'border-amber-500 bg-amber-50/50 text-amber-900 ring-2 ring-amber-400'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reviewAction"
                        value={act.id}
                        checked={reviewAction === act.id}
                        onChange={(e) => setReviewAction(e.target.value)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>{act.label}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Audit Notes (Optional):</label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Provide justification or context for this audit decision..."
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Audit Decision</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminImageMonitoring;
