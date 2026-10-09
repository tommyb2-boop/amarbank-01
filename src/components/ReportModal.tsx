import React, { useState, useMemo } from 'react';
import { Customer, Loan, Payment, SystemSettings } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { AmarBankLogo } from './AmarBankLogo';
import { Printer, Calendar, X, Download, Filter } from 'lucide-react';
import { downloadSpreadsheet } from '../utils/exporter';

interface ReportModalProps {
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  systemSettings: SystemSettings;
  onClose: () => void;
}

type PeriodFilter = 'ALL' | 'TODAY' | '7_DAYS' | 'THIS_MONTH' | '30_DAYS' | 'CUSTOM';

export const ReportModal: React.FC<ReportModalProps> = ({
  customers,
  loans,
  payments,
  systemSettings,
  onClose,
}) => {

  const [period, setPeriod] = useState<PeriodFilter>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-31');

  // Filter payments and active loans based on selected date range
  const filteredData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start = new Date(0);
    let end = new Date(2099, 11, 31);

    if (period === 'TODAY') {
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (period === '7_DAYS') {
      start = new Date();
      start.setDate(today.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end = new Date();
    } else if (period === 'THIS_MONTH') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === '30_DAYS') {
      start = new Date();
      start.setDate(today.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end = new Date();
    } else if (period === 'CUSTOM') {
      if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
      }
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
    }

    const filteredPayments = payments.filter((p) => {
      const pDate = new Date(p.date);
      return pDate >= start && pDate <= end;
    });

    const filteredLoans = loans.filter((l) => {
      const lDate = new Date(l.startDate);
      return lDate <= end; // active within period
    });

    const totalPiutang = filteredLoans.reduce((sum, l) => sum + l.totalBill, 0);
    const totalTerkumpul = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalSisa = filteredLoans.reduce((sum, l) => sum + l.remainingBalance, 0);

    return {
      filteredPayments,
      filteredLoans,
      totalPiutang,
      totalTerkumpul,
      totalSisa,
      startFormatted: formatDateIndo(start.toISOString()),
      endFormatted: formatDateIndo(end.toISOString()),
    };
  }, [period, startDate, endDate, payments, loans]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print p-4 md:p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Ekspor Laporan Keuangan PDF
              </h2>
              <p className="text-xs text-slate-500">
                Laporan resmi rekapitulasi kredit & penerimaan angsuran
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadSpreadsheet(customers, filteredData.filteredLoans, filteredData.filteredPayments)}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh XLS</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls (Hidden on print) */}
        <div className="no-print px-5 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <Filter className="w-3.5 h-3.5 text-blue-900" />
            <span>Filter Periode:</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { id: 'ALL', label: 'Semua Waktu' },
              { id: 'TODAY', label: 'Hari Ini' },
              { id: '7_DAYS', label: '7 Hari Terakhir' },
              { id: 'THIS_MONTH', label: 'Bulan Ini' },
              { id: '30_DAYS', label: '30 Hari Terakhir' },
              { id: 'CUSTOM', label: 'Rentang Kustom' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriod(item.id as PeriodFilter)}
                className={`py-1.5 px-3 rounded-lg font-medium transition-colors cursor-pointer ${
                  period === item.id
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {period === 'CUSTOM' && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[11px]">Mulai:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 rounded-md border border-slate-300 text-xs text-slate-800"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[11px]">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 rounded-md border border-slate-300 text-xs text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="overflow-y-auto p-6 md:p-10 bg-white flex-1 text-slate-900">
          
          {/* KOP RESMI AMAR BANK */}
          <div className="border-b-4 border-double border-blue-900 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AmarBankLogo size="lg" showText={true} />
              </div>
              <div className="text-right text-xs text-slate-600">
                <p className="font-bold text-slate-900">{systemSettings.branchName}</p>
                <p>{systemSettings.divisionName}</p>
                <p>{systemSettings.branchAddress}, {systemSettings.cityName}</p>
                <p>Telp: {systemSettings.branchPhone} | WA: {systemSettings.officialWhatsApp}</p>
              </div>
            </div>
            
            <div className="text-center mt-6">
              <h1 className="text-lg md:text-xl font-extrabold uppercase tracking-wide text-blue-950">
                LAPORAN REKAPITULASI PIUTANG & ANGSURAN NASABAH
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Periode: {period === 'ALL' ? 'Semua Riwayat Transaksi' : `${filteredData.startFormatted} s/d ${filteredData.endFormatted}`}
              </p>
            </div>
          </div>

          {/* FINANCIAL SUMMARY HIGHLIGHT CARDS */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 my-6 print-break-inside-avoid">
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 text-center">
              <p className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider">
                Total Plafon Piutang
              </p>
              <p className="text-base md:text-lg font-extrabold text-blue-950 font-mono mt-1">
                {formatRupiah(filteredData.totalPiutang)}
              </p>
              <p className="text-[10px] text-blue-700 mt-0.5">
                {filteredData.filteredLoans.length} Kontrak Akad
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-center">
              <p className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider">
                Total Angsuran Masuk
              </p>
              <p className="text-base md:text-lg font-extrabold text-emerald-950 font-mono mt-1">
                {formatRupiah(filteredData.totalTerkumpul)}
              </p>
              <p className="text-[10px] text-emerald-700 mt-0.5">
                {filteredData.filteredPayments.length} Pembayaran
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-100 text-center">
              <p className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
                Sisa Piutang Berjalan
              </p>
              <p className="text-base md:text-lg font-extrabold text-amber-950 font-mono mt-1">
                {formatRupiah(filteredData.totalSisa)}
              </p>
              <p className="text-[10px] text-amber-700 mt-0.5">
                Belum Tertagih
              </p>
            </div>
          </div>

          {/* TABEL 1: DAFTAR AKAD KREDIT AKTIF */}
          <div className="mb-6 print-break-inside-avoid">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Rincian Portofolio Akad Kredit ({filteredData.filteredLoans.length})
              </h3>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">ID Akad</th>
                    <th className="py-2 px-2.5">Nasabah</th>
                    <th className="py-2 px-2.5">Jenis / Objek</th>
                    <th className="py-2 px-2.5 text-right">Plafon + Margin</th>
                    <th className="py-2 px-2.5 text-right">Terkumpul</th>
                    <th className="py-2 px-2.5 text-right">Sisa Piutang</th>
                    <th className="py-2 px-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-mono font-medium text-blue-900">{loan.id}</td>
                      <td className="py-2 px-2.5">
                        <span className="font-semibold text-slate-900 block">{loan.customerName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{loan.customerId}</span>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className="font-medium text-slate-800">{loan.loanTitle}</span>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                          {loan.itemDescription || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-semibold">
                        {formatRupiah(loan.totalBill)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-emerald-700">
                        {formatRupiah(loan.totalPaid)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(loan.remainingBalance)}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          loan.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-800' :
                          loan.status === 'PERHATIAN' ? 'bg-amber-100 text-amber-800' :
                          loan.status === 'MENUNGGAK' ? 'bg-rose-100 text-rose-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL 2: RIWAYAT PEMBAYARAN MASUK */}
          <div className="mb-8 print-break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              2. Rincian Pembayaran Masuk dalam Periode ({filteredData.filteredPayments.length})
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">No. Faktur</th>
                    <th className="py-2 px-2.5">Tanggal</th>
                    <th className="py-2 px-2.5">Nama Nasabah</th>
                    <th className="py-2 px-2.5">Angsuran</th>
                    <th className="py-2 px-2.5">Metode Bayar</th>
                    <th className="py-2 px-2.5 text-right">Nominal Masuk</th>
                    <th className="py-2 px-2.5 text-right">Sisa Tagihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400">
                        Tidak ada transaksi pembayaran pada rentang periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredData.filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 font-mono font-medium text-blue-900">{pay.invoiceNo}</td>
                        <td className="py-2 px-2.5 text-slate-600">{formatDateIndo(pay.date)}</td>
                        <td className="py-2 px-2.5 font-medium text-slate-900">{pay.customerName}</td>
                        <td className="py-2 px-2.5">Ke-{pay.installmentNumber} dari {pay.totalInstallments}</td>
                        <td className="py-2 px-2.5 text-slate-600">
                          {pay.paymentMethod} {pay.bankOrWalletDetail ? `(${pay.bankOrWalletDetail})` : ''}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-700">
                          {formatRupiah(pay.amount)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                          {formatRupiah(pay.remainingAfter)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIGN-OFF TANDA TANGAN PENANGGUNG JAWAB */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end print-break-inside-avoid text-xs">
            <div>
              <p className="text-[10px] text-slate-400">
                Dicetak pada: {formatDateIndo(new Date().toISOString())}<br />
                Sistem Resmi Amar Bank - Dokumen Berkas Sah
              </p>
            </div>

            <div className="text-center w-56">
              <p className="text-slate-600">{systemSettings.cityName}, {formatDateIndo(new Date().toISOString())}</p>
              <p className="font-semibold text-slate-900 mt-0.5">Penanggung Jawab Piutang,</p>
              
              <div className="my-6 border-b border-dashed border-slate-400 w-36 mx-auto"></div>
              
              <p className="font-bold text-slate-900">{systemSettings.responsibleName}</p>
              <p className="text-[10px] text-slate-500">{systemSettings.responsibleTitle}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
