import React, { useState, useEffect } from 'react';
import { Customer, Loan, Payment, SystemSettings, DebtRecord, TopupRecord } from '../types';
import {
  signInWithGoogleDrive,
  signOutGoogleDrive,
  getGoogleDriveAccessToken,
  getCurrentGoogleUser,
  uploadBackupToGoogleDrive,
  listGoogleDriveBackups,
  downloadBackupFromGoogleDrive,
  deleteBackupFromGoogleDrive,
  GoogleDriveFileItem,
  GoogleDriveBackupPayload,
} from '../utils/googleDriveService';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  RefreshCw,
  X,
  FileText,
  Clock,
  ShieldCheck,
  HardDrive,
  ExternalLink,
  LogOut,
  User,
} from 'lucide-react';

interface GoogleDriveBackupModalProps {
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  debts: DebtRecord[];
  topupRecords: TopupRecord[];
  systemSettings: SystemSettings;
  onRestoreData: (payload: {
    customers: Customer[];
    loans: Loan[];
    payments: Payment[];
    debts?: DebtRecord[];
    topupRecords?: TopupRecord[];
    systemSettings?: SystemSettings;
  }) => void;
  onClose: () => void;
}

export const GoogleDriveBackupModal: React.FC<GoogleDriveBackupModalProps> = ({
  customers,
  loans,
  payments,
  debts,
  topupRecords,
  systemSettings,
  onRestoreData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'BACKUP' | 'RESTORE'>('BACKUP');
  const [googleUser, setGoogleUser] = useState<any>(getCurrentGoogleUser());
  const [accessToken, setAccessToken] = useState<string | null>(getGoogleDriveAccessToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [driveBackups, setDriveBackups] = useState<GoogleDriveFileItem[]>([]);
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<GoogleDriveFileItem | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Load existing backups when user is connected and switches to RESTORE tab
  useEffect(() => {
    if (accessToken && activeTab === 'RESTORE') {
      fetchBackups();
    }
  }, [accessToken, activeTab]);

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setFeedback(null);
    try {
      const res = await signInWithGoogleDrive();
      setGoogleUser(res.user);
      setAccessToken(res.accessToken);
      setFeedback({
        type: 'success',
        message: `Berhasil terhubung dengan Google Drive (${res.user.email || 'Akun Google'})!`,
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: `Gagal menghubungkan Google Drive: ${err?.message || 'Login dibatalkan'}`,
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await signOutGoogleDrive();
    setGoogleUser(null);
    setAccessToken(null);
    setDriveBackups([]);
    setFeedback({
      type: 'info',
      message: 'Telah terputus dari Google Drive.',
    });
  };

  const handleBackupNow = async () => {
    if (!accessToken) {
      await handleGoogleSignIn();
      return;
    }

    setIsUploading(true);
    setFeedback(null);
    try {
      const res = await uploadBackupToGoogleDrive(
        {
          customers,
          loans,
          payments,
          debts,
          topupRecords,
          systemSettings,
        },
        undefined,
        accessToken
      );

      setFeedback({
        type: 'success',
        message: `Database berhasil dicadangkan ke Google Drive! Berkas: "${res.fileName}"`,
      });
      // Refresh list if connected
      fetchBackups();
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: `Gagal mencadangkan ke Google Drive: ${err?.message || 'Periksa koneksi internet'}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const fetchBackups = async () => {
    if (!accessToken) return;
    setIsLoadingBackups(true);
    try {
      const files = await listGoogleDriveBackups(accessToken);
      setDriveBackups(files);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackupToRestore || !accessToken) return;

    setIsRestoring(true);
    setFeedback(null);
    try {
      const payload: GoogleDriveBackupPayload = await downloadBackupFromGoogleDrive(
        selectedBackupToRestore.id,
        accessToken
      );

      if (Array.isArray(payload.customers) && Array.isArray(payload.loans) && Array.isArray(payload.payments)) {
        onRestoreData({
          customers: payload.customers,
          loans: payload.loans,
          payments: payload.payments,
          debts: payload.debts || [],
          topupRecords: payload.topupRecords || [],
          systemSettings: payload.systemSettings,
        });

        setFeedback({
          type: 'success',
          message: `Database berhasil dipulihkan dari Google Drive! (${payload.customers.length} Nasabah, ${payload.loans.length} Kredit, ${payload.payments.length} Angsuran diperbarui).`,
        });
        setSelectedBackupToRestore(null);
      } else {
        throw new Error('Format file cadangan tidak valid.');
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: `Gagal memulihkan database: ${err?.message || 'Error'}`,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteFile = async (file: GoogleDriveFileItem) => {
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus cadangan "${file.name}" dari Google Drive?`);
    if (!confirmed || !accessToken) return;

    try {
      await deleteBackupFromGoogleDrive(file.id, accessToken);
      setDriveBackups((prev) => prev.filter((f) => f.id !== file.id));
      setFeedback({
        type: 'info',
        message: `Cadangan "${file.name}" telah dihapus dari Google Drive.`,
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: `Gagal menghapus file: ${err?.message}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* 1. MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Google Drive Official Colors Icon */}
            <div className="w-10 h-10 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md">
              <svg className="w-full h-full" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>Google Drive Cloud Backup</span>
              </h3>
              <p className="text-xs text-blue-200">
                Cadangkan dan pulihkan seluruh database Amar Bank dengan aman di Google Drive Anda
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. GOOGLE ACCOUNT CONNECTION STATUS */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {accessToken && googleUser ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                {googleUser.photoURL ? (
                  <img src={googleUser.photoURL} alt="" className="w-full h-full rounded-full" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 block leading-tight">
                  {googleUser.displayName || 'Akun Google Terhubung'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {googleUser.email || 'Google Drive Aktif'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900 block">Google Drive Belum Terhubung</span>
              <span className="text-[11px] text-slate-500">
                Hubungkan dengan akun Google Anda untuk mengunggah atau mengunduh cadangan database.
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 self-start sm:self-center">
            {accessToken && googleUser ? (
              <button
                onClick={handleGoogleSignOut}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Putuskan Hubungan Google Drive"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ganti Akun</span>
              </button>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                )}
                <span>Hubungkan Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. TABS SWITCHER */}
        <div className="flex border-b border-slate-200 px-4 pt-2 gap-2 bg-white">
          <button
            onClick={() => setActiveTab('BACKUP')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'BACKUP'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            <span>Cadangkan ke Drive (Backup)</span>
          </button>

          <button
            onClick={() => setActiveTab('RESTORE')}
            className={`pb-2.5 px-3 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'RESTORE'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CloudDownload className="w-4 h-4" />
            <span>Pulihkan dari Drive (Restore)</span>
          </button>
        </div>

        {/* 4. TAB CONTENTS */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-xs animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : feedback.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-blue-50 text-blue-900 border border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                {feedback.type === 'info' && <Cloud className="w-4 h-4 text-blue-600 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: BACKUP */}
          {activeTab === 'BACKUP' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-blue-700" />
                  <span>Data yang Akan Disimpan ke Google Drive:</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-bold">NASABAH</span>
                    <span className="font-extrabold text-slate-900 text-sm">{customers.length} Orang</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-bold">AKAD KREDIT</span>
                    <span className="font-extrabold text-slate-900 text-sm">{loans.length} Berkas</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-bold">PEMBAYARAN</span>
                    <span className="font-extrabold text-slate-900 text-sm">{payments.length} Mutasi</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-bold">CATATAN HUTANG</span>
                    <span className="font-extrabold text-rose-700 text-sm">{debts.length} Data</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-bold">TRANSAKSI TOPUP</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{topupRecords.length} Transaksi</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-bold">PENGATURAN & NERACA</span>
                    <span className="font-extrabold text-blue-900 text-sm">Kota {systemSettings.cityName}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">🔒 Keamanan & Privasi Data:</p>
                <p>
                  Berkas cadangan disimpan langsung pada penyimpanan Google Drive akun Anda sendiri dalam format file JSON terenkripsi standar Amar Bank. Tidak ada pihak ketiga yang dapat mengakses data selain Anda.
                </p>
              </div>

              <button
                onClick={handleBackupNow}
                disabled={isUploading}
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-900 hover:bg-blue-800 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-300" />
                    <span>Mengunggah Berkas ke Google Drive...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-5 h-5 text-cyan-300" />
                    <span>{accessToken ? 'Mulai Cadangkan ke Google Drive Sekarang' : 'Hubungkan Akun & Cadangkan ke Google Drive'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: RESTORE */}
          {activeTab === 'RESTORE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Pilih File Cadangan di Google Drive:
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Pilih file cadangan Amar Bank untuk dipulihkan ke aplikasi ini.
                  </p>
                </div>

                <button
                  onClick={fetchBackups}
                  disabled={isLoadingBackups || !accessToken}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Muat Ulang Daftar File"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Segarkan</span>
                </button>
              </div>

              {!accessToken ? (
                <div className="p-8 text-center text-slate-500 space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <Cloud className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium">
                    Silakan hubungkan akun Google Drive Anda terlebih dahulu untuk melihat daftar file cadangan.
                  </p>
                  <button
                    onClick={handleGoogleSignIn}
                    className="px-4 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs inline-flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Hubungkan Google Drive</span>
                  </button>
                </div>
              ) : isLoadingBackups ? (
                <div className="p-8 text-center text-slate-500 space-y-2 bg-slate-50 rounded-2xl">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs">Mencari file cadangan di Google Drive Anda...</p>
                </div>
              ) : driveBackups.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium">
                    Belum ada file cadangan Amar Bank di Google Drive Anda.
                  </p>
                  <button
                    onClick={() => setActiveTab('BACKUP')}
                    className="px-4 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>Buat Cadangan Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {driveBackups.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 transition-colors shadow-xs"
                    >
                      <div className="space-y-0.5 overflow-hidden">
                        <span className="font-bold text-xs text-slate-900 block truncate">
                          {file.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          {file.modifiedTime && (
                            <span>Diperbarui: {formatDateIndo(file.modifiedTime)}</span>
                          )}
                          {file.size && (
                            <span>• {(Number(file.size) / 1024).toFixed(1)} KB</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setSelectedBackupToRestore(file)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <CloudDownload className="w-3.5 h-3.5" />
                          <span>Pulihkan</span>
                        </button>

                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Cadangan ini dari Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DIALOG KONFIRMASI RESTORE (MANDATORY KONFIRMASI) */}
              {selectedBackupToRestore && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <h5 className="font-extrabold text-xs">
                        Konfirmasi Pemulihan Database (Restore)
                      </h5>
                      <p className="text-[11px] text-amber-800">
                        Apakah Anda yakin ingin memulihkan database dari berkas "{selectedBackupToRestore.name}"?
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    Tindakan ini akan menimpa data aktif saat ini dengan data yang ada di dalam berkas cadangan Google Drive yang dipilih.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedBackupToRestore(null)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRestore}
                      disabled={isRestoring}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {isRestoring ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Memulihkan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ya, Pulihkan Sekarang</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
