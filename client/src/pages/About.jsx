import React from 'react';
import { Link } from 'react-router-dom';
import {
  HardHat,
  Recycle,
  Leaf,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  Code,
  ArrowRight,
} from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
          <HardHat className="w-4 h-4 text-amber-600" />
          <span>MCA Minor Project Documentation</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          About the Construction Material Exchange Platform
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          A full-stack MERN web application engineered to solve surplus material wastage and foster a circular economy in the construction industry.
        </p>
      </div>

      {/* Problem & Objective */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            01
          </div>
          <h2 className="text-2xl font-bold text-slate-900">The Problem</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            In modern construction projects, an estimated 10% to 15% of purchased raw materials (cement bags, bricks, floor tiles, rebar steel, timber) end up unused as surplus. These materials often sit in temporary storage sites until they deteriorate or are dumped into urban landfills, resulting in financial loss and environmental pollution.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            02
          </div>
          <h2 className="text-2xl font-bold text-slate-900">The Solution</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            BuildExchange provides a secure, role-based platform where builders, contractors, and home renovators can monetize their excess materials, while nearby buyers can acquire genuine, high-quality construction supplies at substantial discounts, creating a win-win circular marketplace.
          </p>
        </div>
      </div>

      {/* Technology Stack Specifications (Section 1) */}
      <div className="bg-slate-900 text-white p-8 sm:p-12 rounded-3xl space-y-8 shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
            System Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            MERN Stack Technology Stack
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Built strictly in compliance with MCA project academic guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Frontend</p>
            <h3 className="text-lg font-bold text-white">React.js & Tailwind CSS</h3>
            <p className="text-xs text-slate-300">
              React Router v6, Axios interceptors, responsive utility design for mobile, tablet, and desktop.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Backend API</p>
            <h3 className="text-lg font-bold text-white">Node.js & Express.js</h3>
            <p className="text-xs text-slate-300">
              RESTful MVC architecture, JWT session authentication, bcrypt password hashing, Multer file handling.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Database</p>
            <h3 className="text-lg font-bold text-white">MongoDB & Mongoose</h3>
            <p className="text-xs text-slate-300">
              Document ODM schemas for Users, Materials, Categories, Requests, and Favorites with compound text indexing.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Media Storage</p>
            <h3 className="text-lg font-bold text-white">Cloudinary & Local Fallback</h3>
            <p className="text-xs text-slate-300">
              Cloudinary multi-image upload pipeline with automatic resilient static fallback for local environments.
            </p>
          </div>
        </div>

        {/* Future Scope Note (Section 21) */}
        <div className="p-6 rounded-2xl bg-slate-800 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Future Scope (Modular Architecture)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Per the MCA Minor Project constraints, no AI/ML functionality is active in this release. However, the codebase is modularly designed so future enhancements can seamlessly plug in Computer Vision (AI material image classification, duplicate image detection, damage estimation) and pricing recommendation models.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-6">
        <Link
          to="/materials"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-xl shadow-amber-600/25 transition-all text-base"
        >
          <span>Explore Construction Materials</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default About;
