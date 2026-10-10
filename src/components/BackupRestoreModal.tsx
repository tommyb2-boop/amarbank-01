import React, { useState, useEffect } from 'react';
import { Customer, Loan, Payment, SystemSettings } from '../types';
import { formatDateIndo, formatDateTimeIndo } from '../utils/formatters';
import {
  X,
  HardDrive,
  Cloud,
  Download,
  Upload,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  RefreshCw,
  FolderOpen,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { backupDatabaseJSON } from '../utils/exporter';
import {
  signInWithGoogleDrive,
  getCachedAccessToken,
  uploadBackupToDrive,
  listDriveBackups,
  downloadBackupFromDrive,
  DriveBackupFile,
  TARGET_DRIVE_FOLDER_ID,
  TARGET_DRIVE_FOLDER_URL,
} from '../utils/googleDrive';

interface BackupRestoreModalProps {
  mode: 'BACKUP' | 'RESTORE';
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  systemSettings: SystemSettings;
  onRestoreData: (data: {
    customers: Customer[];
    loans: Loan[];
    payments: Payment[];
    systemSettings?: SystemSettings;
  }) => void;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  mode: initialMode,
  customers,
  loans,
  payments,
  systemSettings,
  onRestoreData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'BACKUP' | 'RESTORE'>(initialMode);
  
  // Google Drive state
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(getCachedAccessToken());
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [selectedDriveFileId, setSelectedDriveFileId] = useState<string>('');
  const [isDriveListing, setIsDriveListing] = useState(false);

  // Custom backup note
  const [customBackupNote, setCustomBackupNote] = useState<string>('');

  // Status & Notification
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Backup configuration
  const now = new Date();
  const backupDateIso = now.toISOString();
  const backupDateFormatted = formatDateTimeIndo(backupDateIso);

  // Handle local backup download
  const handleDownloadLocal = () => {
    try {
      const finalNote = customBackupNote.trim() || `Cadangan Database Amar Bank (${backupDateFormatted})`;
      backupDatabaseJSON({
        customers,
        loans,
        payments,
        systemSettings,
        exportedAt: backupDateIso,
        version: '1.0',
        backupNote: finalNote,
      });
      setStatusMessage({
        type: 'success',
        text: `Berhasil mengunduh cadangan lokal. Berkas tersimpan dengan catatan: "${finalNote}" dan stempel tanggal: ${backupDateFormatted}`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Gagal mengunduh cadangan lokal: ${err?.message || 'Error'}`,
      });
    }
  };

  // Google Drive sign-in
  const handleGoogleConnect = async () => {
    setIsLoadingDrive(true);
    setStatusMessage(null);
    try {
      const result = await signInWithGoogleDrive();
      setGoogleToken(result.accessToken);
      setGoogleUserEmail(result.user.email || 'Akun Google Terhubung');
      setStatusMessage({
        type: 'success',
        text: `Terhubung dengan Google Drive: ${result.user.email || ''}`,
      });
      // If we are in restore tab, load drive files automatically
      if (activeTab === 'RESTORE') {
        fetchDriveBackups(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Gagal otorisasi Google Drive: ${err?.message || 'Izin ditolak'}`,
      });
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Fetch drive files from target folder
  const fetchDriveBackups = async (token: string) => {
    setIsDriveListing(true);
    try {
      const files = await listDriveBackups(token);
      setDriveBackups(files);
      if (files.length > 0) {
        setSelectedDriveFileId(files[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Gagal membaca file dari folder Google Drive: ${err?.message}`,
      });
    } finally {
      setIsDriveListing(false);
    }
  };

  // Upload to Drive folder
  const handleUploadDrive = async () => {
    if (!googleToken) {
      await handleGoogleConnect();
      return;
    }

    setIsLoadingDrive(true);
    setStatusMessage(null);
    try {
      const finalNote = customBackupNote.trim() || `Cadangan Database Amar Bank (${backupDateFormatted})`;
      const payload = {
        customers,
        loans,
        payments,
        systemSettings,
        exportedAt: backupDateIso,
        version: '1.0',
        backupNote: finalNote,
      };

      const res = await uploadBackupToDrive(googleToken, payload, finalNote);
      setStatusMessage({
        type: 'success',
        text: `Berhasil mencadangkan langsung ke Folder Google Drive! Berkas: "${res.name}" | Catatan Tanggal: ${backupDateFormatted}`,
      });
      
      // Auto refresh list
      fetchDriveBackups(googleToken);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Gagal mengunggah ke Folder Google Drive: ${err?.message}`,
      });
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Local file input handler
  const handleRestoreLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        validateAndApplyRestore(payload, `File Lokal: ${file.name}`);
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: 'Gagal memproses file JSON lokal. Format file tidak valid.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Restore from Google Drive file
  const handleRestoreFromDrive = async () => {
    if (!googleToken) {
      await handleGoogleConnect();
      return;
    }
    if (!selectedDriveFileId) {
      setStatusMessage({
        type: 'error',
        text: 'Pilih file cadangan dari folder Google Drive terlebih dahulu.',
      });
      return;
    }

    setIsLoadingDrive(true);
    setStatusMessage(null);
    try {
      const data = await downloadBackupFromDrive(googleToken, selectedDriveFileId);
      const selectedFile = driveBackups.find((f) => f.id === selectedDriveFileId);
      validateAndApplyRestore(data, `Google Drive: ${selectedFile?.name || 'File Cadangan'}`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Gagal memulihkan dari Google Drive: ${err?.message}`,
      });
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Validation & restore execution
  const validateAndApplyRestore = (payload: any, sourceName: string) => {
    if (
      !payload ||
      !Array.isArray(payload.customers) ||
      !Array.isArray(payload.loans) ||
      !Array.isArray(payload.payments)
    ) {
      setStatusMessage({
        type: 'error',
        text: 'Format data cadangan tidak sesuai! Pastikan berkas berasal dari ekspor sistem Amar Bank.',
      });
      return;
    }

    const backupDate = payload.exportedAt ? formatDateTimeIndo(payload.exportedAt) : 'Tidak tercatat';
    const noteText = payload.backupNote ? `\nCatatan Backup: "${payload.backupNote}"` : '';

    const confirmMsg = `Konfirmasi Pemulihan Database:
Sumber: ${sourceName}
Tanggal Cadangan: ${backupDate}${noteText}

Rincian Isi Cadangan:
• ${payload.customers.length} Data Nasabah
• ${payload.loans.length} Data Akad Kredit
• ${payload.payments.length} Riwayat Pembayaran Masuk

Peringatan: Seluruh data saat ini akan ditimpa dengan data cadangan ini. Lanjutkan proses restore?`;

    if (window.confirm(confirmMsg)) {
      onRestoreData(payload);
      setStatusMessage({
        type: 'success',
        text: `Database Amar Bank berhasil dipulihkan dari ${sourceName}! (Tanggal Cadangan: ${backupDate})`,
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  // Effect to load drive backups if user switches to restore and already connected
  useEffect(() => {
    if (activeTab === 'RESTORE' && googleToken && driveBackups.length === 0) {
      fetchDriveBackups(googleToken);
    }
  }, [activeTab, googleToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
        
        {/* Top Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-md shadow-blue-900/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pusat Cadangan & Pemulihan Database
              </h2>
              <p className="text-xs text-slate-500">
                Terhubung otomatis dengan Folder Google Drive & Lokal
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

        {/* Tab Selection: Backup vs Restore */}
        <div className="p-3 bg-white border-b border-slate-200 flex gap-2">
          <button
            onClick={() => {
              setActiveTab('BACKUP');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'BACKUP'
                ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. Backup Database</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('RESTORE');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'RESTORE'
                ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>2. Restore Database</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Target Folder Google Drive Banner */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <FolderOpen className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-950">
                  Folder Google Drive Utama:
                </p>
                <p className="text-[11px] text-blue-800/90 font-mono mt-0.5 break-all">
                  ID: {TARGET_DRIVE_FOLDER_ID}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Semua backup & restore cloud diarahkan langsung ke folder ini.
                </p>
              </div>
            </div>
            <a
              href={TARGET_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2.5 rounded-lg bg-blue-900 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors shrink-0"
            >
              <span>Buka</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Notification Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border border-rose-200'
                  : 'bg-blue-50 text-blue-900 border border-blue-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <span className="leading-relaxed font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: BACKUP */}
          {activeTab === 'BACKUP' && (
            <div className="space-y-4">
              
              {/* Info Card: Tanggal Cadangan & Catatan Tambahan */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Catatan Tanggal & Waktu Otomatis:
                    </p>
                    <p className="text-xs font-bold text-slate-800">
                      {backupDateFormatted}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] bg-blue-900/10 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                      {customers.length} Nasabah • {loans.length} Kredit
                    </span>
                  </div>
                </div>

                {/* Input Note Tanggal / Deskripsi Backup */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-blue-900" />
                    <span>Catatan Khusus Backup (Opsional):</span>
                  </label>
                  <input
                    type="text"
                    value={customBackupNote}
                    onChange={(e) => setCustomBackupNote(e.target.value)}
                    placeholder={`Contoh: Backup Akhir Minggu - ${backupDateFormatted}`}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Catatan dan tanggal ini akan tertanam di dalam berkas dan terbaca saat di-restore.
                  </p>
                </div>
              </div>

              {/* OPSI 1: KIRIM LANGSUNG KE FOLDER GOOGLE DRIVE */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">
                        Opsi A: Kirim Langsung ke Folder Google Drive
                      </h3>
                      {googleToken && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Terhubung</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Mengunggah berkas JSON cadangan database langsung ke folder Google Drive Anda (<code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-700">14eycL32...</code>) dengan tanggal & catatan backup.
                    </p>

                    {googleUserEmail && (
                      <p className="text-[11px] text-slate-600 mt-2 font-medium bg-slate-50 p-2 rounded-lg border border-slate-200">
                        Akun aktif: <strong className="text-slate-900">{googleUserEmail}</strong>
                      </p>
                    )}

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleUploadDrive}
                        disabled={isLoadingDrive}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                      >
                        {isLoadingDrive ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Menyimpan ke Folder Drive...</span>
                          </>
                        ) : (
                          <>
                            <Cloud className="w-4 h-4" />
                            <span>
                              {googleToken
                                ? 'Kirim Cadangan ke Folder Google Drive'
                                : 'Hubungkan & Kirim ke Folder Google Drive'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* OPSI 2: DOWNLOAD KE PERANGKAT LOKAL */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-900">
                      Opsi B: Unduh ke Perangkat Lokal (.json)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Simpan file JSON langsung ke folder Download perangkat Anda lengkap dengan stempel waktu dan catatan backup.
                    </p>
                    <button
                      onClick={handleDownloadLocal}
                      className="mt-3 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download ke Perangkat (.json)</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: RESTORE */}
          {activeTab === 'RESTORE' && (
            <div className="space-y-4">
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  <strong>Peringatan Pemulihan:</strong> Memulihkan database akan menimpa data debitur, kredit, dan pembayaran dengan data yang ada di dalam berkas cadangan terpilih.
                </p>
              </div>

              {/* OPSI 1: AMBIL DARI FOLDER GOOGLE DRIVE */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">
                        Opsi A: Ambil Berkas dari Folder Google Drive
                      </h3>
                      {googleToken && (
                        <button
                          onClick={() => fetchDriveBackups(googleToken)}
                          disabled={isDriveListing}
                          className="text-[10px] text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isDriveListing ? 'animate-spin' : ''}`} />
                          <span>Segarkan Folder</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Otomatis membaca daftar file cadangan di folder Google Drive Anda (<code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-700">14eycL32...</code>).
                    </p>

                    {!googleToken ? (
                      <button
                        onClick={handleGoogleConnect}
                        disabled={isLoadingDrive}
                        className="mt-3 w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                      >
                        {isLoadingDrive ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Cloud className="w-4 h-4" />
                        )}
                        <span>Hubungkan Google Drive & Buka Folder</span>
                      </button>
                    ) : (
                      <div className="mt-3 space-y-2.5">
                        {isDriveListing ? (
                          <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                            <span>Membaca berkas di folder Google Drive...</span>
                          </div>
                        ) : driveBackups.length === 0 ? (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                            <p className="text-xs text-slate-600 font-medium">
                              Belum ada file cadangan di folder Google Drive ini.
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Gunakan tab "1. Backup Database" untuk mengunggah cadangan pertama kali ke folder ini.
                            </p>
                          </div>
                        ) : (
                          <>
                            <label className="text-[11px] font-semibold text-slate-700 block">
                              Pilih Berkas Cadangan dari Folder ({driveBackups.length} file tersedia):
                            </label>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {driveBackups.map((file) => (
                                <div
                                  key={file.id}
                                  onClick={() => setSelectedDriveFileId(file.id)}
                                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                    selectedDriveFileId === file.id
                                      ? 'border-sky-600 bg-sky-50/70 text-sky-950 font-semibold ring-1 ring-sky-600'
                                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                                  }`}
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="truncate text-xs">{file.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-slate-500 font-normal">
                                        {formatDateTimeIndo(file.createdTime)}
                                      </span>
                                      {file.description && (
                                        <span className="text-[10px] text-sky-800 bg-sky-100/60 px-1.5 py-0.2 rounded truncate max-w-[150px]">
                                          {file.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <input
                                    type="radio"
                                    name="driveFileSelect"
                                    checked={selectedDriveFileId === file.id}
                                    onChange={() => setSelectedDriveFileId(file.id)}
                                    className="text-sky-600"
                                  />
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={handleRestoreFromDrive}
                              disabled={isLoadingDrive || !selectedDriveFileId}
                              className="w-full py-2.5 px-4 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                            >
                              {isLoadingDrive ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              <span>Pulihkan dari File Terpilih di Folder Drive</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* OPSI 2: AMBIL DARI PERANGKAT LOKAL */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-900">
                      Opsi B: Ambil Berkas dari Perangkat Lokal (.json)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Pilih berkas JSON cadangan yang tersimpan di memori HP atau laptop Anda.
                    </p>
                    
                    <label className="mt-3 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm">
                      <Upload className="w-4 h-4" />
                      <span>Pilih Berkas JSON Lokal</span>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleRestoreLocalFile}
                      />
                    </label>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
