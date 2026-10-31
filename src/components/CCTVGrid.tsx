import React, { useState, useEffect, useRef } from 'react';
import { CCTVCamera, CameraLiveStatus } from '../types/cctv';
import { CCTVPlayer } from './CCTVPlayer';
import { StatusIndicator } from './StatusIndicator';
import {
  LayoutGrid,
  Eye,
  RefreshCw,
  Activity,
  Zap,
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
} from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CCTVGridProps {
  cameras: CCTVCamera[];
  selectedCamera: CCTVCamera;
  statuses: Record<string, CameraLiveStatus>;
  onSelectCamera: (cam: CCTVCamera) => void;
  onSnapshot: (dataUrl: string, camera: CCTVCamera) => void;
  onRefreshAll?: () => void;
  onRefreshSingle?: (camera: CCTVCamera) => void;
  onRefreshBatch?: (cameras: CCTVCamera[]) => void;
  onProbeCameras?: (cameras: CCTVCamera[]) => void;
  isRefreshing?: boolean;
  lastChecked?: string;
  gridCount?: 4 | 6;
  title?: string;
}

export const CCTVGrid: React.FC<CCTVGridProps> = ({
  cameras,
  selectedCamera,
  statuses,
  onSelectCamera,
  onSnapshot,
  onRefreshAll,
  onRefreshSingle,
  onRefreshBatch,
  onProbeCameras,
  isRefreshing = false,
  lastChecked,
  gridCount = 4,
  title = 'Multi-Kamera Kawasan D.I. Yogyakarta',
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'live' | 'offline'>('all');
  const [gridPage, setGridPage] = useState<number>(0);

  const requestedGridIdsRef = useRef<Set<string>>(new Set());

  // Filtered cameras based on status
  const filteredCameras = cameras.filter((cam) => {
    const stat = statuses[cam.id]?.status;
    if (filterMode === 'live') return stat === 'live' || stat === 'degraded';
    if (filterMode === 'offline') return stat === 'offline';
    return true;
  });

  const totalGridPages = Math.max(1, Math.ceil(filteredCameras.length / gridCount));
  const activeGridIndex = Math.min(gridPage, totalGridPages - 1);
  const displayCameras = filteredCameras.slice(
    activeGridIndex * gridCount,
    activeGridIndex * gridCount + gridCount
  );

  const liveCount = cameras.filter(
    (c) => statuses[c.id]?.status === 'live' || statuses[c.id]?.status === 'degraded'
  ).length;
  const offlineCount = cameras.filter((c) => statuses[c.id]?.status === 'offline').length;
  const unprobedCount = cameras.filter((c) => !statuses[c.id]).length;

  // Probe cameras visible in the active grid
  useEffect(() => {
    if (!onProbeCameras || displayCameras.length === 0) return;
    const unprobed = displayCameras.filter((c) => !requestedGridIdsRef.current.has(c.id));
    if (unprobed.length > 0) {
      unprobed.forEach((c) => requestedGridIdsRef.current.add(c.id));
      onProbeCameras(unprobed);
    }
  }, [displayCameras.length, gridPage, onProbeCameras]);

  // When 'live' filter is active, if we have fewer live cameras than gridCount,
  // automatically probe the next batch of unprobed cameras to find live streams!
  useEffect(() => {
    if (filterMode !== 'live' || !onProbeCameras) return;
    const unprobed = cameras.filter((c) => !statuses[c.id] && !requestedGridIdsRef.current.has(c.id));
    if (unprobed.length > 0 && liveCount < gridCount) {
      const batch = unprobed.slice(0, 10);
      batch.forEach((c) => requestedGridIdsRef.current.add(c.id));
      onProbeCameras(batch);
    }
  }, [filterMode, liveCount, gridCount, cameras, statuses, onProbeCameras]);

  const handleScanMore = () => {
    if (!onProbeCameras) return;
    const unprobed = cameras.filter((c) => !statuses[c.id]);
    const batch = unprobed.slice(0, 15);
    batch.forEach((c) => requestedGridIdsRef.current.add(c.id));
    onProbeCameras(batch);
  };

  return (
    <div className="space-y-4">
      {/* Grid Header & Real-Time Status Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                {title}
              </h2>
              <span className="text-xs text-slate-400">
                ({filteredCameras.length} Kamera Ditampilkan)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pantau multi-kamera sekaligus dengan verifikasi status stream aktif & latensi real-time
            </p>
          </div>
        </div>

        {/* Real-time Health Pills, Page Switcher & Refresh Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Page switch if more than 1 page */}
          {totalGridPages > 1 && (
            <div className="flex items-center bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs text-slate-300 gap-1.5">
              <button
                onClick={() => setGridPage((p) => Math.max(0, p - 1))}
                disabled={activeGridIndex === 0}
                className="p-1 hover:text-white disabled:opacity-30"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px]">
                {activeGridIndex + 1}/{totalGridPages}
              </span>
              <button
                onClick={() => setGridPage((p) => Math.min(totalGridPages - 1, p + 1))}
                disabled={activeGridIndex >= totalGridPages - 1}
                className="p-1 hover:text-white disabled:opacity-30"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Status summary filter pills */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setFilterMode('all');
                setGridPage(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({cameras.length})
            </button>
            <button
              onClick={() => {
                setFilterMode('live');
                setGridPage(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                filterMode === 'live'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live ({liveCount})</span>
            </button>
            <button
              onClick={() => {
                setFilterMode('offline');
                setGridPage(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                filterMode === 'offline'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Offline ({offlineCount})</span>
            </button>
          </div>

          {/* Refresh all status button */}
          {(onRefreshBatch || onRefreshAll) && (
            <button
              onClick={() => {
                if (onRefreshBatch && displayCameras.length > 0) {
                  onRefreshBatch(displayCameras);
                } else if (onRefreshAll) {
                  onRefreshAll();
                }
              }}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer shadow-sm hover:border-slate-600 active:scale-95"
              title="Periksa ulang status dan latensi kamera yang sedang tampil di layar saat ini"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isRefreshing ? 'Memeriksa...' : 'Segarkan Status'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Camera Cards */}
      <div
        className={`grid gap-4 ${
          gridCount === 4
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {displayCameras.map((cam) => {
          const isSelected = cam.id === selectedCamera.id;
          const status = statuses[cam.id];
          const isLive = status?.status === 'live' || status?.status === 'degraded';

          return (
            <div
              key={cam.id}
              className={`relative bg-slate-900 border rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Top Header: Camera Name + Live/Offline Badge */}
              <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isLive
                        ? 'bg-emerald-400 animate-pulse'
                        : status?.status === 'checking'
                        ? 'bg-blue-400 animate-ping'
                        : 'bg-rose-500'
                    }`}
                  />
                  <h3 className="font-semibold text-xs text-white truncate" title={cam.alias_name}>
                    {cam.alias_name}
                  </h3>
                </div>

                {/* Real-time Status Indicator with Latency & Segments */}
                <div className="shrink-0">
                  <StatusIndicator
                    statusData={status}
                    size="sm"
                    showDetails={true}
                    onRefresh={onRefreshSingle ? () => onRefreshSingle(cam) : undefined}
                  />
                </div>
              </div>

              {/* Video Player */}
              <div className="relative">
                <CCTVPlayer
                  camera={cam}
                  compact={true}
                  statusData={status}
                  isFocused={isSelected}
                  onFocus={() => onSelectCamera(cam)}
                  onSnapshot={onSnapshot}
                  onRefreshStatus={onRefreshSingle ? () => onRefreshSingle(cam) : undefined}
                />
              </div>

              {/* Card Telemetry Footer */}
              <div className="px-3.5 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                {/* Left: Metadata details */}
                <div className="flex items-center gap-2.5 text-slate-400 text-[11px] overflow-hidden">
                  {status?.latencyMs !== undefined && (
                    <span className="flex items-center gap-1 font-mono text-emerald-400 font-medium">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      {status.latencyMs}ms RTT
                    </span>
                  )}
                  {status?.segmentCount !== undefined && (
                    <span className="hidden sm:flex items-center gap-1 font-mono text-slate-300">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      {status.segmentCount} seg
                    </span>
                  )}
                  {status?.targetDuration !== undefined && (
                    <span className="hidden md:inline font-mono text-slate-400">
                      {status.targetDuration}s/seg
                    </span>
                  )}
                  {!isLive && status?.errorReason && (
                    <span className="text-rose-400 text-[10px] truncate max-w-[140px]" title={status.errorReason}>
                      {status.errorReason}
                    </span>
                  )}
                </div>

                {/* Right: Focus / View Button */}
                <button
                  onClick={() => onSelectCamera(cam)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
                  }`}
                  title="Fokus tampilan kamera ini ke pemutar utama"
                >
                  <Eye className="w-3 h-3" />
                  <span>{isSelected ? 'Sedang Fokus' : 'Fokus'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State / Scanning State when Live Filter has 0 cameras found yet */}
      {filteredCameras.length === 0 && (
        <div className="text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-3">
          {filterMode === 'live' && unprobedCount > 0 ? (
            <>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <h3 className="text-white font-semibold text-sm">
                Sedang Memindai Siaran Live di {title}...
              </h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Terdapat {unprobedCount} kamera yang belum diperiksa di wilayah ini. Sistem sedang memindai untuk menemukan kamera yang aktif menyiarkan streaming.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleScanMore}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Pindai 15 Kamera Berikutnya</span>
                </button>
                <button
                  onClick={() => setFilterMode('all')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
                >
                  Tampilkan Semua
                </button>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-white font-medium text-sm">
                {filterMode === 'live'
                  ? 'Belum ada siaran live yang terdeteksi di wilayah ini'
                  : 'Tidak ada kamera dengan filter ini'}
              </h3>
              <p className="text-slate-400 text-xs">
                {filterMode === 'live'
                  ? 'Kamera di wilayah ini mungkin sedang dalam pemeliharaan atau sedang offline.'
                  : 'Silakan ubah filter atau beralih ke wilayah lain.'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setFilterMode('all')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                >
                  Tampilkan Semua Kamera ({cameras.length})
                </button>
                {unprobedCount > 0 && (
                  <button
                    onClick={handleScanMore}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
                  >
                    Pindai Ulang ({unprobedCount})
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
