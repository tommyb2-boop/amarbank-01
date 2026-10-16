import React, { useState, useMemo } from 'react';
import { Customer, Loan, Payment, DebtRecord, TopupRecord, SystemSettings, AdminUser } from '../types';
import { formatRupiah, formatDateIndo, formatDateTimeIndo, openWhatsApp } from '../utils/formatters';
import { AmarBankLogo } from './AmarBankLogo';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Smartphone,
  Scale,
  Calendar,
  Share2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  Wallet,
  PiggyBank,
  Receipt,
  Building,
  Cloud,
  MessageCircle,
} from 'lucide-react';

interface NeracaKeuanganViewProps {
  systemSettings: SystemSettings;
  currentAdmin: AdminUser;
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  debts: DebtRecord[];
  topupRecords: TopupRecord[];
  onNavigateToTab: (tab: 'KREDIT' | 'HUTANG' | 'TOPUP' | 'ADMIN') => void;
  onOpenGoogleDrive?: () => void;
}

export const NeracaKeuanganView: React.FC<NeracaKeuanganViewProps> = ({
  systemSettings,
  currentAdmin,
  customers,
  loans,
  payments,
  debts,
  topupRecords,
  onNavigateToTab,
  onOpenGoogleDrive,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'MONTH' | 'TODAY'>('ALL');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Filter topup by period
  const filteredTopup = useMemo(() => {
    if (filterPeriod === 'ALL') return topupRecords;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayDateStr = now.toISOString().slice(0, 10);

    return topupRecords.filter((t) => {
      const tDate = new Date(t.date);
      if (filterPeriod === 'TODAY') {
        return t.date.slice(0, 10) === todayDateStr;
      }
      if (filterPeriod === 'MONTH') {
        return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
      }
      return true;
    });
  }, [topupRecords, filterPeriod]);

  // 1. REKAPAN KREDIT & PIUTANG (NASABAH)
  const creditSummary = useMemo(() => {
    let totalPlafon = 0;
    let totalPokokBersih = 0;
    let totalMargin = 0;
    let totalTerbayar = 0;
    let totalSisaPiutang = 0;
    let totalLabaMarginDiterima = 0;
    let totalSisaMargin = 0;
    let totalSisaPokok = 0;
    let activeLoansCount = 0;
    let overdueLoansCount = 0;

    loans.forEach((loan) => {
      totalPlafon += loan.principalAmount;
      totalPokokBersih += loan.netPrincipal;
      totalMargin += loan.marginAmount;
      totalTerbayar += loan.totalPaid;
      totalSisaPiutang += loan.remainingBalance;

      // Rasio porsi keuntungan margin bunga terhadap total tagihan kredit
      const marginRatio = loan.totalBill > 0 ? loan.marginAmount / loan.totalBill : 0;
      
      // Laba margin yang sudah benar-benar dibayar oleh nasabah (Realisasi Kas Masuk)
      const labaMarginPaid = Math.round(loan.totalPaid * marginRatio);
      // Sisa margin bunga yang masih ada di tagihan piutang nasabah
      const marginRemaining = Math.max(0, loan.marginAmount - labaMarginPaid);
      // Sisa pokok pinjaman nasabah
      const pokokRemaining = Math.max(0, loan.remainingBalance - marginRemaining);

      totalLabaMarginDiterima += labaMarginPaid;
      totalSisaMargin += marginRemaining;
      totalSisaPokok += pokokRemaining;

      if (loan.status !== 'LUNAS') {
        activeLoansCount += 1;
      }
      if (loan.status === 'MENUNGGAK') {
        overdueLoansCount += 1;
      }
    });

    const totalKasAngsuran = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPlafon,
      totalPokokBersih,
      totalMargin,
      totalTerbayar: totalTerbayar || totalKasAngsuran,
      totalSisaPiutang,
      totalLabaMarginDiterima,
      totalSisaMargin,
      totalSisaPokok,
      activeLoansCount,
      overdueLoansCount,
      totalLoansCount: loans.length,
      customersCount: customers.length,
    };
  }, [loans, payments, customers]);

  // 2. REKAPAN HUTANG SAYA (KEWAJIBAN)
  const debtSummary = useMemo(() => {
    let totalHutangPokok = 0;
    let totalHutangDibayar = 0;
    let totalSisaHutang = 0;
    let activeDebtsCount = 0;

    debts.forEach((debt) => {
      totalHutangPokok += debt.principalAmount;
      totalHutangDibayar += debt.paidAmount;
      totalSisaHutang += debt.remainingAmount;
      if (debt.status !== 'LUNAS') {
        activeDebtsCount += 1;
      }
    });

    return {
      totalHutangPokok,
      totalHutangDibayar,
      totalSisaHutang,
      activeDebtsCount,
      totalDebtsCount: debts.length,
    };
  }, [debts]);

  // 3. REKAPAN PENGHASILAN JASA TOPUP
  const topupSummary = useMemo(() => {
    let totalOmzet = 0;
    let totalModal = 0;
    let totalProfit = 0;
    let totalKasbon = 0;

    filteredTopup.forEach((t) => {
      totalOmzet += t.sellPrice;
      totalModal += t.buyPrice;
      totalProfit += t.profit;
      if (t.paymentStatus === 'KASBON') {
        totalKasbon += t.sellPrice;
      }
    });

    return {
      totalOmzet,
      totalModal,
      totalProfit,
      totalKasbon,
      totalTrx: filteredTopup.length,
    };
  }, [filteredTopup]);

  // 4. PERHITUNGAN ARUS KEUANGAN & NERACA BERSIH
  const financialFlow = useMemo(() => {
    // TOTAL LABA BERSIH REALISASI KAS: Laba Margin Kredit Diterima + Laba Topup
    const totalLabaBersihDiterima = creditSummary.totalLabaMarginDiterima + topupSummary.totalProfit;

    // TOTAL SELURUH POTENSI LABA BERSIH USAHA: Total Margin Bunga Kredit + Laba Topup
    const totalAkumulasiLabaUsaha = creditSummary.totalMargin + topupSummary.totalProfit;

    // Sisa Aset Piutang + Laba Bersih Topup - Sisa Kewajiban Hutang
    const netAssets = creditSummary.totalSisaPiutang + topupSummary.totalProfit - debtSummary.totalSisaHutang;
    
    // Total Kas Masuk Riil (Angsuran diterima + Penjualan Topup)
    const totalCashIn = creditSummary.totalTerbayar + topupSummary.totalOmzet;
    
    // Total Kas Keluar Riil (Penyaluran Pokok + Modal Topup + Pembayaran Hutang)
    const totalCashOut = creditSummary.totalPokokBersih + topupSummary.totalModal + debtSummary.totalHutangDibayar;

    // Selisih Kas Operasional
    const netCashFlow = totalCashIn - totalCashOut;

    // Likuiditas / Status
    const isHealthy = netAssets >= 0;

    return {
      totalLabaBersihDiterima,
      totalAkumulasiLabaUsaha,
      netAssets,
      totalCashIn,
      totalCashOut,
      netCashFlow,
      isHealthy,
    };
  }, [creditSummary, debtSummary, topupSummary]);

  // Salin Ringkasan Neraca ke WhatsApp / Clipboard
  const handleCopyWhatsAppSummary = () => {
    const todayStr = formatDateIndo(new Date().toISOString());
    const text = `*AMAR BANK - NERACA KEUANGAN & LABA RUGI*
Cabang: ${systemSettings.cityName}
Tanggal Rekap: ${todayStr}
Penanggung Jawab: ${currentAdmin.fullName}

=============================
1. REKAP PIUTANG & KREDIT NASABAH
- Total Plafon Kredit: ${formatRupiah(creditSummary.totalPlafon)}
- Angsuran Diterima: ${formatRupiah(creditSummary.totalTerbayar)}
- Sisa Piutang Berjalan: ${formatRupiah(creditSummary.totalSisaPiutang)}
- LABA MARGIN KREDIT DITERIMA: ${formatRupiah(creditSummary.totalLabaMarginDiterima)} (Kas Masuk)
- Sisa Margin Berjalan: ${formatRupiah(creditSummary.totalSisaMargin)}
- Total Margin Bunga Akad: ${formatRupiah(creditSummary.totalMargin)}
- Nasabah Aktif: ${creditSummary.activeLoansCount} pembiayaan

2. REKAP HUTANG SAYA (KEWAJIBAN)
- Total Pokok Hutang: ${formatRupiah(debtSummary.totalHutangPokok)}
- Sudah Dicicil: ${formatRupiah(debtSummary.totalHutangDibayar)}
- Sisa Hutang Harus Dibayar: ${formatRupiah(debtSummary.totalSisaHutang)}
- Kreditor Aktif: ${debtSummary.activeDebtsCount} pihak

3. REKAP PENGHASILAN JASA TOPUP
- Total Omzet: ${formatRupiah(topupSummary.totalOmzet)}
- Total Modal: ${formatRupiah(topupSummary.totalModal)}
- LABA BERSIH TOPUP: ${formatRupiah(topupSummary.totalProfit)}
- Total Transaksi: ${topupSummary.totalTrx} transaksi

=============================
*TOTAL LABA BERSIH USAHA (KREDIT + TOPUP)*:
*${formatRupiah(financialFlow.totalLabaBersihDiterima)}* (Kas Realisasi Masuk)
*Total Potensi Seluruh Laba: ${formatRupiah(financialFlow.totalAkumulasiLabaUsaha)}*

*POSISI KEUANGAN BERSIH (NET ASSET)*:
*${formatRupiah(financialFlow.netAssets)}*
Status: ${financialFlow.isHealthy ? 'SURPLUS & SEHAT' : 'PERHATIAN DEFISIT'}
=============================
Dicetak dari Amar Bank Manajemen System`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER JUDUL RESMI SESUAI REQUEST:
          judul = "Amar Bank"
          sub judul = "Neraca Keuangan"
      */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-blue-950/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-6 w-32 h-32 bg-cyan-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-300/30 text-cyan-200 text-[10px] font-bold uppercase tracking-wider">
                Dashboard Utama Keuangan
              </span>
              <span className="text-blue-200 text-xs">• {formatDateIndo(new Date().toISOString())}</span>
            </div>
            <div className="flex items-center gap-3">
              <AmarBankLogo size="md" showText={false} />
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Amar Bank
                </h1>
                <h2 className="text-base sm:text-lg font-medium text-cyan-200 tracking-wide mt-0.5 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-cyan-300 inline" />
                  <span>Neraca Keuangan</span>
                  <span className="text-white/60 text-xs">({systemSettings.cityName})</span>
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Tombol Salin Ringkasan ke WhatsApp */}
            <button
              onClick={handleCopyWhatsAppSummary}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-semibold text-white flex items-center gap-1.5 border border-white/20 shadow-xs cursor-pointer backdrop-blur-xs"
              title="Salin rekap Neraca ke WhatsApp"
            >
              {copiedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-emerald-200">Tersalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-cyan-200" />
                  <span className="hidden sm:inline">Salin Teks</span>
                  <span className="sm:hidden">Salin</span>
                </>
              )}
            </button>

            {/* Tombol Kirim Langsung ke WhatsApp */}
            <button
              onClick={() => {
                const todayStr = formatDateIndo(new Date().toISOString());
                const text = `*AMAR BANK - NERACA KEUANGAN & LABA RUGI*
Cabang: ${systemSettings.cityName}
Tanggal Rekap: ${todayStr}
Penanggung Jawab: ${currentAdmin.fullName}

=============================
1. REKAP PIUTANG & KREDIT NASABAH
- Total Plafon Kredit: ${formatRupiah(creditSummary.totalPlafon)}
- Angsuran Diterima: ${formatRupiah(creditSummary.totalTerbayar)}
- Sisa Piutang Berjalan: ${formatRupiah(creditSummary.totalSisaPiutang)}
- LABA MARGIN KREDIT DITERIMA: +${formatRupiah(creditSummary.totalLabaMarginDiterima)} (Kas Masuk)
- Sisa Margin Berjalan: +${formatRupiah(creditSummary.totalSisaMargin)}
- Total Potensi Margin: +${formatRupiah(creditSummary.totalMargin)}
- Nasabah Aktif: ${creditSummary.activeLoansCount} pembiayaan

2. REKAP HUTANG SAYA (KEWAJIBAN)
- Total Pokok Hutang: ${formatRupiah(debtSummary.totalHutangPokok)}
- Sudah Dicicil: ${formatRupiah(debtSummary.totalHutangDibayar)}
- Sisa Hutang Wajib Bayar: ${formatRupiah(debtSummary.totalSisaHutang)}

3. REKAP PENGHASILAN JASA TOPUP
- Total Omzet: ${formatRupiah(topupSummary.totalOmzet)}
- Modal/Deposit: ${formatRupiah(topupSummary.totalModal)}
- LABA BERSIH TOPUP: +${formatRupiah(topupSummary.totalProfit)}
- Transaksi Selesai: ${topupSummary.totalTrx} transaksi

=============================
*TOTAL LABA BERSIH OPERASIONAL KAS*:
*+${formatRupiah(financialFlow.totalLabaBersihDiterima)}*
*Total Seluruh Potensi Laba: +${formatRupiah(financialFlow.totalAkumulasiLabaUsaha)}*

*POSISI NILAI BERSIH (NET ASSET)*:
*${formatRupiah(financialFlow.netAssets)}*
Status: ${financialFlow.isHealthy ? 'SURPLUS & SEHAT' : 'PERHATIAN DEFISIT'}
=============================
Dicetak dari Amar Bank Manajemen System`;
                openWhatsApp(currentAdmin.phone || '081298765432', text);
              }}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-xs font-bold text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Kirim Rekapan Neraca langsung ke WhatsApp Anda"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kirim ke WA</span>
              <span className="sm:hidden">WA</span>
            </button>

            {/* Tombol Backup Google Drive Cepat */}
            {onOpenGoogleDrive && (
              <button
                onClick={onOpenGoogleDrive}
                className="px-3.5 py-2 rounded-xl bg-blue-700/80 hover:bg-blue-600 active:scale-95 transition-all text-xs font-bold text-white flex items-center gap-1.5 border border-cyan-300/30 shadow-xs cursor-pointer backdrop-blur-xs"
                title="Backup & Restore Google Drive"
              >
                <Cloud className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline">Google Drive</span>
                <span className="sm:hidden">Drive</span>
              </button>
            )}

            {/* Tombol Print Cepat */}
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-blue-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              title="Cetak Neraca Keuangan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Banner Quick Insight */}
        <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-[11px] text-blue-200">Sisa Aset Piutang</p>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">
              {formatRupiah(creditSummary.totalSisaPiutang)}
            </p>
            <p className="text-[10px] text-blue-300">Uang modal & margin di nasabah</p>
          </div>
          <div>
            <p className="text-[11px] text-rose-200">Sisa Hutang Saya</p>
            <p className="text-base sm:text-lg font-bold text-rose-200 mt-0.5">
              {formatRupiah(debtSummary.totalSisaHutang)}
            </p>
            <p className="text-[10px] text-rose-300">Kewajiban harus dibayar</p>
          </div>
          <div>
            <p className="text-[11px] text-emerald-200 font-semibold flex items-center gap-1">
              <span>Laba Usaha (Kas Masuk)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </p>
            <p className="text-base sm:text-lg font-extrabold text-emerald-300 mt-0.5">
              +{formatRupiah(financialFlow.totalLabaBersihDiterima)}
            </p>
            <p className="text-[10px] text-emerald-200/90 truncate">
              Kredit: +{formatRupiah(creditSummary.totalLabaMarginDiterima)} | Topup: +{formatRupiah(topupSummary.totalProfit)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-cyan-200">Posisi Nilai Bersih</p>
            <p className="text-base sm:text-lg font-extrabold text-cyan-300 mt-0.5">
              {formatRupiah(financialFlow.netAssets)}
            </p>
            <p className="text-[10px] text-cyan-200">Ekuitas & likuiditas bersih</p>
          </div>
        </div>
      </div>

      {/* 2. 3 KARTU REKAPAN UTAMA SESUAI PERMINTAAN USER:
          - Total Rekapan menu piutang & kredit yang sudah ada
          - Rekapan hutang saya
          - Rekapan penghasilan dari jasa Topup
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* KARTU 1: REKAPAN PIUTANG & KREDIT */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {creditSummary.activeLoansCount} Kredit Aktif
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rekapan Piutang & Kredit
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                {formatRupiah(creditSummary.totalSisaPiutang)}
              </h3>
              <p className="text-[11px] text-slate-500">
                Pokok: {formatRupiah(creditSummary.totalSisaPokok)} + Margin: {formatRupiah(creditSummary.totalSisaMargin)}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Kredit Disalurkan:</span>
                <span className="font-semibold text-slate-900">{formatRupiah(creditSummary.totalPlafon)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Sudah Diterima:</span>
                <span className="font-semibold text-emerald-600">+{formatRupiah(creditSummary.totalTerbayar)}</span>
              </div>
              {/* KEUNTUNGAN KREDIT & PIUTANG MASUK LABA */}
              <div className="p-2 bg-emerald-50/80 rounded-xl border border-emerald-200/80 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Laba Margin Diterima:</span>
                  </span>
                  <span className="font-extrabold text-emerald-700">+{formatRupiah(creditSummary.totalLabaMarginDiterima)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-emerald-700">
                  <span>Margin Berjalan di Nasabah:</span>
                  <span>+{formatRupiah(creditSummary.totalSisaMargin)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-emerald-800 font-semibold border-t border-emerald-200/60 pt-0.5">
                  <span>Total Keuntungan Margin Akad:</span>
                  <span>+{formatRupiah(creditSummary.totalMargin)}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('KREDIT')}
            className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs font-bold text-blue-700 hover:text-blue-900 group cursor-pointer"
          >
            <span>Buka Lembar Kerja Kredit</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* KARTU 2: REKAPAN HUTANG SAYA */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {debtSummary.activeDebtsCount} Kreditor Aktif
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rekapan Hutang Saya
              </p>
              <h3 className="text-xl font-extrabold text-rose-600 mt-0.5">
                {formatRupiah(debtSummary.totalSisaHutang)}
              </h3>
              <p className="text-[11px] text-slate-500">Sisa kewajiban hutang yang harus dibayar</p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Pokok Hutang:</span>
                <span className="font-semibold text-slate-900">{formatRupiah(debtSummary.totalHutangPokok)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Sudah Dibayar/Dicicil:</span>
                <span className="font-semibold text-emerald-600">-{formatRupiah(debtSummary.totalHutangDibayar)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Jumlah Pinjaman:</span>
                <span className="font-semibold text-slate-900">{debtSummary.totalDebtsCount} catatan hutang</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('HUTANG')}
            className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs font-bold text-rose-700 hover:text-rose-900 group cursor-pointer"
          >
            <span>Buka Lembar Kerja Hutang</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* KARTU 3: REKAPAN PENGHASILAN JASA TOPUP */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1">
                {(['ALL', 'MONTH', 'TODAY'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPeriod(p)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                      filterPeriod === p
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p === 'ALL' ? 'Semua' : p === 'MONTH' ? 'Bulan Ini' : 'Hari Ini'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Laba Jasa Topup (Bersih)
              </p>
              <h3 className="text-xl font-extrabold text-emerald-600 mt-0.5">
                +{formatRupiah(topupSummary.totalProfit)}
              </h3>
              <p className="text-[11px] text-slate-500">Keuntungan murni dari penjualan pulsa, PLN, dll</p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Omzet Penjualan:</span>
                <span className="font-semibold text-slate-900">{formatRupiah(topupSummary.totalOmzet)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Modal Beli / Deposit:</span>
                <span className="font-semibold text-slate-700">{formatRupiah(topupSummary.totalModal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Transaksi:</span>
                <span className="font-semibold text-slate-900">{topupSummary.totalTrx} transaksi</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('TOPUP')}
            className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs font-bold text-emerald-700 hover:text-emerald-900 group cursor-pointer"
          >
            <span>Buka Lembar Kerja Topup</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>

      {/* 2b. SECTION KHUSUS: TRANSPARANSI & INTEGRASI LABA USAHA AMAR BANK */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-emerald-200/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-emerald-950">
                Status Integrasi Laba di Neraca Keuangan: SUDAH MASUK
              </h4>
              <p className="text-xs text-emerald-800">
                Keuntungan dari <strong>Kredit & Piutang (Margin/Bunga)</strong> dan <strong>Jasa Topup</strong> sudah terkoneksi dan dijumlahkan sebagai Laba Bersih di Neraca.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-bold text-emerald-700 block uppercase">
              Total Laba Masuk Kas (Realisasi)
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-700">
              +{formatRupiah(financialFlow.totalLabaBersihDiterima)}
            </span>
          </div>
        </div>

        {/* 3 Kolom Rincian Transparansi Laba */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 space-y-1">
            <span className="text-[10px] font-bold text-blue-800 uppercase block">
              1. Laba dari Kredit & Piutang
            </span>
            <p className="font-extrabold text-sm text-blue-950">
              +{formatRupiah(creditSummary.totalLabaMarginDiterima)}
              <span className="text-[10px] font-normal text-slate-500 block">Terkumpul di Kas dari Angsuran</span>
            </p>
            <p className="text-[10px] text-slate-500 pt-0.5">
              + {formatRupiah(creditSummary.totalSisaMargin)} (Sisa Margin di Nasabah)
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">
              2. Laba dari Jasa Topup
            </span>
            <p className="font-extrabold text-sm text-emerald-700">
              +{formatRupiah(topupSummary.totalProfit)}
              <span className="text-[10px] font-normal text-slate-500 block">Dari {topupSummary.totalTrx} Transaksi Penjualan</span>
            </p>
            <p className="text-[10px] text-slate-500 pt-0.5">
              Omzet: {formatRupiah(topupSummary.totalOmzet)}
            </p>
          </div>

          <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-200 uppercase block">
              3. Total Seluruh Potensi Laba
            </span>
            <p className="font-black text-base text-white">
              +{formatRupiah(financialFlow.totalAkumulasiLabaUsaha)}
            </p>
            <p className="text-[10px] text-emerald-100">
              Total margin bunga seluruh akad kredit + laba bersih jasa topup
            </p>
          </div>
        </div>
      </div>

      {/* 3. TABEL RESMI NERACA KEUANGAN & ARUS KAS (KOMPREHENSIF) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-900" />
              <span>Tabel Neraca Posisi Keuangan Usaha</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kompilasi otomatis Aktiva (Aset & Piutang) vs Pasiva (Kewajiban Hutang) beserta Pendapatan Jasa
            </p>
          </div>
          <span className="self-start sm:self-center text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            Status: {financialFlow.isHealthy ? 'Surplus / Likuid' : 'Perlu Tambahan Likuiditas'}
          </span>
        </div>

        {/* Tabel Komparasi Neraca (Dua Sisi: Aktiva & Pasiva) */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SISI KIRI: AKTIVA / ASET & PENDAPATAN */}
          <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  I. AKTIVA (Aset, Piutang & Pendapatan)
                </h4>
              </div>
              <span className="text-xs font-bold text-blue-950">Nominal</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div>
                  <span className="text-slate-800 font-medium block">1. Sisa Piutang Berjalan di Nasabah</span>
                  <span className="text-[10px] text-slate-500">
                    Pokok Pinjaman: {formatRupiah(creditSummary.totalSisaPokok)} + Margin: {formatRupiah(creditSummary.totalSisaMargin)}
                  </span>
                </div>
                <span className="font-bold text-slate-900">{formatRupiah(creditSummary.totalSisaPiutang)}</span>
              </div>

              {/* BARIS JELAS: LABA KREDIT & PIUTANG MASUK NERACA */}
              <div className="flex items-center justify-between py-1 border-b border-slate-100 bg-emerald-50/60 px-2 rounded-lg">
                <div>
                  <span className="text-emerald-900 font-bold block">2. Laba Margin Kredit (Realisasi Kas Diterima)</span>
                  <span className="text-[10px] text-emerald-700">Keuntungan bunga kredit yang sudah dibayar nasabah</span>
                </div>
                <span className="font-extrabold text-emerald-700">+{formatRupiah(creditSummary.totalLabaMarginDiterima)}</span>
              </div>

              {/* BARIS JELAS: LABA TOPUP MASUK NERACA */}
              <div className="flex items-center justify-between py-1 border-b border-slate-100 bg-emerald-50/60 px-2 rounded-lg">
                <div>
                  <span className="text-emerald-900 font-bold block">3. Laba Bersih Jasa Topup (Pulsa / PLN / E-Wallet)</span>
                  <span className="text-[10px] text-emerald-700">Keuntungan murni dari seluruh transaksi topup</span>
                </div>
                <span className="font-extrabold text-emerald-700">+{formatRupiah(topupSummary.totalProfit)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 text-slate-600 text-[11px]">
                <span>• Kas Pokok Pinjaman yang Telah Kembali</span>
                <span className="font-semibold text-slate-700">{formatRupiah(creditSummary.totalTerbayar - creditSummary.totalLabaMarginDiterima)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 text-slate-500 text-[11px]">
                <span>• Akumulasi Omzet Penjualan Topup</span>
                <span>{formatRupiah(topupSummary.totalOmzet)}</span>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-blue-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-950 uppercase">
                Total Aset & Penerimaan
              </span>
              <span className="text-sm font-extrabold text-blue-950">
                {formatRupiah(creditSummary.totalSisaPiutang + creditSummary.totalTerbayar + topupSummary.totalProfit)}
              </span>
            </div>
          </div>

          {/* SISI KANAN: PASIVA / KEWAJIBAN & HUTANG */}
          <div className="border border-rose-100 rounded-xl p-4 bg-rose-50/30 space-y-3">
            <div className="flex items-center justify-between border-b border-rose-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  II. PASIVA (Kewajiban Hutang)
                </h4>
              </div>
              <span className="text-xs font-bold text-rose-950">Nominal</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700">1. Sisa Hutang yang Masih Harus Dibayar</span>
                <span className="font-bold text-rose-600">{formatRupiah(debtSummary.totalSisaHutang)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700">2. Total Hutang Sudah Dilunasi/Dicicil</span>
                <span className="font-semibold text-slate-700">{formatRupiah(debtSummary.totalHutangDibayar)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-700">3. Modal Terpakai Jasa Topup (Deposit)</span>
                <span className="font-semibold text-slate-700">{formatRupiah(topupSummary.totalModal)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 text-slate-500 text-[11px]">
                <span>• Total Komitmen Pokok Pinjaman</span>
                <span>{formatRupiah(debtSummary.totalHutangPokok)}</span>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-rose-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-950 uppercase">
                Total Kewajiban Berjalan
              </span>
              <span className="text-sm font-extrabold text-rose-600">
                {formatRupiah(debtSummary.totalSisaHutang)}
              </span>
            </div>
          </div>

        </div>

        {/* BOTTOM SUMMARY: POSISI BERSIH (EKUITAS BERSIH ARUS KEUANGAN) */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">
                Ekuitas Bersih & Arus Keuangan (Net Financial Worth)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Formula: (Sisa Piutang Nasabah + Laba Bersih Topup) - Sisa Kewajiban Hutang
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-2xl sm:text-3xl font-black text-cyan-300 tracking-tight">
              {formatRupiah(financialFlow.netAssets)}
            </span>
            <div className="flex items-center gap-2 sm:justify-end mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${financialFlow.isHealthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className="text-xs font-semibold text-slate-300">
                {financialFlow.isHealthy ? 'Posisi Keuangan Sehat (Surplus)' : 'Defisit (Kewajiban > Aset Lancar)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TOMBOL PINTAS LANGSUNG KE 3 LEMBAR KERJA */}
      <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-blue-900">
          <p className="font-bold">Akses Cepat Lembar Kerja Terhubung:</p>
          <p className="text-blue-700">Pilih lembar kerja di bawah untuk menambah data, pencatatan transaksi, atau pelunasan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateToTab('KREDIT')}
            className="px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Kredit & Piutang</span>
          </button>
          <button
            onClick={() => onNavigateToTab('HUTANG')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Hutang Saya</span>
          </button>
          <button
            onClick={() => onNavigateToTab('TOPUP')}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Jasa Topup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
