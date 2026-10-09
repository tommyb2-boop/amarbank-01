import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, X, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string; variant?: 'button' | 'badge' }> = ({
  className = '',
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running standalone, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer ${className}`}
        title="Instal aplikasi ke layar utama"
      >
        <Download className="w-3.5 h-3.5 text-blue-200" />
        <span>Instal Aplikasi</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-semibold text-xs transition-colors cursor-pointer ${className}`}
          title="Instal di iPhone / iPad"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Pasang ke Layar Utama</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold">
                  AB
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Instal di Layar Utama iPhone
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Gunakan seperti aplikasi native tanpa instal dari App Store
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 my-4">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-[11px] shrink-0">
                    1
                  </span>
                  <span>
                    Tekan tombol <strong className="inline-flex items-center gap-1 font-semibold text-blue-900"><Share className="w-3.5 h-3.5" /> Bagikan (Share)</strong> di bilah navigasi Safari.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-[11px] shrink-0">
                    2
                  </span>
                  <span>
                    Gulir ke bawah dan pilih <strong className="inline-flex items-center gap-1 font-semibold text-blue-900"><PlusSquare className="w-3.5 h-3.5" /> Tambahkan ke Layar Utama</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-[11px] shrink-0">
                    3
                  </span>
                  <span>
                    Tekan <strong>Tambah (Add)</strong> di sudut kanan atas.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Also show a general install helper button on browser/mobile if prompt hasn't fired yet
  return (
    <button
      onClick={() => {
        alert('Untuk menginstal aplikasi:\n\n1. Di Google Chrome Android: Tekan ikon titik tiga (⋮) di kanan atas, lalu pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama".\n2. Di iPhone (Safari): Tekan tombol Bagikan lalu "Tambahkan ke Layar Utama".');
      }}
      className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer ${className}`}
      title="Petunjuk instal aplikasi ke HP"
    >
      <Download className="w-3 h-3 text-slate-500" />
      <span>Pasang App</span>
    </button>
  );
};
