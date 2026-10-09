import React, { useState, useMemo } from 'react';
import { Loan, Payment, PaymentMethod } from '../types';
import { formatRupiah, calculateNextDueDate } from '../utils/formatters';
import { Banknote, X, Check, QrCode, CreditCard, Wallet } from 'lucide-react';

interface PaymentModalProps {
  loans: Loan[];
  preselectedLoanId?: string;
  onRecordPayment: (payment: Payment, updatedLoan: Loan) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  loans,
  preselectedLoanId,
  onRecordPayment,
  onClose,
}) => {
  const activeLoans = useMemo(() => loans.filter((l) => l.remainingBalance > 0), [loans]);

  const [selectedLoanId, setSelectedLoanId] = useState<string>(
    preselectedLoanId || (activeLoans[0]?.id || '')
  );

  const selectedLoan = useMemo(
    () => loans.find((l) => l.id === selectedLoanId),
    [loans, selectedLoanId]
  );

  const defaultPayAmount = selectedLoan
    ? Math.min(selectedLoan.installmentPerPeriod, selectedLoan.remainingBalance)
    : 0;

  const [payAmount, setPayAmount] = useState<number>(defaultPayAmount);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER_BANK');
  const [bankOrWalletDetail, setBankOrWalletDetail] = useState<string>('BCA Virtual Account');
  const [referenceNumber, setReferenceNumber] = useState<string>(
    `TRX-${Math.floor(10000000 + Math.random() * 90000000)}`
  );
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Update payment amount when loan selection changes
  React.useEffect(() => {
    if (selectedLoan) {
      setPayAmount(Math.min(selectedLoan.installmentPerPeriod, selectedLoan.remainingBalance));
    }
  }, [selectedLoanId, selectedLoan]);

  const remainingAfter = useMemo(() => {
    if (!selectedLoan) return 0;
    return Math.max(0, selectedLoan.remainingBalance - (Number(payAmount) || 0));
  }, [selectedLoan, payAmount]);

  const isFullPayment = remainingAfter === 0;

  // Invoice Number generator
  const invoiceNo = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(0, 6);
    const rand = Math.floor(100 + Math.random() * 900);
    return `KW-${todayStr}-${rand}`;
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) {
      setError('Pilih tagihan pinjaman yang akan dibayar');
      return;
    }
    if (payAmount <= 0) {
      setError('Nominal pembayaran harus lebih dari Rp 0');
      return;
    }
    if (payAmount > selectedLoan.remainingBalance) {
      setError('Nominal pembayaran melebihi sisa tagihan berjalan');
      return;
    }

    const currentInstallmentNumber = Math.min(
      selectedLoan.tenorCount,
      Math.floor((selectedLoan.totalPaid / selectedLoan.installmentPerPeriod) + 1)
    );

    const payment: Payment = {
      id: `PAY-${Date.now()}`,
      invoiceNo,
      loanId: selectedLoan.id,
      loanTitle: selectedLoan.loanTitle,
      customerId: selectedLoan.customerId,
      customerName: selectedLoan.customerName,
      customerPhone: selectedLoan.customerPhone,
      amount: payAmount,
      installmentNumber: currentInstallmentNumber,
      totalInstallments: selectedLoan.tenorCount,
      remainingAfter,
      paymentMethod,
      bankOrWalletDetail,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      date: new Date().toISOString(),
      verifiedBy: 'Bambang Prasetyo (Admin Amar Bank)',
    };

    // Update loan record
    const newTotalPaid = selectedLoan.totalPaid + payAmount;
    const newRemaining = Math.max(0, selectedLoan.totalBill - newTotalPaid);
    const newStatus = newRemaining === 0 ? 'LUNAS' : selectedLoan.status;
    const nextDueDate = newRemaining === 0
      ? selectedLoan.dueDate
      : calculateNextDueDate(selectedLoan.startDate, selectedLoan.tenorUnit, currentInstallmentNumber + 1);

    const updatedLoan: Loan = {
      ...selectedLoan,
      totalPaid: newTotalPaid,
      remainingBalance: newRemaining,
      status: newStatus,
      nextDueDate,
    };

    onRecordPayment(payment, updatedLoan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Catat Pembayaran Angsuran
              </h2>
              <p className="text-xs text-slate-500">
                Pencatatan kas masuk & penerbitan kwitansi otomatis
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Pilih Pinjaman Aktif */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Tagihan Pinjaman Nasabah *
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs font-medium text-slate-900 outline-none bg-white"
            >
              {activeLoans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.customerName} - {l.loanTitle} (Sisa: {formatRupiah(l.remainingBalance)})
                </option>
              ))}
            </select>
          </div>

          {selectedLoan && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">ID Nasabah:</span>
                <span className="font-mono font-semibold text-blue-900">{selectedLoan.customerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Plafon:</span>
                <span className="font-mono font-medium text-slate-800">{formatRupiah(selectedLoan.totalBill)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sisa Piutang Saat Ini:</span>
                <span className="font-mono font-bold text-slate-950">{formatRupiah(selectedLoan.remainingBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Angsuran Standar:</span>
                <span className="font-mono font-medium text-blue-800">
                  {formatRupiah(selectedLoan.installmentPerPeriod)} / {selectedLoan.tenorUnit.toLowerCase()}
                </span>
              </div>
            </div>
          )}

          {/* Nominal Pembayaran */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Nominal Pembayaran Diterima *
              </label>
              {selectedLoan && (
                <button
                  type="button"
                  onClick={() => setPayAmount(selectedLoan.remainingBalance)}
                  className="text-[11px] font-semibold text-blue-800 hover:text-blue-950 underline cursor-pointer"
                >
                  Bayar Lunas Total ({formatRupiah(selectedLoan.remainingBalance)})
                </button>
              )}
            </div>
            
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="number"
                required
                min={1000}
                max={selectedLoan?.remainingBalance || 999999999}
                value={payAmount || ''}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 font-mono text-sm font-bold text-slate-900 outline-none"
              />
            </div>

            {/* Quick buttons */}
            {selectedLoan && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setPayAmount(Math.min(selectedLoan.installmentPerPeriod, selectedLoan.remainingBalance))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
                >
                  1x Angsuran ({formatRupiah(selectedLoan.installmentPerPeriod)})
                </button>
                <button
                  type="button"
                  onClick={() => setPayAmount(Math.min(selectedLoan.installmentPerPeriod * 2, selectedLoan.remainingBalance))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium cursor-pointer"
                >
                  2x Angsuran
                </button>
              </div>
            )}
          </div>

          {/* OPSI METODE PEMBAYARAN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Metode Pembayaran *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'TUNAI', label: 'Tunai (Cash)', icon: Banknote },
                { id: 'TRANSFER_BANK', label: 'Transfer Bank', icon: CreditCard },
                { id: 'QRIS', label: 'QRIS Dinamis', icon: QrCode },
                { id: 'E_WALLET', label: 'Dompet Digital', icon: Wallet },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as PaymentMethod);
                      if (m.id === 'TUNAI') setBankOrWalletDetail('Kas Tunai Teller');
                      if (m.id === 'TRANSFER_BANK') setBankOrWalletDetail('BCA Virtual Account');
                      if (m.id === 'QRIS') setBankOrWalletDetail('QRIS Amar Bank');
                      if (m.id === 'E_WALLET') setBankOrWalletDetail('GoPay / DANA');
                    }}
                    className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail Bank / E-Wallet */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detail Bank / Kanal / Referensi
            </label>
            <input
              type="text"
              placeholder="Contoh: BCA VA, Kasir Cabang, QRIS Statis, OVO, dll"
              value={bankOrWalletDetail}
              onChange={(e) => setBankOrWalletDetail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs text-slate-900 outline-none"
            />
          </div>

          {/* Ringkasan Status Setelah Bayar */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isFullPayment
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Status Setelah Bayar:</span>
              <span className={`px-2 py-0.5 rounded-md font-bold ${
                isFullPayment
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-blue-200 text-blue-950'
              }`}>
                {isFullPayment ? '★ LUNAS 100%' : 'CICILAN BERJALAN'}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs">
              <span className="text-slate-600">Sisa Piutang Akhir:</span>
              <span className="font-mono font-extrabold text-slate-950 text-sm">
                {formatRupiah(remainingAfter)}
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pembayaran & Terbitkan E-Receipt</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
