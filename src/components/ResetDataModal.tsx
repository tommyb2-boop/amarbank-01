import React, { useState } from 'react';
import { generateOTP } from '../utils/formatters';
import { Trash2, X, AlertTriangle, ShieldAlert, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';

interface ResetDataModalProps {
  adminEmail: string;
  onConfirmReset: () => void;
  onClose: () => void;
}

export const ResetDataModal: React.FC<ResetDataModalProps> = ({
  adminEmail,
  onConfirmReset,
  onClose,
}) => {
  const [step, setStep] = useState<'CONFIRM_PROMPT' | 'OTP_VERIFY'>('CONFIRM_PROMPT');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRequestOtp = () => {
    setErrorMsg('');
    const otp = generateOTP();
    setGeneratedOtp(otp);
    setOtpNotice(`Kode verifikasi khusus penghapusan data telah dikirim ke: ${adminEmail}`);
    setStep('OTP_VERIFY');
  };

  const handleVerifyAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (inputOtp.trim() !== generatedOtp.trim()) {
      setErrorMsg('Kode khusus verifikasi salah. Harap periksa kembali email Anda.');
      return;
    }

    onConfirmReset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden my-4">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-rose-100 bg-rose-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-950">
                Reset Semua Data (Factory Reset)
              </h2>
              <p className="text-xs text-rose-700">
                Pembersihan total data nasabah & piutang
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'CONFIRM_PROMPT' ? (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Apakah Anda Yakin Ingin Mengosongkan Data?
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  ⚠️ Tindakan ini akan <strong>menghapus bersih</strong> seluruh nasabah, akad kredit, riwayat pembayaran angsuran, serta notifikasi agar aplikasi seperti baru tanpa debitur satupun.<br /><br />
                  🔒 <strong>Akun Admin & Pengaturan Sistem Anda tetap aman tersimpan.</strong>
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Kirim Kode Verifikasi ke Email Admin</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-900">
                  Verifikasi Kode Khusus Email
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan 6-digit kode OTP yang dikirimkan ke <strong className="text-slate-800">{adminEmail}</strong>
                </p>
              </div>

              {otpNotice && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs space-y-1">
                  <p className="font-semibold">{otpNotice}</p>
                  <p className="text-[11px] font-mono text-blue-700">
                    Simulasi Email: Kode OTP Khusus Anda adalah <strong>{generatedOtp}</strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Masukkan Kode 6-Digit OTP *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="6 Digit Kode"
                  value={inputOtp}
                  onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-xl border border-rose-300 focus:border-rose-600 text-center font-mono text-lg font-bold tracking-widest text-slate-900 outline-none"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Konfirmasi & Hapus Semua Data Sekarang</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = generateOTP();
                      setGeneratedOtp(newCode);
                      setOtpNotice(`Kode baru dikirim: ${newCode}`);
                    }}
                    className="text-blue-900 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Kirim Ulang Kode</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
