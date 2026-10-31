import React from 'react';
import { Download, X, Share2, Check, Camera, ExternalLink } from 'lucide-react';
import { CCTVCamera } from '../types/cctv';

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  camera: CCTVCamera | null;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  camera,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !imageUrl || !camera) return null;

  const downloadFilename = `cctv-${camera.slug}-${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy link or notify
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Tangkapan Layar CCTV (Snapshot)</h3>
              <p className="text-slate-400 text-xs">
                {camera.alias_name} • {new Date().toLocaleTimeString('id-ID')} WIB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview with Watermark included */}
        <div className="relative flex-1 bg-black overflow-auto p-2 flex items-center justify-center min-h-[300px]">
          <img
            src={imageUrl}
            alt="CCTV Snapshot"
            className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg border border-slate-800"
          />
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Format: JPEG Kualitas Tinggi (1080p dengan Timestamp Resmi Pemprov DIY)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Gambar'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Foto (JPG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
