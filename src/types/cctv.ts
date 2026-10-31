export type RegencyArea =
  | 'Semua Wilayah'
  | 'Kota Yogyakarta'
  | 'Kabupaten Sleman'
  | 'Kabupaten Bantul'
  | 'Kabupaten Gunungkidul'
  | 'Kabupaten Kulon Progo'
  | 'Dishub Lalu Lintas DIY';

export interface CCTVCamera {
  id: string;
  slug: string;
  name: string;
  alias_name: string;
  description: string;
  stream_url: string;
  banner_url?: string | null;
  lat: number;
  lng: number;
  group_name: string;
  regency: string;
  category_name?: string | null;
  locationArea?: string;
  isPrimary?: boolean;
  isMaguwo?: boolean;
}

export interface StreamStats {
  status: 'connecting' | 'playing' | 'stalled' | 'error' | 'paused';
  resolution?: string;
  bufferLength?: number;
  bitrate?: number;
  latency?: number;
  fps?: number;
  droppedFrames?: number;
  lastUpdated?: string;
}

export interface CameraLiveStatus {
  status: 'checking' | 'live' | 'offline' | 'degraded';
  latencyMs?: number;
  segmentCount?: number;
  targetDuration?: number;
  mediaSequence?: number;
  lastChecked?: string;
  errorReason?: string;
}

export type ViewMode = 'single' | 'quad' | 'grid';
