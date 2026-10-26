import React from 'react';

const StatusBadge = ({ type = 'condition', value }) => {
  if (!value) return null;

  let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = value;
  const normalizedValue = String(value).trim().toLowerCase();

  if (type === 'condition') {
    switch (value) {
      case 'New':
        badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'Like New':
        badgeStyles = 'bg-cyan-50 text-cyan-700 border-cyan-200';
        break;
      case 'Good':
        badgeStyles = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'Used':
        badgeStyles = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'Damaged':
        badgeStyles = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      default:
        badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  } else if (type === 'availability') {
    if (normalizedValue === 'available') {
      badgeStyles = 'bg-emerald-500 text-white border-transparent';
      label = 'Available';
    } else {
      badgeStyles = 'bg-slate-600 text-white border-transparent';
      label = 'Sold Out';
    }
  } else if (type === 'request' || type === 'order') {
    switch (normalizedValue) {
      case 'pending':
        badgeStyles = 'bg-amber-50 text-amber-700 border-amber-300';
        label = 'Pending';
        break;
      case 'accepted':
        badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-300';
        label = 'Accepted';
        break;
      case 'pickup scheduled':
        badgeStyles = 'bg-indigo-50 text-indigo-700 border-indigo-300';
        label = 'Pickup Scheduled';
        break;
      case 'ready for pickup':
        badgeStyles = 'bg-blue-50 text-blue-700 border-blue-300 font-bold';
        label = 'Ready for Pickup';
        break;
      case 'completed':
        badgeStyles = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
        label = 'Completed';
        break;
      case 'rejected':
        badgeStyles = 'bg-rose-50 text-rose-700 border-rose-300';
        label = 'Rejected';
        break;
      case 'cancelled':
        badgeStyles = 'bg-slate-100 text-slate-600 border-slate-300';
        label = 'Cancelled';
        break;
      default:
        badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
        label = value;
    }
  } else if (type === 'role') {
    switch (normalizedValue) {
      case 'admin':
        badgeStyles = 'bg-purple-100 text-purple-800 border-purple-200';
        break;
      case 'seller':
        badgeStyles = 'bg-amber-100 text-amber-800 border-amber-200';
        break;
      case 'buyer':
        badgeStyles = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        break;
      default:
        badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  } else if (type === 'aiResult') {
    switch (normalizedValue) {
      case 'likely_duplicate':
        badgeStyles = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
        label = 'Likely Duplicate';
        break;
      case 'possible_duplicate':
        badgeStyles = 'bg-amber-50 text-amber-700 border-amber-300 font-bold';
        label = 'Possible Duplicate';
        break;
      case 'no_match':
        badgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-300';
        label = 'No Close Match';
        break;
      default:
        badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
        label = value;
    }
  } else if (type === 'verification') {
    switch (normalizedValue) {
      case 'likely_original':
        badgeStyles = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
        label = 'Likely camera-captured';
        break;
      case 'possibly_downloaded':
        badgeStyles = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
        label = 'Possible external image';
        break;
      case 'possibly_ai_generated':
        badgeStyles = 'bg-purple-50 text-purple-800 border-purple-300 font-bold';
        label = 'Possible AI-generated image';
        break;
      case 'duplicate_detected':
        badgeStyles = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
        label = 'Matching image found';
        break;
      case 'manual_review_required':
        badgeStyles = 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
        label = 'Manual review recommended';
        break;
      case 'verification_unavailable':
      default:
        badgeStyles = 'bg-slate-100 text-slate-700 border-slate-300';
        label = 'Unable to verify';
    }
  } else if (type === 'aiReview') {
    switch (normalizedValue) {
      case 'confirmed':
        badgeStyles = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
        label = 'Flag Confirmed';
        break;
      case 'dismissed':
        badgeStyles = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        label = 'Flag Dismissed (Authentic)';
        break;
      case 'reviewed':
        badgeStyles = 'bg-blue-50 text-blue-700 border-blue-300';
        label = 'Reviewed';
        break;
      case 'not_reviewed':
      default:
        badgeStyles = 'bg-slate-100 text-slate-600 border-slate-300';
        label = 'Pending Review';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyles}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
