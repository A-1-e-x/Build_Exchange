import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Recycle,
  Coins,
  MapPin,
  Sparkles,
  Layers,
  CheckCircle,
  TrendingUp,
  HardHat,
} from 'lucide-react';
import MaterialCard from '../components/common/MaterialCard';
import CategoryCard from '../components/common/CategoryCard';
import api from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [featuredMaterials, setFeaturedMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [catRes, matRes] = await Promise.all([
          api.get('/categories'),
          api.get('/materials/featured'),
        ]);

        if (catRes.data && catRes.data.categories) {
          setCategories(catRes.data.categories);
        }
        if (matRes.data && matRes.data.materials) {
          setFeaturedMaterials(matRes.data.materials);
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedCategory !== 'All') params.append('category', selectedCategory);
    navigate(`/materials?${params.toString()}`);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-amber-50/40 to-slate-50 pt-16 pb-24 border-b border-amber-100/60">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Sustainable Circular Construction</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Buy. Sell. Reuse.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-700">
                Build Sustainably.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              Connect with buyers and sellers of unused, surplus, and reusable construction materials in your area.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/materials"
                className="px-6 py-3.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-lg shadow-amber-600/25 hover:shadow-xl transition-all flex items-center gap-2"
              >
                <span>Browse Materials</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/sell"
                className="px-6 py-3.5 rounded-xl font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-amber-600" />
                <span>Sell Materials</span>
              </Link>
            </div>

            {/* Interactive Hero Search Form */}
            <form
              onSubmit={handleHeroSearch}
              className="mt-8 p-3 rounded-2xl bg-white shadow-xl border border-slate-200/80 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cement, bricks, tiles, steel, plywood..."
                  className="w-full pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none rounded-xl"
                />
              </div>

              <div className="sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-3 px-3 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span>Search</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl">
          <div className="text-center p-3">
            <p className="text-3xl sm:text-4xl font-black text-amber-400">100%</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Verified Local Materials</p>
          </div>
          <div className="text-center p-3 border-l border-slate-800">
            <p className="text-3xl sm:text-4xl font-black text-emerald-400">40%+</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Average Cost Savings</p>
          </div>
          <div className="text-center p-3 border-l border-slate-800">
            <p className="text-3xl sm:text-4xl font-black text-amber-400">Zero</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Platform Commission</p>
          </div>
          <div className="text-center p-3 border-l border-slate-800">
            <p className="text-3xl sm:text-4xl font-black text-emerald-400">Circular</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Waste Diverted from Landfills</p>
          </div>
        </div>
      </section>

      {/* Material Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
              Top Categories
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore Materials by Category
            </h2>
          </div>
          <Link
            to="/materials"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-2xl bg-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.slice(0, 8).map((cat) => (
              <CategoryCard key={cat._id} category={cat} />
            ))}
          </div>
        )}
      </section>

      {/* Featured Materials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
              Fresh Listings
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Surplus Materials
            </h2>
          </div>
          <Link
            to="/materials"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            <span>Browse Full Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : featuredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredMaterials.map((mat) => (
              <MaterialCard key={mat._id} material={mat} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
            <HardHat className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold">No materials listed yet.</p>
            <Link
              to="/sell"
              className="mt-3 inline-block px-4 py-2 text-sm font-bold text-white bg-amber-600 rounded-xl"
            >
              Be the first to list!
            </Link>
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-100/70 border-y border-slate-200/80 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How the Exchange Works
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Connecting surplus material holders directly with nearby buyers without middlemen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-2xl mx-auto shadow-inner">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                List Your Unused Materials
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Take quick photos of your surplus cement, tiles, bricks, or steel. Specify condition, quantity, and site location.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Find Interested Buyers
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Receive direct purchase enquiries from nearby homeowners, builders, and contractors looking for quality materials.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Reuse & Exchange Materials
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Arrange inspection and pickup. Recover valuable capital, eliminate landfill dump fees, and close the loop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
            Why Choose BuildExchange?
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Key Environmental & Financial Benefits
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Transforming construction waste into valuable resources for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Recycle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Reduce Construction Waste</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Divert tons of usable masonry, wood, and concrete from ending up in overburdened city landfills.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Save Significant Money</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Buyers obtain genuine, high-grade materials at 30% to 50% below standard retail hardware market rates.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Find Nearby Materials</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hyper-local geographic filtering ensures quick transport, lower haulage expenses, and zero transit delays.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Second Life for Surplus</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Surplus materials left over from commercial, architectural, or residential jobs get put to productive use.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-8 sm:p-12 md:p-16 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-4 text-center md:text-left">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
              Have Surplus Materials at Your Construction Site?
            </h3>
            <p className="text-amber-100 text-sm sm:text-base leading-relaxed">
              Don’t let valuable cement, steel, or tiles go to waste. List them on BuildExchange in less than two minutes and recover your investment.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              to="/sell"
              className="px-6 py-3.5 rounded-xl font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-lg transition-all text-center"
            >
              Start Selling Today
            </Link>
            <Link
              to="/materials"
              className="px-6 py-3.5 rounded-xl font-bold bg-amber-900/60 hover:bg-amber-900/80 text-white border border-white/20 transition-all text-center"
            >
              Explore Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
