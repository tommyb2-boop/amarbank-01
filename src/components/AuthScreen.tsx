import React, { useState } from 'react';
import { AdminUser, Customer } from '../types';
import { AmarBankLogo } from './AmarBankLogo';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Lock,
  ArrowRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { fetchLatestCustomersFromFirebase } from '../utils/firebaseSync';

interface AuthScreenProps {
  admins: AdminUser[];
  customers: Customer[];
  onAdminLogin: (admin: AdminUser) => void;
  onCustomerLogin: (customer: Customer) => void;
  onResetAdminPin?: (email: string, newPin: string) => void;
  onSyncCustomers?: (customers: Customer[]) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  admins,
  customers,
  onAdminLogin,
  onCustomerLogin,
  onSyncCustomers,
}) => {
  // Single Unified Form States
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Sync state
  const [isUpdatingCustomers, setIsUpdatingCustomers] = useState(false);

  // Feedback states
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Helper function to normalize phone numbers for comparison
  const normalizePhone = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    if (digits.startsWith('62')) {
      return '0' + digits.slice(2);
    }
    return digits;
  };

  // Unified login handler for both Admin and Customer
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const rawId = identifier.trim();
    const cleanPin = pin.trim();

    if (!rawId || !cleanPin) {
      setErrorMessage('Harap masukkan Nomor WhatsApp / ID dan PIN Anda.');
      return;
    }

    const normInputPhone = normalizePhone(rawId);
    const digitsOnly = rawId.replace(/\D/g, '');
    const lowerId = rawId.toLowerCase();

    // 1. Cek kecocokan Admin terlebih dahulu (WhatsApp / ID / Email + PIN)
    const matchedAdmin = admins.find((a) => {
      if (a.pin !== cleanPin) return false;

      const normAdminPhone = normalizePhone(a.phone);
      const adminDigits = a.phone.replace(/\D/g, '');

      return (
        (normAdminPhone && normAdminPhone === normInputPhone) ||
        (adminDigits && adminDigits === digitsOnly) ||
        (a.id && a.id.toLowerCase() === lowerId) ||
        (a.email && a.email.toLowerCase() === lowerId)
      );
    });

    if (matchedAdmin) {
      onAdminLogin(matchedAdmin);
      return;
    }

    // 2. Cek kecocokan Nasabah / Pelanggan (WhatsApp / ID + PIN)
    const matchedCustomer = customers.find((c) => {
      if (c.pin !== cleanPin) return false;

      const normCustPhone = normalizePhone(c.phone);
      const custDigits = c.phone.replace(/\D/g, '');

      return (
        (normCustPhone && normCustPhone === normInputPhone) ||
        (custDigits && custDigits === digitsOnly) ||
        (c.id && c.id.toLowerCase() === lowerId)
      );
    });

    if (matchedCustomer) {
      onCustomerLogin(matchedCustomer);
      return;
    }

    // 3. Jika tidak cocok, berikan diagnosa yang informatif
    const adminExists = admins.some((a) => {
      const normAdminPhone = normalizePhone(a.phone);
      const adminDigits = a.phone.replace(/\D/g, '');
      return (
        (normAdminPhone && normAdminPhone === normInputPhone) ||
        (adminDigits && adminDigits === digitsOnly) ||
        (a.id && a.id.toLowerCase() === lowerId) ||
        (a.email && a.email.toLowerCase() === lowerId)
      );
    });

    if (adminExists) {
      setErrorMessage('PIN Admin tidak valid. Masukkan 6 digit PIN yang benar.');
      return;
    }

    const customerExists = customers.some((c) => {
      const normCustPhone = normalizePhone(c.phone);
      const custDigits = c.phone.replace(/\D/g, '');
      return (
        (normCustPhone && normCustPhone === normInputPhone) ||
        (custDigits && custDigits === digitsOnly) ||
        (c.id && c.id.toLowerCase() === lowerId)
      );
    });

    if (customerExists) {
      setErrorMessage('PIN Nasabah tidak sesuai. Hubungi Admin jika Anda lupa PIN.');
      return;
    }

    setErrorMessage('Nomor WhatsApp atau PIN tidak terdaftar. Periksa kembali data login Anda.');
  };

  // Update data pelanggan dari Firebase jika admin mendaftarkan nasabah baru dari perangkat lain
  const handleUpdateCustomersFromFirebase = async () => {
    setIsUpdatingCustomers(true);
    clearMessages();
    try {
      const cloudCustomers = await fetchLatestCustomersFromFirebase();
      if (cloudCustomers.length > 0 && onSyncCustomers) {
        onSyncCustomers(cloudCustomers);
      }
      setSuccessMessage(
        `Data berhasil disinkronisasi dari Cloud! (${cloudCustomers.length} Nasabah terdaftar)`
      );
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Gagal memperbarui data dari Cloud. Periksa koneksi internet Anda.');
    } finally {
      setIsUpdatingCustomers(false);
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
        <div className="p-6 text-center border-b border-slate-100 bg-slate-50/70 relative">
          <div className="flex justify-center mb-3">
            <AmarBankLogo size="lg" showText={true} />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Sistem Pencatatan Kredit, Piutang & Portal Nasabah
          </p>

          <div className="mt-4 flex items-center justify-between bg-blue-50/80 border border-blue-200/70 rounded-2xl px-3 py-2 text-xs">
            <span className="text-blue-900 font-semibold flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Satu Pintu Masuk (Admin & Nasabah)</span>
            </span>
            <button
              type="button"
              onClick={handleUpdateCustomersFromFirebase}
              disabled={isUpdatingCustomers}
              title="Perbarui data dari Firebase Cloud"
              className="py-1 px-2.5 rounded-xl bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {isUpdatingCustomers ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-700" />
              ) : (
                <RefreshCw className="w-3 h-3 text-blue-700" />
              )}
              <span>Update Data</span>
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

        {/* Single Unified Login Form */}
        <div className="p-6">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="text-center mb-1">
              <h3 className="text-base font-bold text-slate-900">Masuk ke Akun</h3>
              <p className="text-xs text-slate-500">
                Gunakan nomor WhatsApp terdaftar dan PIN keamanan
              </p>
            </div>

            {/* Input WhatsApp / ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-900" />
                <span>Nomor WhatsApp / ID *</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Contoh: 081298765432 atau CUST-1001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            {/* Input PIN (6 Digit) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-900" />
                  <span>PIN Keamanan (6 Digit) *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] text-slate-500 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                >
                  {showPin ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Sembunyikan</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>Lihat PIN</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                required
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-700 focus:bg-white text-center font-mono text-lg tracking-widest text-slate-900 outline-none transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>Masuk ke Akun</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Petunjuk Akses */}
            <div className="pt-3 border-t border-slate-100 text-left space-y-2">
              <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <UserCheck className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 leading-snug">
                  <span className="font-semibold text-slate-900">Admin:</span> Masukkan No. WhatsApp Admin & PIN Admin (Awal: <span className="font-mono font-semibold text-blue-900">081298765432</span> / <span className="font-mono font-semibold text-blue-900">987654</span>)
                </div>
              </div>
              <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                Nasabah menggunakan No. WhatsApp & PIN yang didaftarkan pada akad pembiayaan.
              </div>
            </div>
          </form>
        </div>

        {/* Footer Notice: 'The Update' */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            The Update
          </p>
        </div>
      </div>
    </div>
  );
};
