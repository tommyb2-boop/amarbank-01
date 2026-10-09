import React, { useState } from 'react';
import { Loan } from '../types';
import { formatRupiah, formatDateIndo, createWhatsAppLink } from '../utils/formatters';
import { AmarBankLogo } from './AmarBankLogo';
import { Printer, Share2, Copy, Check, X, FileCheck } from 'lucide-react';

interface LoanReceiptModalProps {
  loan: Loan | null;
  onClose: () => void;
}

export const LoanReceiptModal: React.FC<LoanReceiptModalProps> = ({ loan, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!loan) return null;

  const invoiceNo = `AKAD-${loan.id.replace('LN-', '')}`;

  const receiptSummaryText = `*KWITANSI RESMI AKAD PEMBIAYAAN - AMAR BANK*
Nomor Registrasi: ${invoiceNo}
Tanggal Akad    : ${formatDateIndo(loan.startDate)}
---------------------------------------------
ID Nasabah   : *${loan.customerId}*
Nama Nasabah : *${loan.customerName}*
Akad Kredit  : *${loan.loanTitle}*
${loan.itemDescription ? `Deskripsi    : ${loan.itemDescription}\n` : ''}Tipe         : ${loan.type === 'BARANG' ? 'Kredit Barang' : 'Pinjaman Tunai'}
Pokok Bersih : ${formatRupiah(loan.netPrincipal)} ${loan.dpAmount > 0 ? `(DP: ${formatRupiah(loan.dpAmount)})` : ''}
Margin (%)   : ${loan.marginPercentage}% (+${formatRupiah(loan.marginAmount)})
---------------------------------------------
TOTAL PLAFON : *${formatRupiah(loan.totalBill)}*
ANGSURAN     : *${formatRupiah(loan.installmentPerPeriod)}* / ${loan.tenorUnit.toLowerCase()}
Tenor        : ${loan.tenorCount} ${loan.tenorUnit.toLowerCase()}
Jatuh Tempo 1: ${formatDateIndo(loan.nextDueDate)}
Jatuh Tempo Akhir: ${formatDateIndo(loan.dueDate)}
---------------------------------------------
Status Akad  : *DISETUJUI & AKTIF RESMI*
Verifikasi   : Kantor Pelayanan Amar Bank

Selamat atas penerbitan akad pembiayaan Anda!
Amar Bank - Mitra Keuangan Amanah.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const link = createWhatsAppLink(loan.customerPhone || '081234567890', receiptSummaryText);
    window.open(link, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        
        {/* Top Action Bar (Non-print) */}
        <div className="no-print flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Kwitansi Akad Kredit Baru Diterbitkan
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kwitansi Body (Printable Area) */}
        <div id="printable-loan-receipt" className="p-6 md:p-8 bg-white relative">
          
          {/* Header Kop Resmi Amar Bank */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-100">
            <div>
              <AmarBankLogo size="sm" showText={true} />
              <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                PT BANK AMAR INDONESIA Tbk<br />
                Sistem Pembiayaan & Piutang Nasabah
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block text-[10px] font-bold tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                BUKTI AKAD RESMI
              </span>
              <p className="font-mono text-xs font-bold text-slate-900 mt-1">
                {invoiceNo}
              </p>
              <p className="text-[11px] text-slate-500">
                {formatDateIndo(loan.startDate)}
              </p>
            </div>
          </div>

          {/* Customer & Loan Overview */}
          <div className="mt-4 p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100">
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] font-medium text-slate-500">Nasabah Penerima Fasilitas</span>
              <span className="font-mono text-xs font-semibold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                {loan.customerId}
              </span>
            </div>
            <p className="text-base font-bold text-slate-900 mt-1">
              {loan.customerName}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {loan.loanTitle}
            </p>
            {loan.itemDescription && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {loan.itemDescription}
              </p>
            )}
          </div>

          {/* Loan Details Rows */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span className="text-slate-500">Pokok Bersih (Harga/Modal)</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatRupiah(loan.netPrincipal)}
                {loan.dpAmount > 0 && ` (DP: ${formatRupiah(loan.dpAmount)})`}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span className="text-slate-500">Margin Keuntungan ({loan.marginPercentage}%)</span>
              <span className="font-mono font-semibold text-blue-900">
                +{formatRupiah(loan.marginAmount)}
              </span>
            </div>

            <div className="flex justify-between py-1.5 bg-blue-50/80 px-3 rounded-xl border border-blue-100">
              <span className="text-blue-900 font-semibold self-center">Total Plafon Pinjaman</span>
              <span className="font-mono text-base font-extrabold text-blue-950">
                {formatRupiah(loan.totalBill)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span className="text-slate-500">Angsuran / Periode</span>
              <span className="font-mono font-bold text-emerald-800">
                {formatRupiah(loan.installmentPerPeriod)} / {loan.tenorUnit.toLowerCase()}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span className="text-slate-500">Jangka Waktu Tenor</span>
              <span className="font-semibold text-slate-800">
                {loan.tenorCount} Kali Angsuran ({loan.tenorUnit})
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
              <span className="text-slate-500">Jatuh Tempo Pertama</span>
              <span className="font-medium text-slate-800">
                {formatDateIndo(loan.nextDueDate)}
              </span>
            </div>
          </div>

          {/* Official Stamp & Verification */}
          <div className="mt-5 pt-3 flex items-center justify-between border-t border-slate-100">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-900">
                <FileCheck className="w-4 h-4 text-blue-700" />
                <span>Akad Disetujui</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Petugas Verifikator Amar Bank
              </p>
            </div>

            {/* Stempel Resmi */}
            <div className="relative border-2 border-dashed border-blue-700 px-3 py-1.5 rounded-lg rotate-[-5deg] bg-blue-50/70 shadow-xs">
              <div className="text-center">
                <span className="block text-[8px] font-bold tracking-widest text-blue-950 uppercase">
                  AMAR BANK RESMI
                </span>
                <span className="block text-xs font-black tracking-wider text-blue-900">
                  ★ AKAD SAH ★
                </span>
                <span className="block text-[8px] font-medium text-blue-700">
                  DITERBITKAN
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-4 text-center text-[10px] text-slate-400">
            Simpan bukti akad pembiayaan ini sebagai referensi resmi pembayaran angsuran.
          </div>
        </div>

        {/* Action Buttons (Non-Printable) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim ke WhatsApp Pelanggan</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-medium text-xs transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Teks Kwitansi Akad Berhasil Disalin!' : 'Salin Teks Akad'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
