import { CCTVCamera, RegencyArea } from '../types/cctv';
import rawCameras from './allJogjaCCTV.json';

export const ALL_CAMERAS: CCTVCamera[] = rawCameras as CCTVCamera[];

export const MAGUWOHARJO_CAMERAS: CCTVCamera[] = ALL_CAMERAS.filter(
  (c) => c.isMaguwo || c.slug.includes('maguwoharjo')
);

// Fallback guaranteed primary camera
export const PRIMARY_CAMERA: CCTVCamera =
  ALL_CAMERAS.find((c) => c.slug === 'halaman-stadion-maguwoharjo') ||
  MAGUWOHARJO_CAMERAS[0] ||
  ALL_CAMERAS[0];

export const REGENCY_AREAS: { id: RegencyArea; label: string; count: number }[] = [
  { id: 'Semua Wilayah', label: 'Seluruh D.I. Yogyakarta', count: ALL_CAMERAS.length },
  {
    id: 'Kota Yogyakarta',
    label: 'Kota Yogyakarta',
    count: ALL_CAMERAS.filter((c) => c.regency === 'Kota Yogyakarta').length,
  },
  {
    id: 'Kabupaten Sleman',
    label: 'Kab. Sleman',
    count: ALL_CAMERAS.filter((c) => c.regency === 'Kabupaten Sleman').length,
  },
  {
    id: 'Kabupaten Bantul',
    label: 'Kab. Bantul',
    count: ALL_CAMERAS.filter((c) => c.regency === 'Kabupaten Bantul').length,
  },
  {
    id: 'Kabupaten Gunungkidul',
    label: 'Kab. Gunungkidul',
    count: ALL_CAMERAS.filter((c) => c.regency === 'Kabupaten Gunungkidul').length,
  },
  {
    id: 'Kabupaten Kulon Progo',
    label: 'Kab. Kulon Progo',
    count: ALL_CAMERAS.filter((c) => c.regency === 'Kabupaten Kulon Progo').length,
  },
  {
    id: 'Dishub Lalu Lintas DIY',
    label: 'Dishub Lalu Lintas DIY',
    count: ALL_CAMERAS.filter((c) => c.regency === 'Dishub Lalu Lintas DIY').length,
  },
];
