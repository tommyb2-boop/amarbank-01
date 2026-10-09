import React, { useState } from 'react';
import { AdminUser, Customer } from '../types';
import { AmarBankLogo } from './AmarBankLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { generateOTP } from '../utils/formatters';
import { Lock, Mail, KeyRound, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface AuthScreenProps {
  admins: AdminUser[];
  customers: Customer[];
  onAdminLogin: (admin: AdminUser) => void;
  onCustomerLogin: (customer: Customer) => void;
  onResetAdminPin: (email: string, newPin: string) => void;
}

type PortalMode = 'ADMIN' | 'CUSTOMER';
type AdminAuthStep = 'LOGIN' | 'FORGOT_STEP_1' | 'FORGOT_STEP_2';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  admins,
  customers,
  onAdminLogin,
  onCustomerLogin,
  onResetAdminPin,
}) => {
  const [portalMode, setPortalMode] = useState<PortalMode>('ADMIN');
  const [adminStep, setAdminStep] = useState<AdminAuthStep>('LOGIN');

  // Admin login states
  const [adminPin, setAdminPin] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Admin Forgot states
  const [forgotEmail, setForgotEmail] = useState('dicoba.ngetes@gmail.com');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [otpSentNotification, setOtpSentNotification] = useState<string | null>(null);

  // Customer login states
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [customerPin, setCustomerPin] = useState('');

  // Feedback states
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 1. Handle Admin Login
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const pinToMatch = adminPin.trim();
    const admin = admins.find(
      (a) =>
        a.pin === pinToMatch ||
        (adminEmail && a.email.toLowerCase() === adminEmail.toLowerCase().trim() && a.pin === pinToMatch)
    );

    if (admin) {
      onAdminLogin(admin);
    } else {
      setErrorMessage('PIN Admin tidak valid. Masukkan PIN yang benar atau gunakan fitur Lupa Password.');
    }
  };

  // 2. Handle Forgot Step 1 (Request OTP via Email)
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const targetEmail = forgotEmail.trim().toLowerCase();
    const admin = admins.find((a) => a.email.toLowerCase() === targetEmail);

    if (!admin) {
      setErrorMessage(`Email "${targetEmail}" tidak ditemukan dalam daftar admin. Email pemulihan awal: dicoba.ngetes@gmail.com`);
      return;
    }

    const otp = generateOTP();
    setGeneratedOtp(otp);
    setOtpSentNotification(`Kode verifikasi OTP telah dikirim ke: ${targetEmail}`);
    setSuccessMessage(`Simulasi Email: Kode verifikasi OTP Anda adalah ${otp}. Berlaku 10 menit.`);
    setAdminStep('FORGOT_STEP_2');
  };

  // 3. Handle Forgot Step 2 (Verify OTP & Reset PIN)
  const handleVerifyOtpAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (inputOtp.trim() !== generatedOtp.trim()) {
      setErrorMessage('Kode OTP verifikasi salah. Harap periksa kembali.');
      return;
    }

    if (newPin.length < 6) {
      setErrorMessage('PIN baru minimal harus 6 digit angka.');
      return;
    }

    if (newPin !== newPinConfirm) {
      setErrorMessage('Konfirmasi PIN baru tidak sesuai.');
      return;
    }

    onResetAdminPin(forgotEmail.trim().toLowerCase(), newPin.trim());
    setSuccessMessage('PIN Admin berhasil diperbarui! Silakan login dengan PIN baru.');
    setAdminStep('LOGIN');
    setAdminPin(newPin);
    setOtpSentNotification(null);
  };

  // 4. Handle Customer Login (Clean & Secure - Zero Leakage)
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const identifier = customerIdentifier.trim();
    const pin = customerPin.trim();

    if (!identifier || !pin) {
      setErrorMessage('Harap masukkan ID Pelanggan / No. HP dan PIN Anda.');
      return;
    }

    const customer = customers.find(
      (c) =>
        (c.id.toLowerCase() === identifier.toLowerCase() ||
          c.phone.replace(/\D/g, '') === identifier.replace(/\D/g, '')) &&
        c.pin === pin
    );

    if (customer) {
      onCustomerLogin(customer);
    } else {
      setErrorMessage('ID Pelanggan / No. HP atau PIN tidak sesuai. Hubungi Admin jika Anda lupa PIN.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-700/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating PWA Install Bar */}
      <div className="absolute top-4 right-4 z-20">
        <PWAInstallButton />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10 transition-all duration-300">
        
        {/* Top Brand Banner */}
        <div className="p-6 text-center border-b border-slate-100 bg-slate-50/70">
          <div className="flex justify-center mb-3">
            <AmarBankLogo size="lg" showText={true} />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Sistem Pencatatan Kredit, Piutang & Manajemen Angsuran
          </p>

          {/* Dual Portal Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-2xl mt-5">
            <button
              type="button"
              onClick={() => {
                setPortalMode('ADMIN');
                setAdminStep('LOGIN');
                clearMessages();
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                portalMode === 'ADMIN'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Portal Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalMode('CUSTOMER');
                clearMessages();
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                portalMode === 'CUSTOMER'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Portal Pelanggan
            </button>
          </div>
        </div>

        {/* Global Feedback Notifications */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* A. PORTAL ADMIN VIEW */}
        {/* ============================================================ */}
        {portalMode === 'ADMIN' && (
          <div className="p-6">
            
            {/* 1. ADMIN LOGIN */}
            {adminStep === 'LOGIN' && (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="text-center mb-1">
                  <h3 className="text-base font-bold text-slate-900">Masuk Sebagai Pengelola</h3>
                  <p className="text-xs text-slate-500">Masukkan 6-digit PIN keamanan Admin</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-900" />
                    <span>PIN Akses Admin</span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    required
                    placeholder="Masukkan 6 Digit PIN (Default: 987654)"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-center font-mono text-lg tracking-widest text-slate-900 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 text-center">
                    PIN default awal: <span className="font-mono font-semibold text-slate-700">987654</span>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Buka Akses Admin</span>
                </button>

                {/* Lupa Password Only (Daftar Pertama Kali dihapus sesuai instruksi) */}
                <div className="pt-2 text-center text-xs text-slate-600">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminStep('FORGOT_STEP_1');
                      clearMessages();
                    }}
                    className="hover:text-blue-900 underline font-semibold cursor-pointer text-blue-900"
                  >
                    Lupa Password? Reset via Email
                  </button>
                </div>
              </form>
            )}

            {/* 2. LUPA PASSWORD - STEP 1 (INPUT EMAIL) */}
            {adminStep === 'FORGOT_STEP_1' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="text-center mb-1">
                  <h3 className="text-base font-bold text-slate-900">Verifikasi Email Pemulihan</h3>
                  <p className="text-xs text-slate-500">
                    Langkah 1: Masukkan email pemulihan untuk menerima 6-digit kode OTP
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-900" />
                    <span>Email Pemulihan Terdaftar</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Contoh: dicoba.ngetes@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-700 font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Email pemulihan awal: <span className="font-mono text-blue-900 font-semibold">dicoba.ngetes@gmail.com</span>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Kirim Kode Verifikasi (OTP)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminStep('LOGIN');
                      clearMessages();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Batal & Kembali ke Login
                  </button>
                </div>
              </form>
            )}

            {/* 3. LUPA PASSWORD - STEP 2 (INPUT OTP + NEW PIN) */}
            {adminStep === 'FORGOT_STEP_2' && (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-3.5">
                <div className="text-center mb-1">
                  <h3 className="text-base font-bold text-slate-900">Masukkan OTP & Buat PIN Baru</h3>
                  <p className="text-xs text-slate-500">
                    Langkah 2: Verifikasi 6-digit OTP yang dikirimkan ke email
                  </p>
                </div>

                {otpSentNotification && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-[11px] flex items-center justify-between">
                    <span>{otpSentNotification}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newCode = generateOTP();
                        setGeneratedOtp(newCode);
                        setSuccessMessage(`Simulasi Email: Kode OTP baru Anda adalah ${newCode}`);
                      }}
                      className="text-blue-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Kirim Ulang
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode OTP 6-Digit *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Masukkan 6 Digit OTP"
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-center text-base tracking-widest text-slate-900 outline-none focus:border-blue-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PIN Baru (6 Digit) *
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="PIN Baru"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-center text-xs tracking-widest text-slate-900 outline-none focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Konfirmasi PIN Baru *
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="Ulangi PIN"
                      value={newPinConfirm}
                      onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-center text-xs tracking-widest text-slate-900 outline-none focus:border-blue-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer"
                >
                  Reset PIN & Simpan
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminStep('LOGIN');
                      clearMessages();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* ============================================================ */}
        {/* B. PORTAL PELANGGAN / NASABAH (BERSIH & ZERO-LEAKAGE) */}
        {/* ============================================================ */}
        {portalMode === 'CUSTOMER' && (
          <div className="p-6">
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-11 h-11 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-blue-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Portal Mandiri Nasabah</h3>
                <p className="text-xs text-slate-500">
                  Akses aman & terisolasi untuk cek tagihan pribadi dan unduh kwitansi
                </p>
              </div>

              {/* ID Pelanggan / No. HP */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID Pelanggan / No. WhatsApp Terdaftar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: CUST-1001 atau 081234567890"
                  value={customerIdentifier}
                  onChange={(e) => setCustomerIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-semibold text-slate-900 outline-none transition-all"
                />
              </div>

              {/* PIN Pelanggan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-900" />
                  <span>PIN Akses Nasabah *</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="Masukkan PIN Anda"
                  value={customerPin}
                  onChange={(e) => setCustomerPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-center font-mono text-lg tracking-widest text-slate-900 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Masuk ke Akun Saya</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-[11px] text-slate-500 leading-relaxed">
                Belum memiliki ID atau lupa PIN? Silakan hubungi Customer Service Amar Bank melalui WhatsApp kantor cabang.
              </div>
            </form>
          </div>
        )}

        {/* Footer Notice: Replaced with 'The Update' as explicitly instructed */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            The Update
          </p>
        </div>

      </div>
    </div>
  );
};
