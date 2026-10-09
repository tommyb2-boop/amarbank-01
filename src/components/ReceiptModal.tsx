import React, { useState } from 'react';
import { Payment } from '../types';
import { formatRupiah, formatDateTimeIndo, createWhatsAppLink } from '../utils/formatters';
import { AmarBankLogo } from './AmarBankLogo';
import { Printer, Share2, Copy, Check, X, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  payment: Payment | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!payment) return null;

  const receiptSummaryText = `*KWITANSI DIGITAL RESMI - AMAR BANK*
Nomor Faktur: ${payment.invoiceNo}
Tanggal & Jam: ${formatDateTimeIndo(payment.date)}
--------------------------------------
ID Nasabah : ${payment.customerId}
Nama       : ${payment.customerName}
Akad Kredit: ${payment.loanTitle}
Angsuran   : Ke-${payment.installmentNumber} dari ${payment.totalInstallments}
Jumlah Bayar: ${formatRupiah(payment.amount)}
Metode     : ${payment.paymentMethod} (${payment.bankOrWalletDetail || '-'})
Sisa Piutang: ${formatRupiah(payment.remainingAfter)}
Status     : ${payment.remainingAfter === 0 ? 'LUNAS (100%)' : 'BERJALAN'}
Verifikasi : ${payment.verifiedBy}
--------------------------------------
Terima kasih atas pembayaran tepat waktu Anda.
Amar Bank - Mitra Keuangan Amanah.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const link = createWhatsAppLink(payment.customerPhone || '081234567890', receiptSummaryText);
    window.open(link, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        
        {/* Top Action Bar (Non-print) */}
        <div className="no-print flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              E-Receipt Resmi
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kwitansi Body (Printable Area) */}
        <div id="printable-receipt" className="p-6 md:p-8 bg-white relative">
          
          {/* Header Kop Resmi Amar Bank */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-100">
            <div>
              <AmarBankLogo size="sm" showText={true} />
              <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                Jl. Basuki Rahmat No. 122, Surabaya<br />
                WhatsApp Layanan: 0812-9876-5432
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block text-[10px] font-bold tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                FAKTUR PEMBAYARAN
              </span>
              <p className="font-mono text-xs font-bold text-slate-900 mt-1">
                {payment.invoiceNo}
              </p>
              <p className="text-[11px] text-slate-500">
                {formatDateTimeIndo(payment.date)}
              </p>
            </div>
          </div>

          {/* Customer & Loan Overview */}
          <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] font-medium text-slate-500">Penerima Tagihan</span>
              <span className="font-mono text-xs font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                {payment.customerId}
              </span>
            </div>
            <p className="text-base font-bold text-slate-900 mt-1">
              {payment.customerName}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {payment.loanTitle}
            </p>
          </div>

          {/* Payment Detail Rows */}
          <div className="mt-5 space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
              <span className="text-slate-500">Angsuran Periode</span>
              <span className="font-semibold text-slate-800">
                Ke-{payment.installmentNumber} dari {payment.totalInstallments} Periode
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
              <span className="text-slate-500">Metode Pembayaran</span>
              <span className="font-semibold text-slate-800">
                {payment.paymentMethod === 'TUNAI' ? 'Kas Tunai' :
                 payment.paymentMethod === 'TRANSFER_BANK' ? 'Transfer Bank' :
                 payment.paymentMethod === 'QRIS' ? 'QRIS Digital' : 'E-Wallet'}
                {payment.bankOrWalletDetail ? ` (${payment.bankOrWalletDetail})` : ''}
              </span>
            </div>

            {payment.referenceNumber && (
              <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                <span className="text-slate-500">No. Referensi / Transaksi</span>
                <span className="font-mono font-medium text-slate-700">{payment.referenceNumber}</span>
              </div>
            )}

            <div className="flex justify-between py-2 bg-blue-50/80 px-3 rounded-xl border border-blue-100">
              <span className="text-blue-900 font-semibold self-center">Nominal Dibayarkan</span>
              <span className="font-mono text-lg font-extrabold text-blue-900">
                {formatRupiah(payment.amount)}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
              <span className="text-slate-500">Sisa Piutang Berjalan</span>
              <span className="font-mono font-bold text-slate-800">
                {formatRupiah(payment.remainingAfter)}
              </span>
            </div>
          </div>

          {/* Official Stamp & Verification */}
          <div className="mt-6 pt-3 flex items-center justify-between border-t border-slate-100">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Terverifikasi Sistem</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Oleh: {payment.verifiedBy}
              </p>
            </div>

            {/* Stempel Lunas Resmi Amar Bank */}
            <div className="relative border-2 border-dashed border-emerald-600 px-3 py-1.5 rounded-lg rotate-[-6deg] bg-emerald-50/70 shadow-xs">
              <div className="text-center">
                <span className="block text-[8px] font-bold tracking-widest text-emerald-800 uppercase">
                  AMAR BANK RESMI
                </span>
                <span className="block text-xs font-black tracking-wider text-emerald-700">
                  {payment.remainingAfter === 0 ? '★ LUNAS TOTAL ★' : '✓ DITERIMA'}
                </span>
                <span className="block text-[8px] font-medium text-emerald-600">
                  KASIR AMAR
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-5 text-center text-[10px] text-slate-400">
            Simpan kwitansi digital ini sebagai bukti sah transaksi angsuran Amar Bank.
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
              <span>Kirim WhatsApp</span>
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
            <span>{copied ? 'Teks Kwitansi Berhasil Disalin!' : 'Salin Teks Kwitansi'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
