import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  HardHat,
  MapPin,
  RefreshCw,
  Layers,
} from 'lucide-react';
import MaterialCard from '../components/common/MaterialCard';
import { MATERIAL_CONDITIONS, INDIAN_STATES } from '../utils/constants';
import api from '../services/api';

const BrowseMaterials = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [condition, setCondition] = useState(searchParams.get('condition') || 'All');
  const [state, setState] = useState(searchParams.get('state') || 'All');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch categories once
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data?.categories) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch materials whenever filters change
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (search.trim()) params.append('search', search.trim());
        if (category && category !== 'All') params.append('category', category);
        if (condition && condition !== 'All') params.append('condition', condition);
        if (state && state !== 'All') params.append('state', state);
        if (city.trim()) params.append('city', city.trim());
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (sort) params.append('sort', sort);
        params.append('page', page);
        params.append('limit', 12);

        setSearchParams(params, { replace: true });

        const res = await api.get(`/materials?${params.toString()}`);
        if (res.data) {
          const rawMaterials = res.data.materials || [];
          const cleanMaterials = rawMaterials.filter(
            (m) =>
              m.isApproved !== false &&
              ![
                'DUPLICATE_DETECTED',
                'POSSIBLY_AI_GENERATED',
                'POSSIBLY_DOWNLOADED',
                'MANUAL_REVIEW_REQUIRED',
              ].includes(m.verificationSummary?.status)
          );
          setMaterials(cleanMaterials);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err) {
        console.error('Error fetching materials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [search, category, condition, state, city, minPrice, maxPrice, sort, page]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setCondition('All');
    setState('All');
    setCity('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    category !== 'All' ||
    condition !== 'All' ||
    state !== 'All' ||
    Boolean(city) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    sort !== 'newest';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Browse Construction Materials
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover surplus, reclaimed, and certified reusable materials from nearby builders.
          </p>
        </div>

        {/* Dynamic Search Bar */}
        <div className="w-full md:w-96 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search material, brand, city..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Material Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mobile filter button */}
        <div className="lg:hidden flex items-center justify-between">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-600" />
            <span>Filters {hasActiveFilters && '• Active'}</span>
          </button>
          <span className="text-sm font-semibold text-slate-500">
            {total} items found
          </span>
        </div>

        {/* Sidebar Filters (Desktop & Mobile drawer) */}
        <aside
          className={`lg:block ${
            mobileFilterOpen
              ? 'fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto'
              : 'hidden'
          }`}
        >
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Filter Materials</h3>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
                  >
                    Reset All
                  </button>
                )}
                {mobileFilterOpen && (
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 text-sm font-medium rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Condition
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="condition"
                    checked={condition === 'All'}
                    onChange={() => {
                      setCondition('All');
                      setPage(1);
                    }}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>All Conditions</span>
                </label>
                {MATERIAL_CONDITIONS.map((c) => (
                  <label
                    key={c.value}
                    className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="condition"
                      checked={condition === c.value}
                      onChange={() => {
                        setCondition(c.value);
                        setPage(1);
                      }}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Price Range (₹)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Location State Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                State
              </label>
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 text-sm font-medium rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
              >
                <option value="All">All States</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Location City Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                City / District
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Pune..."
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {mobileFilterOpen && (
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm shadow-md"
              >
                Apply Filters
              </button>
            )}
          </div>
        </aside>

        {/* Material Listings Feed */}
        <section className="lg:col-span-3 space-y-6">
          {/* Header Controls: Count & Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <span className="text-sm font-semibold text-slate-700">
              Showing <span className="text-amber-600 font-bold">{materials.length}</span> of{' '}
              <span className="text-slate-900 font-bold">{total}</span> listings
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sort By:
              </span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="newest">Newest Listed</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="popular">Most Viewed</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : materials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((mat) => (
                <MaterialCard key={mat._id} material={mat} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <HardHat className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No matching construction materials found
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Try widening your price range, clearing location filters, or searching for broader terms like "Cement" or "Tiles".
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        page === pNum
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default BrowseMaterials;
