import React from 'react';
import { Shield, ExternalLink, Heart, Radio, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-slate-300">CCTV Jogja Istimewa Live</span>
            <span className="text-slate-500 mx-2">•</span>
            <span>Sumber Resmi: Pemerintah Daerah D.I. Yogyakarta & Dinas Kominfo Kabupaten/Kota</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-400">
          <a
            href="https://cctv.jogjaprov.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <span>Portal CCTV Jogja Prov</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://jogjaprov.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <span>Pemda DIY</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-slate-600">|</span>
          <span>Sleman • Kota Jogja • Bantul • Gunungkidul • Kulon Progo</span>
        </div>
      </div>
    </footer>
  );
};
