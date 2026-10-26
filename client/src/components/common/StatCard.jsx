import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'amber' }) => {
  const colorMap = {
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      ring: 'group-hover:border-amber-400',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      ring: 'group-hover:border-emerald-400',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      ring: 'group-hover:border-blue-400',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      ring: 'group-hover:border-purple-400',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-200',
      ring: 'group-hover:border-rose-400',
    },
    slate: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      ring: 'group-hover:border-slate-400',
    },
  }[color] || {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    ring: 'group-hover:border-amber-400',
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all ${colorMap.ring}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h4>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorMap.bg} ${colorMap.text} border ${colorMap.border} shadow-sm group-hover:scale-105 transition-transform`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
