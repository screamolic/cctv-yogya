import React from 'react';
import {
  MapPin,
  ExternalLink,
  Shield,
  Compass,
  Building2,
  Users,
  Car,
  AlertCircle,
  Radio,
  CheckCircle2,
  Layers,
  Landmark,
} from 'lucide-react';
import { CCTVCamera } from '../types/cctv';

interface StadionInfoProps {
  currentCamera: CCTVCamera;
}

export const StadionInfo: React.FC<StadionInfoProps> = ({ currentCamera }) => {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${currentCamera.lat},${currentCamera.lng}`;
  const officialCctvUrl = `https://cctv.jogjaprov.go.id/${currentCamera.slug}`;
  const isMaguwo = currentCamera.isMaguwo || currentCamera.slug.includes('maguwoharjo');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Detail Kamera Aktif */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Status Titik Kamera Aktif</h3>
            <p className="text-slate-400 text-xs">Informasi siaran langsung</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Nama Titik:</span>
            <span className="font-semibold text-white truncate max-w-[170px]" title={currentCamera.alias_name}>
              {currentCamera.alias_name}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Wilayah / Daerah:</span>
            <span className="text-emerald-400 font-semibold">{currentCamera.regency}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Pengelola / Instansi:</span>
            <span className="text-slate-200 font-medium truncate max-w-[170px]" title={currentCamera.group_name}>
              {currentCamera.group_name}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Koordinat GPS:</span>
            <span className="font-mono text-slate-300">
              {currentCamera.lat.toFixed(5)}, {currentCamera.lng.toFixed(5)}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Format Streaming:</span>
            <span className="font-mono text-indigo-300">HLS (M3U8) Real-Time</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <a
            href={officialCctvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>Buka di Portal CCTV Jogja Prov</span>
          </a>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span>Lihat Lokasi di Google Maps</span>
          </a>
        </div>
      </div>

      {/* Profil Wilayah / Stadion */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            {isMaguwo ? <Building2 className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">
              {isMaguwo ? 'Profil Stadion Maguwoharjo' : `Karakteristik Wilayah: ${currentCamera.regency}`}
            </h3>
            <p className="text-slate-400 text-xs">
              {isMaguwo ? 'Kandang PSS Sleman & Ikon Sleman' : 'Pusat Pemantauan D.I. Yogyakarta'}
            </p>
          </div>
        </div>

        {isMaguwo ? (
          <div className="space-y-2 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Stadion Maguwoharjo adalah stadion sepak bola berstandar internasional yang berlokasi di Maguwoharjo, Depok, Sleman. Stadion ini terkenal dengan desain modern bergaya Inggris (*English Football Style*) tanpa lintasan lari atletik.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Users className="w-3 h-3 text-indigo-400" />
                  <span>Kapasitas</span>
                </div>
                <div className="font-bold text-white text-sm mt-0.5">~31.700 Kursi</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>Markas Tim</span>
                </div>
                <div className="font-bold text-white text-sm mt-0.5">PSS Sleman</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2 text-slate-400 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Patung Elang Jawa yang megah berada di gerbang timur menjadi landmark utama dan titik kumpul suporter.
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs text-slate-300">
            <p className="leading-relaxed">
              Titik kamera ini merupakan bagian dari jaringan terpadu <strong>CCTV Jogja Istimewa</strong> di wilayah {currentCamera.regency}. Jaringan ini dikelola oleh {currentCamera.group_name} untuk pemantauan keamanan publik, ketertiban umum, dan mitigasi bencana.
            </p>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-white font-medium text-[11px]">Deskripsi Titik:</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {currentCamera.description || 'Kamera pengawas publik pemantauan 24 jam.'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2 text-slate-400 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Terkoneksi langsung dengan sistem Command Center Pemda DIY dan dinas terkait.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Akses & Panduan Pantauan Lalu Lintas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Pemantauan Lalu Lintas & Cuaca</h3>
            <p className="text-slate-400 text-xs">Akses 24/7 masyarakat luas</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-300">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-white font-medium text-[11px]">Tujuan Pemantauan:</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Membantu masyarakat, wisatawan, dan pengendara memantau kepadatan jalan, genangan air saat hujan lebat, cuaca, dan situasi terkini di Yogyakarta.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-white font-medium text-[11px]">Cakupan CCTV Wilayah:</div>
            <ul className="text-slate-400 text-[11px] list-disc list-inside space-y-0.5">
              <li>Kota Yogyakarta (Malioboro, Tugu, Titik Nol)</li>
              <li>Kabupaten Sleman (Maguwoharjo, Kaliurang, Gejayan)</li>
              <li>Bantul, Gunungkidul & Kulon Progo</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
            <Radio className="w-3.5 h-3.5 shrink-0" />
            <span>Kamera menyiarkan siaran langsung real-time 24 jam nonstop.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
