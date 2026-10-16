import React, { useState, useMemo, useRef } from 'react';
import { AdminUser, Customer, Loan, Payment, NotificationItem, LoanStatus, SystemSettings, DebtRecord, TopupRecord, DebtInstallment } from '../types';
import { formatRupiah, formatDateIndo, formatDateTimeIndo, createWhatsAppLink, openWhatsApp } from '../utils/formatters';
import { AmarBankLogo } from './AmarBankLogo';
import { CustomerModal } from './CustomerModal';
import { LoanModal } from './LoanModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { ReportModal } from './ReportModal';
import { NotificationModal } from './NotificationModal';
import { AdminProfileSettingsModal } from './AdminProfileSettingsModal';
import { ResetDataModal } from './ResetDataModal';
import { LoanReceiptModal } from './LoanReceiptModal';
import { PWAInstallButton } from './PWAInstallButton';
import { NeracaKeuanganView } from './NeracaKeuanganView';
import { HutangManagementView } from './HutangManagementView';
import { TopupManagementView } from './TopupManagementView';
import { GoogleDriveBackupModal } from './GoogleDriveBackupModal';
import { downloadSpreadsheet, openEmailBackup, backupDatabaseJSON } from '../utils/exporter';
import { backupDatabaseToFirebase, fetchLatestFromFirebase } from '../utils/firebaseSync';
import {
  Users,
  CreditCard,
  Banknote,
  Plus,
  Search,
  Bell,
  LogOut,
  MessageCircle,
  FileText,
  AlertTriangle,
  Receipt,
  Download,
  Upload,
  Mail,
  Home,
  Settings,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  CircleUserRound,
  Cloud,
  CloudUpload,
  RefreshCw,
  Loader2,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Pencil,
  Eye,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  Scale,
  Smartphone,
} from 'lucide-react';

interface AdminPortalProps {
  currentAdmin: AdminUser;
  systemSettings: SystemSettings;
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  notifications: NotificationItem[];
  debts: DebtRecord[];
  topupRecords: TopupRecord[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onAddLoan: (loan: Loan) => void;
  onRecordPayment: (payment: Payment, updatedLoan: Loan) => void;
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  onClearAllNotifications: () => void;
  onAddDebt: (debt: DebtRecord) => void;
  onUpdateDebt: (debt: DebtRecord) => void;
  onDeleteDebt: (debtId: string) => void;
  onAddDebtPayment: (debtId: string, installment: DebtInstallment) => void;
  onAddTopup: (record: TopupRecord) => void;
  onUpdateTopup: (record: TopupRecord) => void;
  onDeleteTopup: (id: string) => void;
  onUpdateAdmin: (updatedAdmin: AdminUser) => void;
  onUpdateSystemSettings: (updatedSettings: SystemSettings) => void;
  onResetAllData: () => void;
  onRestoreData: (backupPayload: {
    customers: Customer[];
    loans: Loan[];
    payments: Payment[];
    debts?: DebtRecord[];
    topupRecords?: TopupRecord[];
    systemSettings?: SystemSettings;
  }) => void;
  onLogout: () => void;
}

export type ViewType = 'NERACA' | 'KREDIT' | 'HUTANG' | 'TOPUP' | 'ADMIN';

interface CustomerSummary {
  totalPiutang: number;
  totalTerbayar: number;
  totalSisaPiutang: number;
  activeLoansCount: number;
  customerStatus: 'LANCAR' | 'MENUNGGAK' | 'PERHATIAN' | 'LUNAS' | 'BEBAS_TAGIHAN';
  customerLoans: Loan[];
  customerPayments: Payment[];
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentAdmin,
  systemSettings,
  customers,
  loans,
  payments,
  notifications,
  debts,
  topupRecords,
  onAddCustomer,
  onUpdateCustomer,
  onAddLoan,
  onRecordPayment,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  onAddDebtPayment,
  onAddTopup,
  onUpdateTopup,
  onDeleteTopup,
  onUpdateAdmin,
  onUpdateSystemSettings,
  onResetAllData,
  onRestoreData,
  onLogout,
}) => {
  // Ketika admin berhasil login -> Muncul jendela "Neraca Keuangan" (Default view)
  const [activeView, setActiveView] = useState<ViewType>('NERACA');

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);
  const [isUploadingToFirebase, setIsUploadingToFirebase] = useState(false);
  const [isUpdatingFromFirebase, setIsUpdatingFromFirebase] = useState(false);
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [firebaseStatusInfo, setFirebaseStatusInfo] = useState<{
    status: 'connected' | 'idle' | 'error';
    lastExport?: string;
    customersCount?: number;
    loansCount?: number;
    message?: string;
  }>({ status: 'idle' });
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [newlyCreatedLoanReceipt, setNewlyCreatedLoanReceipt] = useState<Loan | null>(null);
  const [preselectedCustomerId, setPreselectedCustomerId] = useState<string | undefined>(undefined);
  const [preselectedLoanId, setPreselectedLoanId] = useState<string | undefined>(undefined);

  // Expanded customers map for showing loan & payment details
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});

  // Hidden File Input Ref for Restore Database from local JSON file
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LANCAR' | 'MENUNGGAK' | 'LUNAS'>('ALL');

  // Unread notifications count
  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  // Toggle expand customer
  const toggleExpandCustomer = (customerId: string) => {
    setExpandedCustomers((prev) => ({
      ...prev,
      [customerId]: !prev[customerId],
    }));
  };

  // Global Financial Statistics
  const financialStats = useMemo(() => {
    const totalPiutang = loans.reduce((acc, l) => acc + l.totalBill, 0);
    const totalTerkumpul = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalSisaPiutang = loans.reduce((acc, l) => acc + l.remainingBalance, 0);
    const activeLoansCount = loans.filter((l) => l.status !== 'LUNAS').length;
    const overdueCount = loans.filter((l) => l.status === 'MENUNGGAK').length;
    const attentionCount = loans.filter((l) => l.status === 'PERHATIAN').length;

    return {
      totalPiutang,
      totalTerkumpul,
      totalSisaPiutang,
      activeLoansCount,
      overdueCount,
      attentionCount,
    };
  }, [loans, payments]);

  // Per-customer statistics calculator
  const customerSummaries = useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    customers.forEach((c) => {
      const cLoans = loans.filter((l) => l.customerId === c.id);
      const cPayments = payments.filter((p) => p.customerId === c.id);
      const totalPiutang = cLoans.reduce((acc, l) => acc + l.totalBill, 0);
      const totalTerbayar = cLoans.reduce((acc, l) => acc + l.totalPaid, 0);
      const totalSisaPiutang = cLoans.reduce((acc, l) => acc + l.remainingBalance, 0);
      const activeLoans = cLoans.filter((l) => l.status !== 'LUNAS');

      let customerStatus: CustomerSummary['customerStatus'] = 'BEBAS_TAGIHAN';
      if (cLoans.length === 0) {
        customerStatus = 'BEBAS_TAGIHAN';
      } else if (cLoans.some((l) => l.status === 'MENUNGGAK')) {
        customerStatus = 'MENUNGGAK';
      } else if (cLoans.some((l) => l.status === 'PERHATIAN')) {
        customerStatus = 'PERHATIAN';
      } else if (activeLoans.length > 0) {
        customerStatus = 'LANCAR';
      } else {
        customerStatus = 'LUNAS';
      }

      map.set(c.id, {
        totalPiutang,
        totalTerbayar,
        totalSisaPiutang,
        activeLoansCount: activeLoans.length,
        customerStatus,
        customerLoans: cLoans,
        customerPayments: cPayments,
      });
    });

    return map;
  }, [customers, loans, payments]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      const summary = customerSummaries.get(c.id);
      const matchesSearch =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'LANCAR') return summary?.customerStatus === 'LANCAR';
      if (statusFilter === 'MENUNGGAK')
        return summary?.customerStatus === 'MENUNGGAK' || summary?.customerStatus === 'PERHATIAN';
      if (statusFilter === 'LUNAS')
        return summary?.customerStatus === 'LUNAS' || summary?.customerStatus === 'BEBAS_TAGIHAN';

      return true;
    });
  }, [customers, searchQuery, statusFilter, customerSummaries]);

  // 1. Langsung Backup ke Perangkat Lokal (.json)
  const handleDirectBackupLocal = () => {
    try {
      const now = new Date();
      const backupDateFormatted = formatDateIndo(now.toISOString());
      backupDatabaseJSON({
        customers,
        loans,
        payments,
        debts,
        topupRecords,
        systemSettings,
        exportedAt: now.toISOString(),
        version: '2.1-amar-neraca',
        backupNote: `Cadangan Offline Amar Bank (Neraca, Hutang & Topup) - ${backupDateFormatted}`,
      });
      setSyncFeedback({
        type: 'success',
        message: `Database berhasil diunduh ke file .json lokal! Simpan file ini di penyimpanan aman Anda.`,
      });
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: `Gagal mengunduh cadangan lokal: ${err?.message || 'Error'}`,
      });
    }
  };

  // 2. Langsung Restore Database dari File Lokal (.json)
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        if (Array.isArray(payload.customers) && Array.isArray(payload.loans) && Array.isArray(payload.payments)) {
          onRestoreData(payload);
          setSyncFeedback({
            type: 'success',
            message: `Database berhasil dipulihkan dari berkas lokal "${file.name}"! (${payload.customers.length} Nasabah, ${payload.loans.length} Akad, ${payload.payments.length} Angsuran)`,
          });
          setTimeout(() => setSyncFeedback(null), 6000);
        } else {
          setSyncFeedback({
            type: 'error',
            message: 'Format file JSON tidak valid. Pastikan file adalah hasil cadangan database Amar Bank.',
          });
        }
      } catch (err: any) {
        setSyncFeedback({
          type: 'error',
          message: `Gagal membaca file JSON cadangan: ${err?.message || 'Format tidak sesuai'}`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 3. Tombol UPLOAD: Mengirim seluruh database aktif ke Firebase Firestore
  const handleUploadToFirebase = async () => {
    setIsUploadingToFirebase(true);
    setSyncFeedback(null);
    try {
      const now = new Date();
      const dateFormatted = formatDateIndo(now.toISOString());
      const note = `Backup Unggahan Admin Amar Bank (${dateFormatted})`;

      const result = await backupDatabaseToFirebase(
        {
          customers,
          loans,
          payments,
          debts,
          topupRecords,
          systemSettings,
          admins: [currentAdmin],
        },
        note,
        currentAdmin.fullName || 'Admin Amar Bank'
      );

      onRestoreData({
        customers,
        loans,
        payments,
        debts,
        topupRecords,
        systemSettings,
      });

      setSyncFeedback({
        type: 'success',
        message: `Berhasil Upload ke Firebase Cloud! Seluruh data Neraca, Hutang, Topup & Piutang telah tersinkronisasi. (${formatDateIndo(result.timestamp)})`,
      });
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      console.error(err);
      setSyncFeedback({
        type: 'error',
        message: `Gagal upload ke Firebase: ${err?.message || 'Periksa koneksi internet'}`,
      });
    } finally {
      setIsUploadingToFirebase(false);
    }
  };

  // 4. Tombol UPDATE: Mendownload data terbaru dari Firebase Firestore
  const handleUpdateFromFirebase = async () => {
    setIsUpdatingFromFirebase(true);
    setSyncFeedback(null);
    try {
      const cloudData = await fetchLatestFromFirebase();
      if (!cloudData) {
        setSyncFeedback({
          type: 'info',
          message: 'Belum ada data cadangan yang tersimpan di Firebase Cloud.',
        });
        return;
      }

      onRestoreData({
        customers: cloudData.customers || [],
        loans: cloudData.loans || [],
        payments: cloudData.payments || [],
        debts: cloudData.debts || [],
        topupRecords: cloudData.topupRecords || [],
        systemSettings: cloudData.systemSettings,
      });

      setSyncFeedback({
        type: 'success',
        message: `Berhasil Update data dari Firebase Cloud! (${cloudData.customers?.length || 0} Nasabah, ${cloudData.loans?.length || 0} Kredit, ${cloudData.debts?.length || 0} Hutang, ${cloudData.topupRecords?.length || 0} Topup)`,
      });
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      console.error(err);
      setSyncFeedback({
        type: 'error',
        message: `Gagal update dari Firebase: ${err?.message || 'Periksa koneksi internet'}`,
      });
    } finally {
      setIsUpdatingFromFirebase(false);
    }
  };

  // 5. Uji Cek Koneksi Langsung ke Firebase Firestore
  const handleTestFirebaseConnection = async () => {
    setIsTestingFirebase(true);
    try {
      const cloudData = await fetchLatestFromFirebase();
      if (cloudData) {
        setFirebaseStatusInfo({
          status: 'connected',
          lastExport: cloudData.exportedAt,
          customersCount: cloudData.customers?.length || 0,
          loansCount: cloudData.loans?.length || 0,
          message: 'Firebase Firestore Aktif & Terhubung ke Proyek: gen-lang-client-0985161510',
        });
        setSyncFeedback({
          type: 'success',
          message: `Firebase Terhubung! Database di cloud memiliki ${cloudData.customers?.length || 0} Nasabah & ${cloudData.loans?.length || 0} Pinjaman.`,
        });
      } else {
        setFirebaseStatusInfo({
          status: 'connected',
          message: 'Koneksi Firestore Berhasil terhubung ke proyek gen-lang-client-0985161510 (Dokumen cloud belum diunggah, silakan klik tombol Upload).',
        });
        setSyncFeedback({
          type: 'info',
          message: 'Koneksi Firestore Berhasil terhubung ke gen-lang-client-0985161510!',
        });
      }
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      setFirebaseStatusInfo({
        status: 'error',
        message: err?.message || 'Gagal terhubung ke Firebase Firestore',
      });
      setSyncFeedback({
        type: 'error',
        message: `Gagal uji koneksi Firebase: ${err?.message || 'Periksa koneksi'}`,
      });
    } finally {
      setIsTestingFirebase(false);
    }
  };

  // Aksi Cepat Bayar untuk Nasabah Tertentu
  const handleQuickPay = (customer: Customer, summary: CustomerSummary) => {
    const unpaidLoan = summary.customerLoans.find((l) => l.status !== 'LUNAS');
    if (unpaidLoan) {
      setPreselectedLoanId(unpaidLoan.id);
      setIsPaymentModalOpen(true);
    } else if (summary.customerLoans.length > 0) {
      setPreselectedLoanId(summary.customerLoans[0].id);
      setIsPaymentModalOpen(true);
    } else {
      setSyncFeedback({
        type: 'info',
        message: `Nasabah "${customer.fullName}" belum memiliki akad pinjaman. Silakan buat akad kredit terlebih dahulu.`,
      });
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Aksi Cepat Tambah Akad untuk Nasabah Tertentu
  const handleQuickAddLoan = (customer: Customer) => {
    setPreselectedCustomerId(customer.id);
    setIsLoanModalOpen(true);
  };

  // Aksi Kirim Tagihan WhatsApp
  const handleWhatsAppBilling = (customer: Customer, summary: CustomerSummary) => {
    const unpaidLoan = summary.customerLoans.find((l) => l.status !== 'LUNAS');
    const todayStr = formatDateIndo(new Date().toISOString());
    const message = `Halo Bapak/Ibu ${customer.fullName},

Kami dari *Amar Bank* (${systemSettings.cityName}) ingin menyampaikan informasi status pembiayaan Anda per tanggal ${todayStr}:
- ID Nasabah    : *${customer.id}*
- Total Piutang : *${formatRupiah(summary.totalPiutang)}*
- Sudah Dibayar : *${formatRupiah(summary.totalTerbayar)}*
- Sisa Piutang  : *${formatRupiah(summary.totalSisaPiutang)}*
- Status Kredit : *${summary.customerStatus}*${
      unpaidLoan
        ? `\n- Tagihan Terdekat: *${formatRupiah(unpaidLoan.installmentPerPeriod)}* (Jatuh Tempo: *${formatDateIndo(unpaidLoan.nextDueDate)}*)`
        : ''
    }

Mohon konfirmasi jika ada yang perlu dikoordinasikan.
Terima kasih.`;

    openWhatsApp(customer.phone, message);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-28 text-slate-800">
      {/* Hidden File Input for Database Restore */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleRestoreFile}
      />

      {/* 1. TOP MOBILE & DESKTOP APP BAR */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <AmarBankLogo size="sm" showText={true} />

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Tombol UPLOAD (Kirim Data ke Firebase) */}
            <button
              onClick={handleUploadToFirebase}
              disabled={isUploadingToFirebase || isUpdatingFromFirebase}
              title="Kirim (Upload) seluruh database aktif ke Firebase Cloud"
              className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {isUploadingToFirebase ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span className="hidden xs:inline sm:inline">Upload</span>
            </button>

            {/* Tombol UPDATE (Download dari Firebase memperbaharui data aplikasi) */}
            <button
              onClick={handleUpdateFromFirebase}
              disabled={isUploadingToFirebase || isUpdatingFromFirebase}
              title="Download data terbaru dari Firebase Cloud untuk memperbaharui aplikasi"
              className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {isUpdatingFromFirebase ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
              )}
              <span className="hidden xs:inline sm:inline">Update</span>
            </button>

            {/* Tombol Google Drive (Backup & Restore ke Google Drive) */}
            <button
              onClick={() => setIsGoogleDriveModalOpen(true)}
              title="Cadangkan atau Pulihkan Database dengan Google Drive"
              className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 87.3 78">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span className="hidden xs:inline sm:inline">Drive</span>
            </button>

            {/* Tombol Cetak PDF di Atas Jendela Admin */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              title="Buka & Cetak Laporan PDF"
              className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden xs:inline sm:inline">Cetak PDF</span>
            </button>

            {/* Notification Bell with Badge */}
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Notifikasi & Jatuh Tempo"
            >
              <Bell className="w-4 h-4 text-slate-800" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Admin Profile & Logout */}
            <div className="flex items-center pl-1 sm:pl-2 border-l border-slate-200 gap-1 sm:gap-2">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {currentAdmin.fullName}
                </span>
                <span className="text-[10px] text-slate-400 block">Kota {systemSettings.cityName}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                title="Keluar dari Portal Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Realtime Feedback Banner (Upload / Update / Restore) */}
        {syncFeedback && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-xs transition-all ${
              syncFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : syncFeedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-900 border border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {syncFeedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
              {syncFeedback.type === 'info' && <Cloud className="w-4 h-4 text-blue-600 shrink-0" />}
              <span>{syncFeedback.message}</span>
            </div>
            <button
              onClick={() => setSyncFeedback(null)}
              className="text-slate-400 hover:text-slate-700 text-xs px-2 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAMPILAN 1: NERACA KEUANGAN (DEFAULT SETELAH ADMIN LOGIN) */}
        {/* ========================================================= */}
        {activeView === 'NERACA' && (
          <NeracaKeuanganView
            systemSettings={systemSettings}
            currentAdmin={currentAdmin}
            customers={customers}
            loans={loans}
            payments={payments}
            debts={debts}
            topupRecords={topupRecords}
            onNavigateToTab={(tab) => setActiveView(tab)}
            onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
          />
        )}

        {/* ========================================================= */}
        {/* TAMPILAN 2: MENU KREDIT & PIUTANG (YANG SUDAH JADI) */}
        {/* ========================================================= */}
        {activeView === 'KREDIT' && (
          <div className="space-y-4">
            {/* Ringkasan Keuangan Global Beranda (Simple & Slim Overview) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">
                  Total Plafon Piutang
                </span>
                <p className="font-mono text-sm sm:text-base font-black text-slate-900 mt-0.5">
                  {formatRupiah(financialStats.totalPiutang)}
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{loans.length} Total Akad</span>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight block">
                  Total Terbayar
                </span>
                <p className="font-mono text-sm sm:text-base font-black text-emerald-700 mt-0.5">
                  {formatRupiah(financialStats.totalTerkumpul)}
                </p>
                <span className="text-[10px] text-emerald-600/80 mt-0.5 block">{payments.length} Pembayaran</span>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-tight block">
                  Sisa Piutang Berjalan
                </span>
                <p className="font-mono text-sm sm:text-base font-black text-blue-950 mt-0.5">
                  {formatRupiah(financialStats.totalSisaPiutang)}
                </p>
                <span className="text-[10px] text-blue-700 mt-0.5 block">
                  {financialStats.activeLoansCount} Akad Aktif
                </span>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">
                  Total Nasabah
                </span>
                <p className="font-mono text-sm sm:text-base font-black text-slate-900 mt-0.5">
                  {customers.length}
                </p>
                <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">
                  {financialStats.overdueCount > 0 ? `${financialStats.overdueCount} Menunggak` : 'Semua Tertib'}
                </span>
              </div>
            </div>

            {/* Pencarian, Filter Status & Tombol Tambah Nasabah */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                {/* Search Bar Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama nasabah, ID (CUST-1001), atau no HP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:bg-white text-xs font-semibold text-slate-900 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Tombol Tambah Nasabah & Tambah Akad */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setCustomerToEdit(null);
                      setIsCustomerModalOpen(true);
                    }}
                    className="py-2 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nasabah Baru</span>
                  </button>

                  <button
                    onClick={() => {
                      setPreselectedCustomerId(undefined);
                      setIsLoanModalOpen(true);
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-cyan-300" />
                    <span className="hidden xs:inline">Catat Akad</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs">
                {(
                  [
                    { id: 'ALL', label: `Semua (${customers.length})` },
                    { id: 'LANCAR', label: 'Lancar' },
                    { id: 'MENUNGGAK', label: 'Menunggak' },
                    { id: 'LUNAS', label: 'Lunas / Bebas' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`py-1 px-2.5 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DAFTAR NASABAH TERPADU (SETIAP NASABAH DIBATASI KOTAK/GARIS BAYANG PEMBATAS) */}
            <div className="space-y-3">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Tidak ada nasabah yang ditemukan</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {searchQuery
                        ? `Tidak ada data cocok dengan kata kunci "${searchQuery}".`
                        : 'Belum ada nasabah terdaftar di sistem.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCustomerToEdit(null);
                      setIsCustomerModalOpen(true);
                    }}
                    className="py-2 px-4 rounded-xl bg-blue-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-blue-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Daftarkan Nasabah Pertama</span>
                  </button>
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const summary = customerSummaries.get(c.id) || {
                    totalPiutang: 0,
                    totalTerbayar: 0,
                    totalSisaPiutang: 0,
                    activeLoansCount: 0,
                    customerStatus: 'BEBAS_TAGIHAN' as const,
                    customerLoans: [],
                    customerPayments: [],
                  };
                  const isExpanded = !!expandedCustomers[c.id];

                  // Status badge styling
                  let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  let badgeText = 'Bebas Tagihan';

                  if (summary.customerStatus === 'MENUNGGAK') {
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
                    badgeText = 'Menunggak';
                  } else if (summary.customerStatus === 'PERHATIAN') {
                    badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                    badgeText = 'Perhatian';
                  } else if (summary.customerStatus === 'LANCAR') {
                    badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    badgeText = 'Lancar';
                  } else if (summary.customerStatus === 'LUNAS') {
                    badgeClass = 'bg-blue-50 text-blue-900 border-blue-200';
                    badgeText = 'Lunas';
                  }

                  return (
                    <div
                      key={c.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm hover:border-blue-300 transition-all space-y-3"
                    >
                      {/* Baris Atas: Info Identitas Nasabah & Label Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                            {c.fullName.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900">{c.fullName}</h3>
                              <span className="font-mono text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                                {c.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                              <span>{c.phone}</span>
                              {c.address && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="truncate max-w-[180px] sm:max-w-xs">{c.address}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Label Pelanggan Lancar / Nunggak */}
                        <span
                          className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${badgeClass}`}
                        >
                          {badgeText}
                        </span>
                      </div>

                      {/* UTAMA: 3 KOTAK NOMINAL PIUTANG TOTAL, TERBAYAR, SISA PIUTANG */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/80 text-center">
                        {/* 1. Nominal Piutang Total */}
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight block">
                            Total Piutang
                          </span>
                          <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block">
                            {formatRupiah(summary.totalPiutang)}
                          </span>
                        </div>

                        {/* 2. Terbayar */}
                        <div className="border-x border-slate-200">
                          <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-tight block">
                            Terbayar
                          </span>
                          <span className="font-mono text-xs sm:text-sm font-extrabold text-emerald-700 mt-0.5 block">
                            {formatRupiah(summary.totalTerbayar)}
                          </span>
                        </div>

                        {/* 3. Sisa Piutang */}
                        <div>
                          <span className="text-[10px] font-semibold text-blue-900 uppercase tracking-tight block">
                            Sisa Piutang
                          </span>
                          <span
                            className={`font-mono text-xs sm:text-sm font-extrabold mt-0.5 block ${
                              summary.totalSisaPiutang > 0 ? 'text-rose-600' : 'text-slate-800'
                            }`}
                          >
                            {formatRupiah(summary.totalSisaPiutang)}
                          </span>
                        </div>
                      </div>

                      {/* BARIS FUNGSI LAIN DIKEMAS DALAM BENTUK ICON-ICON */}
                      <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-100">
                        {/* Kiri: Tombol Aksi Utama Operasional */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Icon 1: Bayar Angsuran (Catat Pembayaran) */}
                          <button
                            onClick={() => handleQuickPay(c, summary)}
                            className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                            title="Catat Pembayaran Angsuran"
                          >
                            <Banknote className="w-3.5 h-3.5 text-emerald-100" />
                            <span>Bayar</span>
                          </button>

                          {/* Icon 2: Tambah Akad Kredit Baru */}
                          <button
                            onClick={() => handleQuickAddLoan(c)}
                            className="py-1.5 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                            title="Tambah Akad Kredit Baru untuk Nasabah ini"
                          >
                            <Plus className="w-3.5 h-3.5 text-cyan-300" />
                            <span>Akad Baru</span>
                          </button>

                          {/* Icon 3: Kirim Rincian Tagihan WhatsApp */}
                          <button
                            onClick={() => handleWhatsAppBilling(c, summary)}
                            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                            title="Kirim Pesan Tagihan / Pengingat WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>

                          {/* Icon 4: Edit Data Nasabah */}
                          <button
                            onClick={() => {
                              setCustomerToEdit(c);
                              setIsCustomerModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Ubah Data Profil Nasabah"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Kanan: Icon Rincian / Riwayat Transaksi */}
                        <div>
                          <button
                            onClick={() => toggleExpandCustomer(c.id)}
                            className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Lihat Rincian Akad & Riwayat Pembayaran"
                          >
                            <span className="text-[11px] hidden xs:inline">
                              {summary.customerLoans.length} Akad
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* TAMPILAN RINCIAN YANG DAPAT DI-EXPAND (AKAD PINJAMAN & RIWAYAT KWITANSI) */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                          {/* Daftar Akad Nasabah */}
                          <div>
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                              Rincian Akad Pinjaman ({summary.customerLoans.length}):
                            </span>
                            {summary.customerLoans.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Belum ada akad pinjaman.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {summary.customerLoans.map((loan) => (
                                  <div
                                    key={loan.id}
                                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-slate-900">{loan.loanTitle}</span>
                                        <span className="font-mono text-[10px] text-slate-500">({loan.id})</span>
                                        <span
                                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                            loan.status === 'LANCAR'
                                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                              : loan.status === 'MENUNGGAK'
                                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                                              : loan.status === 'LUNAS'
                                              ? 'bg-blue-100 text-blue-900 border-blue-200'
                                              : 'bg-amber-100 text-amber-800 border-amber-200'
                                          }`}
                                        >
                                          {loan.status}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-0.5">
                                        Plafon: {formatRupiah(loan.totalBill)} · Sisa:{' '}
                                        <span className="font-bold text-slate-800">
                                          {formatRupiah(loan.remainingBalance)}
                                        </span>{' '}
                                        · Angsuran: {formatRupiah(loan.installmentPerPeriod)}/{loan.tenorUnit.toLowerCase()}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => setNewlyCreatedLoanReceipt(loan)}
                                        className="py-1 px-2 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                                        title="Cetak Lembar Akad"
                                      >
                                        Akad
                                      </button>
                                      {loan.status !== 'LUNAS' && (
                                        <button
                                          onClick={() => {
                                            setPreselectedLoanId(loan.id);
                                            setIsPaymentModalOpen(true);
                                          }}
                                          className="py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[11px] font-bold text-white transition-colors cursor-pointer"
                                        >
                                          Bayar
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Riwayat Pembayaran Terbaru Nasabah */}
                          {summary.customerPayments.length > 0 && (
                            <div>
                              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                                Riwayat Pembayaran Terakhir:
                              </span>
                              <div className="space-y-1">
                                {summary.customerPayments.slice(0, 3).map((pay) => (
                                  <div
                                    key={pay.id}
                                    className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <span className="font-mono font-bold text-emerald-900">
                                        {formatRupiah(pay.amount)}
                                      </span>{' '}
                                      <span className="text-slate-500 text-[11px]">
                                        pada {formatDateIndo(pay.date)}
                                      </span>
                                      <span className="font-mono text-[10px] text-slate-400 block">
                                        No. Kwitansi: {pay.invoiceNo}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => setSelectedReceipt(pay)}
                                      className="py-1 px-2 rounded-lg bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Receipt className="w-3 h-3" />
                                      <span>Kwitansi</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAMPILAN 3: LEMBAR KERJA HUTANG SAYA (PENCATATAN PRIBADI) */}
        {/* ========================================================= */}
        {activeView === 'HUTANG' && (
          <HutangManagementView
            debts={debts}
            onAddDebt={onAddDebt}
            onUpdateDebt={onUpdateDebt}
            onDeleteDebt={onDeleteDebt}
            onAddDebtPayment={onAddDebtPayment}
          />
        )}

        {/* ========================================================= */}
        {/* TAMPILAN 4: LEMBAR KERJA JASA TOPUP (PENCATATAN PRIBADI) */}
        {/* ========================================================= */}
        {activeView === 'TOPUP' && (
          <TopupManagementView
            topupRecords={topupRecords}
            onAddTopup={onAddTopup}
            onUpdateTopup={onUpdateTopup}
            onDeleteTopup={onDeleteTopup}
          />
        )}

        {/* ========================================================= */}
        {/* TAMPILAN 5: JENDELA MENU ADMIN, LAPORAN & DATABASE */}
        {/* ========================================================= */}
        {activeView === 'ADMIN' && (
          <div className="space-y-3.5">
            {/* Header & Aksi Cepat Atas Menu Admin */}
            <div className="space-y-2.5">
              {/* Tombol Kembali ke Neraca & Tombol PWA Install */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setActiveView('NERACA')}
                  className="py-1.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Neraca Keuangan</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <PWAInstallButton />

                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="py-1.5 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Buka & Cetak Laporan PDF</span>
                  </button>

                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Edit Profil Admin & Kota PDF</span>
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center">
                    <CircleUserRound className="w-5 h-5" />
                  </div>
                  <span>Menu Admin, Laporan & Pengaturan Database</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola profil admin, nama kota PDF, backup/restore database, serta cetak laporan resmi
                </p>
              </div>
            </div>

            {/* SEKSI 1: BACKUP DATABASE KE LOKAL & RESTORE DARI FILE (.JSON) */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 flex items-center gap-1.5">
                  <HardDrive className="w-3 h-3 text-blue-700" />
                  <span>CADANGAN & PEMULIHAN LOKAL</span>
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Backup Database ke Lokal & Restore dari File (.json)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Unduh berkas cadangan database ke perangkat lokal Anda (.json), atau pulihkan database langsung dari berkas cadangan.
                </p>
              </div>

              <div className="pt-0.5 flex flex-wrap gap-2">
                <button
                  onClick={handleDirectBackupLocal}
                  className="py-2 px-3.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Backup ke Lokal (.json)</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Restore dari File (.json)</span>
                </button>
              </div>
            </div>

            {/* SEKSI KHUSUS: GOOGLE DRIVE CLOUD BACKUP & RESTORE */}
            <div className="p-4 bg-gradient-to-r from-blue-900/5 via-indigo-900/5 to-cyan-900/5 rounded-2xl border-2 border-blue-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-blue-700" />
                    <span>GOOGLE DRIVE CLOUD CADANGAN & RESTORE</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    API Drive Resmi
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Cadangkan & Pulihkan Database ke Akun Google Drive</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Cadangkan seluruh database Amar Bank (data nasabah, pinjaman, mutasi pembayaran, hutang pribadi, dan transaksi topup) langsung ke Google Drive pribadi Anda dengan aman.
                </p>
              </div>

              <div className="pt-0.5 flex flex-wrap gap-2">
                <button
                  onClick={() => setIsGoogleDriveModalOpen(true)}
                  className="py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <CloudUpload className="w-4 h-4 text-cyan-300" />
                  <span>Buka Menu Google Drive (Backup & Restore)</span>
                </button>
              </div>
            </div>

            {/* SEKSI 2: INTEGRASI FIREBASE CLOUD (STATUS & KONEKTIVITAS PROYEK - SLIM) */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <Cloud className="w-3 h-3 text-emerald-600" />
                    <span>STATUS FIREBASE CLOUD</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Terhubung & Siap
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleTestFirebaseConnection}
                    disabled={isTestingFirebase}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isTestingFirebase ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-900" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-blue-900" />
                    )}
                    <span>Uji Koneksi</span>
                  </button>

                  <button
                    onClick={handleUploadToFirebase}
                    disabled={isUploadingToFirebase || isUpdatingFromFirebase}
                    className="py-1.5 px-3 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    {isUploadingToFirebase ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>Upload</span>
                  </button>

                  <button
                    onClick={handleUpdateFromFirebase}
                    disabled={isUploadingToFirebase || isUpdatingFromFirebase}
                    className="py-1.5 px-3 rounded-xl bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    {isUpdatingFromFirebase ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
                    )}
                    <span>Update</span>
                  </button>
                </div>
              </div>

              {/* Status Uji Koneksi */}
              {firebaseStatusInfo.status === 'connected' && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{firebaseStatusInfo.message}</span>
                    {firebaseStatusInfo.lastExport && (
                      <span className="block text-[11px] text-emerald-700 mt-0.5">
                        Cadangan Terakhir di Cloud: {formatDateTimeIndo(firebaseStatusInfo.lastExport)} ({firebaseStatusInfo.customersCount} Nasabah, {firebaseStatusInfo.loansCount} Akad)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {firebaseStatusInfo.status === 'error' && (
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{firebaseStatusInfo.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* SEKSI 3: BACKUP SPREADSHEET (XLS / CSV) & EMAIL */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <span className="text-[10px] font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                SPREADSHEET EXCEL
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Backup Data Lengkap ke Spreadsheet (.xls / Excel)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Unduh seluruh rekapitulasi data lengkap: Neraca Keuangan, Akad Kredit & Piutang, Riwayat Pembayaran, Lembar Kerja Hutang Saya, dan Transaksi Jasa Topup ke dalam berkas Excel (.xls), atau kirimkan cadangan lengkap ke email.
                </p>
              </div>

              <div className="pt-0.5 flex flex-wrap gap-2">
                <button
                  onClick={() => downloadSpreadsheet(customers, loans, payments, debts, topupRecords, systemSettings)}
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File Spreadsheet Lengkap (.xls)</span>
                </button>

                <button
                  onClick={() => openEmailBackup(currentAdmin.email || 'dicoba.ngetes@gmail.com', customers, loans, payments, debts, topupRecords, systemSettings)}
                  className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Kirim ke Email</span>
                </button>
              </div>
            </div>

            {/* SEKSI 4: RESET SEMUA DATA (FACTORY RESET DENGAN VERIFIKASI EMAIL) */}
            <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Tindakan Berbahaya (Zona Reset)
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950">
                  Reset Semua Data & Berkas (Kembali Seperti Baru)
                </h3>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                  Menghapus seluruh daftar nasabah, akad kredit, dan riwayat pembayaran di perangkat ini.
                </p>
              </div>

              <div className="pt-0.5">
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Buka Konfirmasi Reset Database</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. FOOTER NAVIGATION MENU: NERACA, KREDIT & PIUTANG, HUTANG, TOPUP, ADMIN */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-1">
          {/* 1. Neraca Keuangan (Default Active saat login) */}
          <button
            onClick={() => setActiveView('NERACA')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeView === 'NERACA'
                ? 'bg-blue-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Neraca Keuangan"
          >
            <Scale className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Neraca</span>
          </button>

          {/* 2. Menu Kredit & Piutang (yg sudah jadi ini) */}
          <button
            onClick={() => setActiveView('KREDIT')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeView === 'KREDIT'
                ? 'bg-blue-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Kredit & Piutang Nasabah"
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Kredit & Piutang</span>
          </button>

          {/* 3. Menu Hutang Saya */}
          <button
            onClick={() => setActiveView('HUTANG')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeView === 'HUTANG'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Lembar Kerja Hutang Saya"
          >
            <Banknote className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Hutang</span>
          </button>

          {/* 4. Menu Topup Jasa */}
          <button
            onClick={() => setActiveView('TOPUP')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeView === 'TOPUP'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Lembar Kerja Jasa Topup"
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Topup</span>
          </button>

          {/* 5. Menu Admin */}
          <button
            onClick={() => setActiveView('ADMIN')}
            className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
              activeView === 'ADMIN'
                ? 'bg-slate-800 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Menu Admin & Backup"
          >
            <Settings className="w-4 h-4" />
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Admin</span>
          </button>
        </div>
      </footer>

      {/* MODALS */}
      {isCustomerModalOpen && (
        <CustomerModal
          existingCustomers={customers}
          customerToEdit={customerToEdit}
          onSave={(cust) => {
            if (customerToEdit) {
              onUpdateCustomer(cust);
            } else {
              onAddCustomer(cust);
            }
          }}
          onClose={() => {
            setIsCustomerModalOpen(false);
            setCustomerToEdit(null);
          }}
        />
      )}

      {isLoanModalOpen && (
        <LoanModal
          customers={customers}
          existingLoans={loans}
          preselectedCustomerId={preselectedCustomerId}
          onSave={(newLoan) => {
            onAddLoan(newLoan);
            setIsLoanModalOpen(false);
            setPreselectedCustomerId(undefined);
            setNewlyCreatedLoanReceipt(newLoan);
          }}
          onClose={() => {
            setIsLoanModalOpen(false);
            setPreselectedCustomerId(undefined);
          }}
        />
      )}

      {newlyCreatedLoanReceipt && (
        <LoanReceiptModal
          loan={newlyCreatedLoanReceipt}
          onClose={() => setNewlyCreatedLoanReceipt(null)}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          loans={loans}
          preselectedLoanId={preselectedLoanId}
          onRecordPayment={(pay, updatedLoan) => {
            onRecordPayment(pay, updatedLoan);
            setIsPaymentModalOpen(false);
            setSelectedReceipt(pay); // Preview kwitansi otomatis!
          }}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPreselectedLoanId(undefined);
          }}
        />
      )}

      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {isReportModalOpen && (
        <ReportModal
          customers={customers}
          loans={loans}
          payments={payments}
          debts={debts}
          topupRecords={topupRecords}
          systemSettings={systemSettings}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {isNotificationModalOpen && (
        <NotificationModal
          notifications={notifications}
          loans={loans}
          onClose={() => setIsNotificationModalOpen(false)}
          onMarkAllAsRead={onMarkAllNotificationsAsRead}
          onClearAll={onClearAllNotifications}
          onMarkAsRead={onMarkNotificationAsRead}
        />
      )}

      {isSettingsModalOpen && (
        <AdminProfileSettingsModal
          currentAdmin={currentAdmin}
          systemSettings={systemSettings}
          onSaveAdmin={onUpdateAdmin}
          onSaveSystemSettings={onUpdateSystemSettings}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {isResetModalOpen && (
        <ResetDataModal
          adminEmail={currentAdmin.email || 'dicoba.ngetes@gmail.com'}
          onConfirmReset={() => {
            onResetAllData();
            setIsResetModalOpen(false);
            setSyncFeedback({
              type: 'info',
              message: 'Semua data nasabah dan piutang telah dibersihkan! Aplikasi kini dalam status bersih tanpa debitur.',
            });
          }}
          onClose={() => setIsResetModalOpen(false)}
        />
      )}

      {isGoogleDriveModalOpen && (
        <GoogleDriveBackupModal
          customers={customers}
          loans={loans}
          payments={payments}
          debts={debts}
          topupRecords={topupRecords}
          systemSettings={systemSettings}
          onRestoreData={(payload) => {
            onRestoreData(payload);
            setSyncFeedback({
              type: 'success',
              message: 'Database berhasil dipulihkan dari Google Drive!',
            });
          }}
          onClose={() => setIsGoogleDriveModalOpen(false)}
        />
      )}
    </div>
  );
};
