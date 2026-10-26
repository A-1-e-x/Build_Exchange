import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat, ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <HardHat className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-slate-900 tracking-tight">404</h1>
          <h2 className="text-2xl font-bold text-slate-800">Page Not Found</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            The page or material you are looking for has been moved, demolished, or does not exist.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            to="/materials"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <span>Browse Materials</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
