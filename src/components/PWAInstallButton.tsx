import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, X, PlusSquare, Smartphone, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string; variant?: 'button' | 'badge' }> = ({
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed and running as standalone WebAPK, hide button
  if (isInstalled) {
    return null;
  }

  // Handle direct click
  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer ${className}`}
        title="Instal aplikasi ke perangkat Android / iOS"
      >
        <Download className="w-3.5 h-3.5 text-cyan-300 animate-bounce" />
        <span>Instal Aplikasi</span>
      </button>

      {/* Interactive Install Guide Modal for Android (WebAPK) & iOS */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-400" />
            
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* App Header */}
            <div className="flex items-center gap-3 mb-4 mt-1">
              <img
                src="/pwa-192x192.png"
                alt="Amar Bank"
                className="w-12 h-12 rounded-2xl shadow-md border border-slate-100 object-cover"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Amar Bank</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    Aplikasi Resmi
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Pasang sebagai Aplikasi (Bukan sekadar shortcut)
                </p>
              </div>
            </div>

            {/* If browser supports direct install prompt, provide one-click install button */}
            {isInstallable && (
              <div className="mb-4">
                <button
                  onClick={async () => {
                    await install();
                    setShowGuide(false);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-900/20 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Pasang Sekarang ke Perangkat</span>
                </button>
              </div>
            )}

            {/* Android Chrome Instructions */}
            <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <Smartphone className="w-4 h-4 text-blue-900" />
                <span>Cara Pasang di Google Chrome Android:</span>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-[11px] shrink-0">
                  1
                </span>
                <span>
                  Ketuk ikon <b>titik tiga (⋮)</b> di pojok kanan atas browser Google Chrome.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-[11px] shrink-0">
                  2
                </span>
                <span>
                  Pilih menu <b>"Instal aplikasi"</b> atau <b>"Install app"</b> (bukan "Tambahkan ke layar utama").
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-[11px] shrink-0">
                  3
                </span>
                <span>
                  Ketuk <b>"Instal"</b> pada jendela konfirmasi. Aplikasi Amar Bank akan terpasang di daftar aplikasi Android seperti aplikasi Play Store.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-4 px-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Mendukung mode offline, notifikasi, dan ikon mandiri tanpa bilah browser.</span>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
