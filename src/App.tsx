import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CCTVPlayer } from './components/CCTVPlayer';
import { CCTVGrid } from './components/CCTVGrid';
import { CameraSelector } from './components/CameraSelector';
import { StadionInfo } from './components/StadionInfo';
import { SnapshotModal } from './components/SnapshotModal';
import { StatusIndicator } from './components/StatusIndicator';
import { ALL_CAMERAS, PRIMARY_CAMERA } from './data/cctvData';
import { CCTVCamera, ViewMode, RegencyArea } from './types/cctv';
import { useCameraStatus } from './hooks/useCameraStatus';
import {
  Video,
  Radio,
  MapPin,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Maximize2,
  Tv,
  CheckCircle2,
  Share2,
  Zap,
  RefreshCw,
  Compass,
  Landmark,
} from 'lucide-react';

// Iconic landmarks spanning across all regencies of Yogyakarta
const POPULAR_LANDMARKS = [
  { label: 'Tugu Pal Putih', region: 'Kota Jogja', slugPart: 'tugu' },
  { label: 'Titik Nol KM', region: 'Kota Jogja', slugPart: 'nol' },
  { label: 'Malioboro', region: 'Kota Jogja', slugPart: 'malioboro' },
  { label: 'Pantai Parangtritis', region: 'Bantul', slugPart: 'parangtritis' },
  { label: 'Pantai Baron', region: 'Gunungkidul', slugPart: 'baron' },
  { label: 'Tugu Kaliurang', region: 'Sleman', slugPart: 'kaliurang' },
  { label: 'Flyover Jombor', region: 'Sleman', slugPart: 'jombor' },
  { label: 'Alun-Alun Wates', region: 'Kulon Progo', slugPart: 'wates' },
];

const REGENCY_GRID_OPTIONS: { id: RegencyArea; label: string }[] = [
  { id: 'Semua Wilayah', label: 'Seluruh DIY' },
  { id: 'Kota Yogyakarta', label: 'Kota Yogyakarta' },
  { id: 'Kabupaten Sleman', label: 'Kab. Sleman' },
  { id: 'Kabupaten Bantul', label: 'Kab. Bantul' },
  { id: 'Kabupaten Gunungkidul', label: 'Kab. Gunungkidul' },
  { id: 'Kabupaten Kulon Progo', label: 'Kab. Kulon Progo' },
  { id: 'Dishub Lalu Lintas DIY', label: 'Dishub DIY' },
];

export default function App() {
  // Default camera: first iconic camera or primary
  const [selectedCamera, setSelectedCamera] = useState<CCTVCamera>(PRIMARY_CAMERA);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [gridRegency, setGridRegency] = useState<RegencyArea>('Semua Wilayah');

  // Compute cameras for Grid view based on selected gridRegency
  const gridCameras = useMemo(() => {
    if (gridRegency === 'Semua Wilayah') return ALL_CAMERAS;
    return ALL_CAMERAS.filter((c) => c.regency === gridRegency);
  }, [gridRegency]);

  // Priority cameras to probe: selectedCamera + initial grid cameras of active region
  const priorityCameras = useMemo(() => {
    const initialGrid = gridCameras.slice(0, 8);
    const combined = [selectedCamera, ...initialGrid];
    const seen = new Set<string>();
    return combined.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [selectedCamera.id, gridCameras]);

  // Real-time stream status probing
  const {
    statuses,
    isRefreshing,
    lastGlobalCheck,
    refreshAll,
    refreshSingle,
    refreshBatch,
    probeBatch,
    liveCount,
    offlineCount,
  } = useCameraStatus(priorityCameras);

  // Snapshot modal state
  const [snapshotData, setSnapshotData] = useState<{
    imageUrl: string;
    camera: CCTVCamera;
  } | null>(null);
  const [snapshotHistory, setSnapshotHistory] = useState<string[]>([]);

  const handleSnapshot = (dataUrl: string, camera: CCTVCamera) => {
    setSnapshotData({ imageUrl: dataUrl, camera });
    setSnapshotHistory((prev) => [dataUrl, ...prev.slice(0, 9)]);
  };

  // Find camera for quick landmark button
  const handleSelectLandmark = (slugPart: string) => {
    const found = ALL_CAMERAS.find(
      (c) => c.slug.includes(slugPart) || c.alias_name.toLowerCase().includes(slugPart)
    );
    if (found) {
      setSelectedCamera(found);
      refreshSingle(found);
      if (viewMode !== 'single') setViewMode('single');
    }
  };

  const currentStatus = statuses[selectedCamera.id];
  const isCurrentLive = currentStatus?.status === 'live' || currentStatus?.status === 'degraded';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header with Live Camera Counter */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        snapshotCount={snapshotHistory.length}
        liveCount={liveCount}
        totalCount={ALL_CAMERAS.length}
        isRefreshing={isRefreshing}
        onRefreshAll={refreshAll}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner Quick Notice with Live Probe Stats & Direct Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/20 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              {isCurrentLive ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </>
              ) : currentStatus?.status === 'checking' ? (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-400 animate-pulse" />
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              )}
            </span>
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-white">Sedang Ditampilkan: </span>
              <span className="text-emerald-400 font-medium">{selectedCamera.alias_name}</span>
              <span className="text-slate-400 font-normal"> ({selectedCamera.regency})</span>
              {currentStatus?.latencyMs !== undefined && (
                <span className="ml-2 font-mono text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                  ⚡ {currentStatus.latencyMs}ms RTT
                </span>
              )}
              {currentStatus?.segmentCount !== undefined && (
                <span className="ml-1.5 font-mono text-[11px] text-slate-300 hidden md:inline">
                  • {currentStatus.segmentCount} Segmen Aktif
                </span>
              )}
              {currentStatus?.lastChecked && (
                <span className="ml-1.5 font-mono text-[11px] text-slate-400 hidden lg:inline">
                  • Update: {currentStatus.lastChecked}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => refreshSingle(selectedCamera)}
              disabled={isRefreshing}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 flex items-center gap-1.5 transition-colors"
              title="Periksa ulang latensi & metadata kamera ini"
            >
              <RefreshCw className={`w-3 h-3 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Cek Sinyal</span>
            </button>

            <a
              href={`https://cctv.jogjaprov.go.id/${selectedCamera.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-300 hover:text-emerald-400 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 flex items-center gap-1.5 transition-colors"
            >
              <span>Sumber Asli</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Quick Popular Landmarks Bar Across Yogyakarta (No stadium-specific sub-bar) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            Titik Ikonik Jogja:
          </span>
          {POPULAR_LANDMARKS.map((item) => {
            const cam = ALL_CAMERAS.find(
              (c) =>
                c.slug.includes(item.slugPart) ||
                c.alias_name.toLowerCase().includes(item.slugPart)
            );
            const isActive = cam && cam.id === selectedCamera.id;
            const camStatus = cam ? statuses[cam.id] : undefined;
            const isCamLive =
              camStatus?.status === 'live' || camStatus?.status === 'degraded';

            return (
              <button
                key={item.label}
                onClick={() => handleSelectLandmark(item.slugPart)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400 font-semibold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {cam && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isCamLive
                        ? 'bg-emerald-400 animate-pulse'
                        : camStatus?.status === 'checking'
                        ? 'bg-blue-400 animate-ping'
                        : camStatus?.status === 'offline'
                        ? 'bg-rose-500'
                        : 'bg-slate-500'
                    }`}
                  />
                )}
                <span>{item.label}</span>
                <span
                  className={`text-[10px] font-normal ${
                    isActive ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  • {item.region}
                </span>
                {camStatus?.latencyMs !== undefined && (
                  <span
                    className={`font-mono text-[10px] ${
                      isActive ? 'text-white' : 'text-emerald-400'
                    }`}
                  >
                    {camStatus.latencyMs}ms
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Video Player Display Area based on ViewMode */}
        {viewMode === 'single' ? (
          <div className="space-y-3">
            <div className="relative">
              <CCTVPlayer
                camera={selectedCamera}
                isFocused={true}
                statusData={statuses[selectedCamera.id]}
                onRefreshStatus={() => refreshSingle(selectedCamera)}
                onSnapshot={handleSnapshot}
              />
            </div>
          </div>
        ) : viewMode === 'quad' ? (
          <div className="space-y-3">
            {/* Grid Area Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-xs shrink-0">Wilayah Quad:</span>
              {REGENCY_GRID_OPTIONS.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setGridRegency(reg.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
                    gridRegency === reg.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>

            <CCTVGrid
              cameras={gridCameras}
              selectedCamera={selectedCamera}
              statuses={statuses}
              onSelectCamera={(cam) => setSelectedCamera(cam)}
              onSnapshot={handleSnapshot}
              onRefreshAll={refreshAll}
              onRefreshSingle={refreshSingle}
              onRefreshBatch={refreshBatch}
              onProbeCameras={probeBatch}
              isRefreshing={isRefreshing}
              lastChecked={lastGlobalCheck}
              gridCount={4}
              title={`Mode Quad-View (${gridRegency})`}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Grid Area Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-xs shrink-0">Wilayah Grid:</span>
              {REGENCY_GRID_OPTIONS.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setGridRegency(reg.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
                    gridRegency === reg.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>

            <CCTVGrid
              cameras={gridCameras}
              selectedCamera={selectedCamera}
              statuses={statuses}
              onSelectCamera={(cam) => setSelectedCamera(cam)}
              onSnapshot={handleSnapshot}
              onRefreshAll={refreshAll}
              onRefreshSingle={refreshSingle}
              onRefreshBatch={refreshBatch}
              onProbeCameras={probeBatch}
              isRefreshing={isRefreshing}
              lastChecked={lastGlobalCheck}
              gridCount={6}
              title={`Mode Multi-Kamera Grid (${gridRegency})`}
            />
          </div>
        )}

        {/* Camera Selector (All 600+ CCTV cameras in Yogyakarta with Search & Filters) */}
        <CameraSelector
          cameras={ALL_CAMERAS}
          selectedCamera={selectedCamera}
          statuses={statuses}
          onSelectCamera={(cam) => {
            setSelectedCamera(cam);
            refreshSingle(cam);
            if (viewMode !== 'single') setViewMode('single');
          }}
          onProbeCameras={probeBatch}
        />

        {/* Selected Camera Location Specifications, Traffic, and Coordinates */}
        <StadionInfo currentCamera={selectedCamera} />
      </main>

      {/* Snapshot Preview & Download Modal */}
      <SnapshotModal
        isOpen={!!snapshotData}
        onClose={() => setSnapshotData(null)}
        imageUrl={snapshotData?.imageUrl || null}
        camera={snapshotData?.camera || null}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
