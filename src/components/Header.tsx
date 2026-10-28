import React from 'react';
import { Activity, Layers, Network, Database, Sparkles, Download, Smartphone } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'topology' | 'mobile' | 'structural' | 'architecture' | 'explorer';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onExportReport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onExportReport }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-6 px-6 py-3.5 bg-white border-b border-slate-200 shadow-2xs">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
          <Network className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            GDO-MT Web &amp; Mobile
          </span>
          <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
            Réseau HTA &middot; Sans Node.js
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-slate-100 text-slate-900 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-600" />
          <span>Synthèse Réseau</span>
        </button>

        <button
          onClick={() => setActiveTab('topology')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'topology'
              ? 'bg-slate-100 text-slate-900 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Network className="w-4 h-4 text-emerald-600" />
          <span>Architecture Physique</span>
        </button>

        <button
          onClick={() => setActiveTab('mobile')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'mobile'
              ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200'
              : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50/50'
          }`}
        >
          <Smartphone className="w-4 h-4 text-blue-600" />
          <span>GPARC-Mobile (Offline)</span>
        </button>

        <button
          onClick={() => setActiveTab('structural')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'structural'
              ? 'bg-slate-100 text-slate-900 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Modèle DBase</span>
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'architecture'
              ? 'bg-slate-100 text-slate-900 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Cible Sans Node.js</span>
        </button>

        <button
          onClick={() => setActiveTab('explorer')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'explorer'
              ? 'bg-slate-100 text-slate-900 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4 text-slate-600" />
          <span>12 Tables Excel</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExportReport}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter Synthèse</span>
        </button>
      </div>
    </header>
  );
};
