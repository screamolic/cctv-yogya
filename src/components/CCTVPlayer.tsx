import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Camera,
  RefreshCw,
  Volume2,
  VolumeX,
  Radio,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  AlertTriangle,
  Move,
  Clock,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { CCTVCamera, StreamStats, CameraLiveStatus } from '../types/cctv';
import { StatusIndicator } from './StatusIndicator';

interface CCTVPlayerProps {
  camera: CCTVCamera;
  autoPlay?: boolean;
  compact?: boolean;
  statusData?: CameraLiveStatus;
  onSnapshot?: (dataUrl: string, camera: CCTVCamera) => void;
  onFocus?: () => void;
  onRefreshStatus?: () => void;
  isFocused?: boolean;
}

export const CCTVPlayer: React.FC<CCTVPlayerProps> = ({
  camera,
  autoPlay = true,
  compact = false,
  statusData,
  onSnapshot,
  onFocus,
  onRefreshStatus,
  isFocused = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [stats, setStats] = useState<StreamStats>({ status: 'connecting' });
  const [retryCount, setRetryCount] = useState<number>(0);
  const [currentTimeWIB, setCurrentTimeWIB] = useState<string>('');
  const [snapshotFlash, setSnapshotFlash] = useState<boolean>(false);

  // Clock in WIB (UTC+7)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format in Indonesian locale with WIB
      const timeStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      const dateStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(now);
      setCurrentTimeWIB(`${dateStr} • ${timeStr} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize and load HLS stream
  const setupStream = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setStats((prev) => ({ ...prev, status: 'connecting' }));

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        backBufferLength: 10,
      });

      hlsRef.current = hls;

      hls.loadSource(camera.stream_url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStats((prev) => ({ ...prev, status: 'playing' }));
        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay might need user interaction or muted
            video.muted = true;
            setIsMuted(true);
            video.play().catch(() => {});
          });
        }
      });

      hls.on(Hls.Events.FRAG_LOADED, (_event, data) => {
        const resolution = video.videoWidth && video.videoHeight ? `${video.videoWidth}x${video.videoHeight}` : 'HD (1080p)';
        const buffer = video.buffered.length > 0 ? (video.buffered.end(video.buffered.length - 1) - video.currentTime) : 0;
        setStats({
          status: 'playing',
          resolution,
          bufferLength: Math.max(0, Math.round(buffer * 10) / 10),
          bitrate: Math.round((data.frag.stats.total * 8) / (data.frag.duration || 2) / 1000),
          latency: Math.max(0, Math.round((video.duration - video.currentTime) * 10) / 10),
          lastUpdated: new Date().toLocaleTimeString(),
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setStats((prev) => ({ ...prev, status: 'error' }));
              console.warn('[HLS] Network error encountered, retrying in 3s...');
              setTimeout(() => {
                hls.startLoad();
              }, 3000);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setStats((prev) => ({ ...prev, status: 'stalled' }));
              console.warn('[HLS] Media error, trying recovery...');
              hls.recoverMediaError();
              break;
            default:
              setStats((prev) => ({ ...prev, status: 'error' }));
              console.error('[HLS] Unrecoverable error, reinitializing...');
              hls.destroy();
              setTimeout(() => {
                setRetryCount((c) => c + 1);
              }, 4000);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari support
      video.src = camera.stream_url;
      video.addEventListener('loadedmetadata', () => {
        setStats((prev) => ({ ...prev, status: 'playing' }));
        if (autoPlay) {
          video.play().catch(() => {});
        }
      });
      video.addEventListener('error', () => {
        setStats((prev) => ({ ...prev, status: 'error' }));
      });
    }
  }, [camera.stream_url, autoPlay]);

  useEffect(() => {
    setupStream();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [setupStream, retryCount]);

  // Handle Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
      // sync to live edge
      if (video.buffered.length > 0) {
        video.currentTime = video.buffered.end(video.buffered.length - 1) - 0.5;
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Jump to live edge
  const jumpToLive = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.buffered.length > 0) {
      video.currentTime = video.buffered.end(video.buffered.length - 1) - 0.3;
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Snapshot Capture Feature with Watermark
  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 300);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add high-contrast professional watermark bar at the bottom
    const barHeight = Math.max(50, Math.round(canvas.height * 0.075));
    ctx.fillStyle = 'rgba(10, 15, 29, 0.85)';
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

    // Accent line
    ctx.fillStyle = '#10b981'; // emerald green
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, 3);

    // Text formatting
    const fontSize = Math.max(16, Math.round(barHeight * 0.38));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';

    const yPos = canvas.height - barHeight / 2;
    // Left text: Camera Name
    ctx.fillText(`CCTV JOGJA: ${camera.alias_name.toUpperCase()}`, 24, yPos);

    // Right text: Timestamp WIB
    const timeText = `${currentTimeWIB} • ID: ${camera.id}`;
    const textWidth = ctx.measureText(timeText).width;
    ctx.fillText(timeText, canvas.width - textWidth - 24, yPos);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    if (onSnapshot) {
      onSnapshot(dataUrl, camera);
    } else {
      // Direct download fallback
      const link = document.createElement('a');
      link.download = `cctv-${camera.slug}-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    }
  };

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.min(3, Math.max(1, Math.round((prev + delta) * 10) / 10));
      if (next === 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan handlers when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      const maxOffset = (zoomLevel - 1) * 150;
      const newX = Math.min(maxOffset, Math.max(-maxOffset, e.clientX - dragStart.x));
      const newY = Math.min(maxOffset, Math.max(-maxOffset, e.clientY - dragStart.y));
      setPanOffset({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onClick={onFocus}
      className={`group relative bg-slate-950 overflow-hidden rounded-2xl border transition-all duration-200 select-none ${
        isFocused
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
          : 'border-slate-800 hover:border-slate-700'
      } ${compact ? 'aspect-video' : 'w-full aspect-video min-h-[300px]'}`}
    >
      {/* Snapshot flash effect */}
      {snapshotFlash && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-300" />
      )}

      {/* Video element with digital zoom and pan transform */}
      <div
        className="w-full h-full overflow-hidden flex items-center justify-center cursor-default"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <video
          ref={videoRef}
          playsInline
          muted={isMuted}
          className="w-full h-full object-contain pointer-events-none transition-transform duration-75"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>

      {/* Loading & Status overlay if connecting or error */}
      {stats.status !== 'playing' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 text-center px-4">
          {stats.status === 'connecting' && (
            <>
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <Radio className="w-5 h-5 text-emerald-400 absolute inset-0 m-auto" />
              </div>
              <div className="text-slate-200 font-medium text-sm">Menghubungkan ke server stream CCTV...</div>
              <div className="text-slate-400 text-xs">Dinas Kominfo Sleman / CCTV Jogja Istimewa</div>
            </>
          )}

          {stats.status === 'error' && (
            <>
              <AlertTriangle className="w-10 h-10 text-amber-400 animate-pulse" />
              <div className="text-slate-200 font-medium text-sm">Aliran video sedang buffering atau offline</div>
              <div className="text-slate-400 text-xs max-w-sm">
                Server kamera sedang menyegarkan segmen m3u8. Mencoba menyambung kembali otomatis...
              </div>
              <button
                onClick={setupStream}
                className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sambungkan Ulang
              </button>
            </>
          )}
        </div>
      )}

      {/* Header bar overlay (Camera title & Live beacon) */}
      <div className="absolute top-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2 z-30 pointer-events-none">
        <div className="flex items-center gap-2 overflow-hidden">
          {statusData ? (
            <div className="pointer-events-auto">
              <StatusIndicator
                statusData={statusData}
                size="sm"
                showDetails={!compact}
                onRefresh={onRefreshStatus}
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider text-emerald-300 uppercase">LIVE</span>
            </div>
          )}

          <div className="text-left truncate">
            <h3 className="text-white font-semibold text-xs sm:text-sm drop-shadow-md truncate">
              {camera.alias_name}
            </h3>
            {!compact && (
              <p className="text-[10px] sm:text-xs text-slate-300 drop-shadow truncate">
                {camera.group_name} • Sleman, D.I. Yogyakarta
              </p>
            )}
          </div>
        </div>

        {/* Real-time WIB Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/50 border border-white/10 text-white/90 text-[11px] font-mono backdrop-blur-md">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>{currentTimeWIB}</span>
        </div>
      </div>

      {/* Zoom indicator pill when zoomed */}
      {zoomLevel > 1 && (
        <div className="absolute top-14 left-4 z-30 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white text-[11px]">
          <Move className="w-3 h-3 text-emerald-400" />
          <span>Zoom {zoomLevel}x</span>
          <button
            onClick={resetZoom}
            className="hover:text-emerald-400 ml-1 transition-colors pointer-events-auto"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Stream Diagnostics Overlay */}
      {showDiagnostics && (
        <div className="absolute top-14 right-4 z-30 bg-black/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 shadow-xl space-y-1.5 min-w-[220px]">
          <div className="font-semibold text-emerald-400 text-[11px] flex items-center justify-between border-b border-slate-700 pb-1">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" /> DIAGNOSTIK STREAM
            </span>
            <button
              onClick={() => setShowDiagnostics(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status Server:</span>
            <span className="font-mono text-emerald-300 font-semibold uppercase">{statusData?.status || stats.status}</span>
          </div>
          {statusData?.latencyMs !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-400">Latensi Respon (RTT):</span>
              <span className="font-mono text-emerald-400 font-semibold">{statusData.latencyMs} ms</span>
            </div>
          )}
          {statusData?.segmentCount !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-400">Segmen Aktif:</span>
              <span className="font-mono text-slate-200">{statusData.segmentCount} segmen</span>
            </div>
          )}
          {statusData?.targetDuration !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-400">Durasi Target:</span>
              <span className="font-mono text-slate-200">{statusData.targetDuration}s / segmen</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Resolusi:</span>
            <span className="font-mono">{stats.resolution || 'Auto / HD'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Buffer Segmen:</span>
            <span className="font-mono">{stats.bufferLength || 0} detik</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Latensi Live:</span>
            <span className="font-mono text-emerald-300">{stats.latency || 0}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Protokol:</span>
            <span className="font-mono text-xs">HLS (RFC 8216)</span>
          </div>
          {statusData?.lastChecked && (
            <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1 mt-1">
              <span>Dicek Terakhir:</span>
              <span className="font-mono">{statusData.lastChecked}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom control bar (shows on hover or compact controls) */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-200 z-30 flex items-center justify-between gap-2 ${
          compact ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
        }`}
      >
        {/* Left controls: Play, Live sync, Reconnect */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-md"
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={jumpToLive}
            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors backdrop-blur-md"
            title="Sinkronisasi ke siaran paling depan"
          >
            <Radio className="w-3 h-3" />
            <span className="hidden sm:inline">LIVE EDGE</span>
          </button>

          <button
            onClick={setupStream}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-md"
            title="Muat ulang siaran"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right controls: Zoom, Snapshot, Diagnostics, Audio, Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom In / Out */}
          <div className="hidden sm:flex items-center rounded-lg bg-white/10 backdrop-blur-md p-0.5 border border-white/5">
            <button
              onClick={() => handleZoom(-0.5)}
              disabled={zoomLevel <= 1}
              className="p-1.5 hover:text-emerald-400 disabled:opacity-40 disabled:hover:text-white transition-colors"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-300">{zoomLevel}x</span>
            <button
              onClick={() => handleZoom(0.5)}
              disabled={zoomLevel >= 3}
              className="p-1.5 hover:text-emerald-400 disabled:opacity-40 disabled:hover:text-white transition-colors"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Snapshot Button */}
          <button
            onClick={captureSnapshot}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all backdrop-blur-md"
            title="Ambil foto tangkapan layar (Snapshot) ber-watermark"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ambil Foto</span>
          </button>

          {/* Diagnostics toggle */}
          <button
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors backdrop-blur-md ${
              showDiagnostics ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Info Diagnostik Stream"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {/* Mute button (CCTV is video-only) */}
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-md"
            title={isMuted ? 'Suara Senyap (CCTV)' : 'Bersuara'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-md"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
