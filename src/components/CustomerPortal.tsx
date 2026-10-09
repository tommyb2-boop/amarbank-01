import React, { useState, useMemo } from 'react';
import { Customer, Loan, Payment } from '../types';
import { formatRupiah, formatDateIndo, createWhatsAppLink } from '../utils/formatters';
import { AmarBankLogo } from './AmarBankLogo';
import { ReceiptModal } from './ReceiptModal';
import { PWAInstallButton } from './PWAInstallButton';
import {
  CreditCard,
  FileCheck,
  MessageCircle,
  LogOut,
  Calendar,
  AlertCircle,
  Receipt,
  CheckCircle,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';


interface CustomerPortalProps {
  currentCustomer: Customer;
  loans: Loan[];
  payments: Payment[];
  adminPhone: string;
  onLogout: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  currentCustomer,
  loans,
  payments,
  adminPhone,
  onLogout,
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // STRICT ZERO-LEAKAGE DATA ISOLATION: Filter ONLY current customer's data!
  const myLoans = useMemo(
    () => loans.filter((l) => l.customerId === currentCustomer.id),
    [loans, currentCustomer.id]
  );

  const myPayments = useMemo(
    () => payments.filter((p) => p.customerId === currentCustomer.id),
    [payments, currentCustomer.id]
  );

  // Summary figures
  const myTotalBill = myLoans.reduce((sum, l) => sum + l.totalBill, 0);
  const myTotalPaid = myLoans.reduce((sum, l) => sum + l.totalPaid, 0);
  const myRemaining = myLoans.reduce((sum, l) => sum + l.remainingBalance, 0);
  const activeLoans = myLoans.filter((l) => l.remainingBalance > 0);

  // Send WhatsApp confirmation to admin
  const handleConfirmViaWhatsApp = (loan?: Loan) => {
    const targetLoan = loan || activeLoans[0] || myLoans[0];
    const todayStr = formatDateIndo(new Date().toISOString());

    const message = `Halo Admin Amar Bank,

Saya ingin melakukan konfirmasi informasi tagihan/angsuran saya:
- ID Nasabah    : *${currentCustomer.id}*
- Nama Lengkap  : *${currentCustomer.fullName}*
- Akad Kredit   : *${targetLoan ? targetLoan.loanTitle : 'Pinjaman Amar Bank'}*
- Sisa Tagihan  : *${targetLoan ? formatRupiah(targetLoan.remainingBalance) : formatRupiah(myRemaining)}*
- Tanggal Cek   : ${todayStr}

Mohon bantuannya untuk informasi rekening tujuan pembayaran atau verifikasi transaksi.
Terima kasih.`;

    const link = createWhatsAppLink(adminPhone, message);
    window.open(link, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      
      {/* Top Header App Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <AmarBankLogo size="sm" showText={true} />
          
          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {currentCustomer.fullName}
              </span>
              <span className="text-[10px] text-blue-900 font-mono font-semibold">
                {currentCustomer.id}
              </span>
            </div>

            <button
              onClick={onLogout}
              title="Keluar dari Portal"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto p-4 space-y-4">
        
        {/* Welcome Greeting & Customer Card */}
        <div className="p-4 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-3xl text-white shadow-xl shadow-blue-900/15 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <span className="text-[11px] text-blue-200 font-medium">Portal Mandiri Nasabah</span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {currentCustomer.fullName}
              </h2>
            </div>
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white">
              {currentCustomer.id}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="pt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-blue-200">Total Sisa Tagihan Anda</p>
              <p className="text-xl font-extrabold font-mono tracking-tight text-white mt-0.5">
                {formatRupiah(myRemaining)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-blue-200">Total Sudah Dibayar</p>
              <p className="text-base font-bold font-mono text-emerald-300 mt-1">
                {formatRupiah(myTotalPaid)}
              </p>
            </div>
          </div>

          {/* Konfirmasi WhatsApp Admin Primary CTA */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => handleConfirmViaWhatsApp()}
              className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Konfirmasi via WhatsApp ke Admin</span>
            </button>
          </div>
        </div>

        {/* Section 1: Daftar Akad Kredit Pribadi */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-900" />
              <span>Akad Kredit Anda ({myLoans.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              {activeLoans.length} Berjalan · {myLoans.length - activeLoans.length} Lunas
            </span>
          </div>

          {myLoans.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              <FileCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">Belum ada akad kredit terdaftar atas nama Anda.</p>
            </div>
          ) : (
            myLoans.map((loan) => {
              const isLunas = loan.status === 'LUNAS';
              const isDueSoon = loan.status === 'PERHATIAN';
              const percentPaid = Math.round((loan.totalPaid / loan.totalBill) * 100);

              return (
                <div
                  key={loan.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-200 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">
                          {loan.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {loan.type === 'BARANG' ? 'Kredit Barang' : 'Pinjaman Tunai'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {loan.loanTitle}
                      </h4>
                      {loan.itemDescription && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {loan.itemDescription}
                        </p>
                      )}
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                      isLunas ? 'bg-emerald-100 text-emerald-800' :
                      isDueSoon ? 'bg-amber-100 text-amber-900 animate-pulse' :
                      'bg-blue-100 text-blue-900'
                    }`}>
                      {isLunas ? 'LUNAS' : isDueSoon ? 'DEKAT TEMPO' : 'AKTIF'}
                    </span>
                  </div>

                  {/* Progress Bar Angsuran */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-medium text-slate-600">
                      <span>Progres Pelunasan ({percentPaid}%)</span>
                      <span className="font-mono">{formatRupiah(loan.totalPaid)} / {formatRupiah(loan.totalBill)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLunas ? 'bg-emerald-500' : 'bg-blue-900'
                        }`}
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Metrics Breakdown */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400">Angsuran / Periode:</span>
                      <p className="font-mono font-bold text-slate-900">
                        {formatRupiah(loan.installmentPerPeriod)}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Per {loan.tenorUnit.toLowerCase()} (Total {loan.tenorCount}x)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Sisa Tagihan:</span>
                      <p className="font-mono font-extrabold text-blue-950">
                        {formatRupiah(loan.remainingBalance)}
                      </p>
                      {!isLunas && (
                        <p className="text-[10px] text-amber-700 font-medium">
                          Tempo: {formatDateIndo(loan.nextDueDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action on this loan */}
                  {!isLunas && (
                    <button
                      onClick={() => handleConfirmViaWhatsApp(loan)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Konfirmasi Pembayaran Tagihan Ini</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Section 2: Riwayat Pembayaran & Kwitansi Digital Resmi */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-blue-900" />
              <span>Riwayat Transaksi & Kwitansi ({myPayments.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Ketuk untuk membuka kwitansi
            </span>
          </div>

          {myPayments.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              <Clock className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
              <p className="text-xs">Belum ada riwayat pembayaran yang tercatat.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myPayments.map((payment) => (
                <div
                  key={payment.id}
                  onClick={() => setSelectedReceipt(payment)}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-blue-900 flex items-center justify-center shrink-0 transition-colors">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {payment.invoiceNo}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 font-semibold rounded">
                          LUNAS
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatDateIndo(payment.date)} · Angsuran ke-{payment.installmentNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-mono text-xs font-extrabold text-emerald-700">
                        {formatRupiah(payment.amount)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {payment.paymentMethod}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: The Update */}
        <div className="pt-6 pb-2 text-center">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            The Update
          </p>
        </div>

      </main>

      {/* Kwitansi Modal */}
      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

    </div>
  );
};
