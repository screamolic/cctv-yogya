import React from 'react';
import {
  Video,
  Radio,
  Tv,
  LayoutGrid,
  Square,
  ExternalLink,
  ShieldCheck,
  Camera,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { ViewMode } from '../types/cctv';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  snapshotCount: number;
  liveCount?: number;
  totalCount?: number;
  isRefreshing?: boolean;
  onRefreshAll?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  snapshotCount,
  liveCount,
  totalCount = 609,
  isRefreshing = false,
  onRefreshAll,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-500 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Video className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-white font-bold text-base sm:text-lg tracking-tight">
                CCTV Jogja Istimewa Live
              </h1>
              {liveCount !== undefined && totalCount !== undefined ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-400"
                  title={`${liveCount} kamera aktif terverifikasi dari ${totalCount} titik se-DIY`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{liveCount}/{totalCount} AKTIF</span>
                </div>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>600+ CCTV SE-DIY</span>
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs hidden sm:block">
              Pemantauan Siaran Langsung Real-Time Se-Daerah Istimewa Yogyakarta (Sleman, Kota Jogja, Bantul, Gunungkidul, Kulon Progo)
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Official Link */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => onViewModeChange('single')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'single'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan Fokus Kamera Tunggal"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Fokus</span>
            </button>

            <button
              onClick={() => onViewModeChange('quad')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'quad'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan Quad (4 Sudut Kamera Simultan)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Quad (4)</span>
            </button>

            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan Grid Kamera Multi-Sudut"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Grid (6)</span>
            </button>
          </div>

          {/* Official Jogja Prov Portal link */}
          <a
            href="https://cctv.jogjaprov.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            title="Kunjungi website resmi CCTV Pemprov DIY (cctv.jogjaprov.go.id)"
          >
            <span>cctv.jogjaprov.go.id</span>
            <ExternalLink className="w-3 h-3 text-emerald-400" />
          </a>
        </div>
      </div>
    </header>
  );
};
