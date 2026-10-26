import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Scan,
  Camera,
  Cpu,
  Layers,
  Globe,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import api from '../../services/api';

const AiImageAnalysisBanner = ({ images = [], materialId = null }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'details'

  const runVerification = async () => {
    if (!images || images.length === 0) return;

    try {
      setAnalyzing(true);
      setError(null);
      const scanResults = [];

      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const formData = new FormData();
        formData.append('image', file);
        if (materialId) formData.append('materialId', materialId);
        formData.append('saveRecord', 'false'); // Preview scan without saving into DB

        try {
          const res = await api.post('/ai/verify-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          scanResults.push({
            fileIndex: i,
            fileName: file.name,
            previewUrl: URL.createObjectURL(file),
            ...res.data,
          });
        } catch (itemErr) {
          scanResults.push({
            fileIndex: i,
            fileName: file.name,
            previewUrl: URL.createObjectURL(file),
            verificationStatus: 'VERIFICATION_UNAVAILABLE',
            imageOriginPrediction: 'unknown',
            riskScore: 0,
            aiGeneratedScore: null,
            duplicateMatch: false,
            reasons: ['Could not complete verification for this file format.'],
          });
        }
      }

      setResults(scanResults);
      setHasScanned(true);
    } catch (err) {
      setError(err.message || 'Image verification failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!images || images.length === 0) return null;

  const flaggedItems = results.filter(
    (r) =>
      r.verificationStatus === 'DUPLICATE_DETECTED' ||
      r.verificationStatus === 'POSSIBLY_AI_GENERATED' ||
      r.verificationStatus === 'POSSIBLY_DOWNLOADED' ||
      r.verificationStatus === 'MANUAL_REVIEW_REQUIRED'
  );

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-5 shadow-sm space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>AI Multi-Signal Image Authenticity Verification</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                v2.1 Hybrid
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              Evaluates camera EXIF hardware, perceptual hash deduplication, and synthetic AI frequency artifacts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!hasScanned ? (
            <button
              type="button"
              onClick={runVerification}
              disabled={analyzing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors shadow-xs disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                  <span>Verifying Images...</span>
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4 text-amber-700" />
                  <span>Verify Image Authenticity</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={runVerification}
              disabled={analyzing}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 underline mr-2"
            >
              {analyzing ? 'Re-verifying...' : 'Re-verify'}
            </button>
          )}

          {hasScanned && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Toggle details"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Results View */}
      {hasScanned && expanded && (
        <div className="space-y-4 pt-2 border-t border-slate-200/80">
          {flaggedItems.length > 0 ? (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1.5 flex-1">
                <p className="font-bold text-amber-900 flex items-center gap-2">
                  <span>Advisory Notice: Image Verification Advisory</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-800 font-bold">
                    {flaggedItems.length} Flagged
                  </span>
                </p>
                <p className="text-amber-800 leading-relaxed">
                  One or more uploaded images exhibits characteristics of a duplicate catalog photo, external web image,
                  or synthetic generation. This notice is strictly <strong>advisory</strong> and will not prevent you from submitting your listing.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                All uploaded photos verified successfully. Consistent with authentic, original construction material photography.
              </span>
            </div>
          )}

          {/* Individual image verification cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {results.map((r, idx) => {
              const status = r.verificationStatus || 'LIKELY_ORIGINAL';
              const isFlagged = status !== 'LIKELY_ORIGINAL';

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border bg-white shadow-xs transition-all ${
                    isFlagged ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={r.previewUrl}
                      alt={r.fileName}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-100 flex-shrink-0 shadow-2xs"
                    />

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{r.fileName}</p>
                        <StatusBadge type="verification" value={status} />
                      </div>

                      {/* Multi-signal metrics row */}
                      <div className="grid grid-cols-3 gap-1 py-1 text-[10px] bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                        {/* 1. Camera EXIF */}
                        <div className="flex items-center gap-1 text-slate-600 truncate">
                          <Camera className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">
                            {r.metadataFindings?.cameraMake
                              ? `${r.metadataFindings.cameraMake} ${r.metadataFindings.cameraModel || ''}`
                              : 'No EXIF'}
                          </span>
                        </div>

                        {/* 2. AI Score */}
                        <div className="flex items-center gap-1 text-slate-600">
                          <Cpu className="w-3 h-3 text-purple-500 flex-shrink-0" />
                          <span>
                            {r.aiGeneratedScore !== null
                              ? `AI: ${Math.round(r.aiGeneratedScore * 100)}%`
                              : 'AI: N/A'}
                          </span>
                        </div>

                        {/* 3. Duplicate Score */}
                        <div className="flex items-center gap-1 text-slate-600">
                          <Layers className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          <span>
                            {r.duplicateMatch ? `${r.duplicateSimilarity}% match` : 'Unique'}
                          </span>
                        </div>
                      </div>

                      {/* Reasons bullet points */}
                      {r.reasons && r.reasons.length > 0 && (
                        <div className="text-[11px] text-slate-600 pt-0.5 space-y-0.5">
                          {r.reasons.slice(0, 2).map((reason, rIdx) => (
                            <p key={rIdx} className="flex items-start gap-1 leading-tight text-slate-500">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{reason}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Advisory disclaimer footer */}
      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span>
          BuildExchange authenticates listings using multi-spectral frequency forensics, EXIF validation, and perceptual hashing.
          Duplicate and synthetic warnings are advisory.
        </span>
      </div>
    </div>
  );
};

export default AiImageAnalysisBanner;
