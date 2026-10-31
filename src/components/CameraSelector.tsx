import React, { useState, useMemo } from 'react';
import { CCTVCamera, CameraLiveStatus, RegencyArea } from '../types/cctv';
import { StatusIndicator } from './StatusIndicator';
import { REGENCY_AREAS } from '../data/cctvData';
import {
  Video,
  Radio,
  MapPin,
  Search,
  SlidersHorizontal,
  Navigation,
  Compass,
  Building,
  CheckCircle2,
  Zap,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CameraSelectorProps {
  cameras: CCTVCamera[];
  selectedCamera: CCTVCamera;
  statuses?: Record<string, CameraLiveStatus>;
  onSelectCamera: (camera: CCTVCamera) => void;
  onProbeCameras?: (cameras: CCTVCamera[]) => void;
}

export const CameraSelector: React.FC<CameraSelectorProps> = ({
  cameras,
  selectedCamera,
  statuses = {},
  onSelectCamera,
  onProbeCameras,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegency, setSelectedRegency] = useState<RegencyArea>('Semua Wilayah');
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 24;

  const filteredCameras = useMemo(() => {
    return cameras.filter((cam) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cam.alias_name.toLowerCase().includes(q) ||
        cam.description.toLowerCase().includes(q) ||
        cam.group_name.toLowerCase().includes(q) ||
        cam.regency.toLowerCase().includes(q) ||
        cam.slug.toLowerCase().includes(q);

      const matchesRegency =
        selectedRegency === 'Semua Wilayah' || cam.regency === selectedRegency;

      const isLive = statuses[cam.id]?.status === 'live' || statuses[cam.id]?.status === 'degraded';
      const matchesActive = onlyActive ? isLive : true;

      return matchesSearch && matchesRegency && matchesActive;
    });
  }, [cameras, searchQuery, selectedRegency, onlyActive, statuses]);

  // Reset page when filter changes
  const handleRegencyChange = (regency: RegencyArea) => {
    setSelectedRegency(regency);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredCameras.length / PAGE_SIZE));
  const paginatedCameras = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCameras.slice(start, start + PAGE_SIZE);
  }, [filteredCameras, currentPage]);

  const requestedIdsRef = React.useRef<Set<string>>(new Set());

  // Probe visible cameras on current page only when user navigation filters change
  React.useEffect(() => {
    if (!onProbeCameras) return;
    const unprobed = paginatedCameras.filter((c) => !requestedIdsRef.current.has(c.id));
    if (unprobed.length > 0) {
      unprobed.forEach((c) => requestedIdsRef.current.add(c.id));
      onProbeCameras(unprobed);
    }
  }, [currentPage, selectedRegency, searchQuery, onlyActive, onProbeCameras, paginatedCameras.length]);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-base">Eksplorasi CCTV Seluruh D.I. Yogyakarta</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                {cameras.length} Titik
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              Jelajahi siaran langsung se-Kabupaten Sleman, Kota Yogyakarta, Bantul, Gunungkidul, Kulon Progo, dan Jalur Provinsi
            </p>
          </div>
        </div>

        {/* Active only toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => {
              setOnlyActive(!onlyActive);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              onlyActive
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                onlyActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>Hanya Yang Sedang Live</span>
          </button>
        </div>
      </div>

      {/* Regency / Area Filter Scrollable Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {REGENCY_AREAS.map((reg) => {
          const isSelected = selectedRegency === reg.id;
          return (
            <button
              key={reg.id}
              onClick={() => handleRegencyChange(reg.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{reg.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {reg.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input & Counter */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama lokasi (contoh: Maguwoharjo, Tugu, Malioboro, Parangtritis, Kaliurang, Baron, dll)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 whitespace-nowrap shrink-0 self-end sm:self-center">
          Ditemukan <span className="font-semibold text-white">{filteredCameras.length}</span> kamera
        </div>
      </div>

      {/* Camera Cards Grid (24 per page) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {paginatedCameras.map((cam) => {
          const isSelected = cam.id === selectedCamera.id;
          const status = statuses[cam.id];
          const isLive = status?.status === 'live' || status?.status === 'degraded';

          return (
            <button
              key={cam.id}
              onClick={() => onSelectCamera(cam)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div className="space-y-1.5 w-full">
                {/* Header: Name + Badge */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isLive
                          ? 'bg-emerald-400 animate-pulse'
                          : status?.status === 'checking'
                          ? 'bg-blue-400 animate-ping'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="font-bold text-xs text-white truncate" title={cam.alias_name}>
                      {cam.alias_name}
                    </span>
                  </div>

                  <div className="shrink-0">
                    <StatusIndicator statusData={status} size="sm" showDetails={false} />
                  </div>
                </div>

                {/* Description or details */}
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {cam.description || cam.alias_name}
                </p>
              </div>

              {/* Bottom metadata */}
              <div className="space-y-1 pt-1.5 border-t border-slate-800/70 text-[10px] w-full">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="truncate max-w-[140px] font-medium text-slate-300">
                    {cam.regency}
                  </span>
                  {status?.latencyMs !== undefined ? (
                    <span className="font-mono text-emerald-400 font-semibold">
                      ⚡ {status.latencyMs}ms
                    </span>
                  ) : (
                    <span className="font-mono text-slate-500">
                      {cam.lat.toFixed(3)}, {cam.lng.toFixed(3)}
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-[9px] truncate">
                  {cam.group_name}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filteredCameras.length === 0 && (
        <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-slate-800/80 p-6 space-y-2">
          <p className="text-white font-medium text-sm">Tidak ada kamera ditemukan untuk kata kunci ini</p>
          <p className="text-slate-400 text-xs">Coba kata kunci lain atau pilih tab 'Seluruh D.I. Yogyakarta'</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedRegency('Semua Wilayah');
              setOnlyActive(false);
            }}
            className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Menampilkan{' '}
            <span className="text-white font-medium">
              {(currentPage - 1) * PAGE_SIZE + 1} -{' '}
              {Math.min(currentPage * PAGE_SIZE, filteredCameras.length)}
            </span>{' '}
            dari <span className="text-white font-semibold">{filteredCameras.length}</span> kamera
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-white text-xs">
              Halaman {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
