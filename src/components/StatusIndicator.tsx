import React from 'react';
import { CameraLiveStatus } from '../types/cctv';
import { Radio, AlertCircle, RefreshCw, Zap, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

interface StatusIndicatorProps {
  statusData?: CameraLiveStatus;
  size?: 'sm' | 'md';
  showDetails?: boolean;
  onRefresh?: (e: React.MouseEvent) => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  statusData,
  size = 'sm',
  showDetails = false,
  onRefresh,
}) => {
  const currentStatus = statusData?.status || 'checking';

  if (currentStatus === 'checking') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 backdrop-blur-md ${
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
        <span className="font-medium">Memeriksa...</span>
      </div>
    );
  }

  if (currentStatus === 'live') {
    const latency = statusData?.latencyMs;
    const latencyColor =
      !latency || latency < 300
        ? 'text-emerald-400'
        : latency < 1000
        ? 'text-amber-400'
        : 'text-orange-400';

    return (
      <div className="inline-flex items-center gap-1.5">
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 backdrop-blur-md shadow-sm ${
            size === 'sm' ? 'text-[10px]' : 'text-xs'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-bold tracking-wide">LIVE</span>

          {latency !== undefined && (
            <>
              <span className="text-emerald-500/40">•</span>
              <span className={`font-mono font-medium ${latencyColor}`}>{latency}ms</span>
            </>
          )}

          {showDetails && statusData?.segmentCount !== undefined && (
            <>
              <span className="text-emerald-500/40">•</span>
              <span className="text-slate-300 font-mono text-[9px]">{statusData.segmentCount} seg</span>
            </>
          )}
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Cek status stream ulang"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  if (currentStatus === 'degraded') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 backdrop-blur-md ${
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span className="font-semibold">LAMBAT</span>
        {statusData?.latencyMs && (
          <span className="font-mono text-[9px] text-amber-400">{statusData.latencyMs}ms</span>
        )}
      </div>
    );
  }

  // Offline
  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 backdrop-blur-md ${
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        }`}
        title={statusData?.errorReason || 'Kamera offline'}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span className="font-bold">OFFLINE</span>
        {statusData?.latencyMs && (
          <span className="font-mono text-[9px] text-slate-400">{statusData.latencyMs}ms</span>
        )}
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          title="Coba hubungkan ulang"
          className="p-1 rounded-md text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
