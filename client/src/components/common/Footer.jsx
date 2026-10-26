import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat, Leaf, Recycle, ShieldCheck, Mail, Phone, MapPin, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <HardHat className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Build<span className="text-amber-500">Exchange</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              India’s premier online marketplace for buying, selling, and reusing surplus construction materials.
              Empowering contractors, builders, and individuals to eliminate site waste and build sustainably.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-medium text-emerald-400">
                <Recycle className="w-3.5 h-3.5" />
                <span>Circular Economy</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-medium text-amber-400">
                <Leaf className="w-3.5 h-3.5" />
                <span>Eco-Friendly</span>
              </div>
            </div>
          </div>

          {/* Marketplace Navigation */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/materials" className="hover:text-amber-400 transition-colors">
                  All Materials
                </Link>
              </li>
              <li>
                <Link to="/materials?category=Cement+%26+Concrete" className="hover:text-amber-400 transition-colors">
                  Cement & Concrete
                </Link>
              </li>
              <li>
                <Link to="/materials?category=Bricks+%26+Blocks" className="hover:text-amber-400 transition-colors">
                  Bricks & Blocks
                </Link>
              </li>
              <li>
                <Link to="/materials?category=Steel+%26+TMT+Bars" className="hover:text-amber-400 transition-colors">
                  Steel & TMT Bars
                </Link>
              </li>
              <li>
                <Link to="/materials?category=Tiles+%26+Flooring" className="hover:text-amber-400 transition-colors">
                  Tiles & Flooring
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-amber-400 transition-colors">
                  List Your Materials
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-amber-400 transition-colors">
                  About the Project
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-400 transition-colors">
                  Account Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-amber-400 transition-colors">
                  Create Free Account
                </Link>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Safety Guidelines
                </span>
              </li>
            </ul>
          </div>

          {/* Contact & MCA Info */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              Project Info
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>MCA Minor Project, Department of Computer Applications</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>support@buildexchange.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
            </ul>
            <div className="mt-5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <p className="text-xs text-slate-400 font-medium">
                Built with <span className="text-amber-400 font-semibold">MERN Stack</span> & Tailwind CSS for Sustainable Construction.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Construction Material Exchange Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Buy. Sell. Reuse. Build Sustainably.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
