import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';

const CategoryCard = ({ category }) => {
  return (
    <Link
      to={`/materials?category=${encodeURIComponent(category.name)}`}
      className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all duration-300 flex flex-col justify-end p-6 min-h-[220px]"
    >
      {/* Background Image with Dark Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src={category.image || 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80'}
          alt={category.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-500/90 text-slate-950 shadow-sm">
            {category.itemCount !== undefined ? `${category.itemCount} items` : 'Explore'}
          </span>
          <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
          {category.name}
        </h3>

        {category.description && (
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
      </div>
    </Link>
  );
};

export default CategoryCard;
