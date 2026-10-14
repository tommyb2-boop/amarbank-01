import React, { useState } from 'react';
import { DebtRecord, DebtInstallment } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import {
  Banknote,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  CreditCard,
  Building,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Receipt,
  X,
  History,
  FileText,
} from 'lucide-react';

interface HutangManagementViewProps {
  debts: DebtRecord[];
  onAddDebt: (debt: DebtRecord) => void;
  onUpdateDebt: (debt: DebtRecord) => void;
  onDeleteDebt: (debtId: string) => void;
  onAddDebtPayment: (debtId: string, installment: DebtInstallment) => void;
}

export const HutangManagementView: React.FC<HutangManagementViewProps> = ({
  debts,
  onAddDebt,
  onUpdateDebt,
  onDeleteDebt,
  onAddDebtPayment,
}) => {
  // Modal / Form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<DebtRecord | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  // New Debt Form State
  const [lenderName, setLenderName] = useState('');
  const [principalAmount, setPrincipalAmount] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  });
  const [category, setCategory] = useState('Modal Usaha & Operasional');
  const [notes, setNotes] = useState('');

  // Payment Installment Form State
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentNotes, setPaymentNotes] = useState('');

  // Summary Metrics
  const totalPrincipal = debts.reduce((sum, d) => sum + d.principalAmount, 0);
  const totalPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0);
  const totalRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const activeDebtsCount = debts.filter((d) => d.status !== 'LUNAS').length;

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lenderName.trim() || !principalAmount || Number(principalAmount) <= 0) {
      alert('Mohon isi nama pemberi pinjaman dan jumlah hutang dengan benar');
      return;
    }

    const newDebt: DebtRecord = {
      id: `HT-${Date.now()}`,
      lenderName: lenderName.trim(),
      principalAmount: Number(principalAmount),
      paidAmount: 0,
      remainingAmount: Number(principalAmount),
      startDate,
      dueDate,
      category,
      notes: notes.trim(),
      status: 'BELUM_LUNAS',
      installments: [],
      createdAt: new Date().toISOString(),
    };

    onAddDebt(newDebt);
    setIsAddModalOpen(false);
    // Reset form
    setLenderName('');
    setPrincipalAmount('');
    setNotes('');
  };

  const handleRecordInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPayment || !paymentAmount || Number(paymentAmount) <= 0) {
      return;
    }

    const payAmt = Number(paymentAmount);
    const newInstallment: DebtInstallment = {
      id: `INS-${Date.now()}`,
      date: paymentDate,
      amount: payAmt,
      notes: paymentNotes.trim() || 'Pembayaran angsuran hutang',
    };

    onAddDebtPayment(selectedDebtForPayment.id, newInstallment);
    setSelectedDebtForPayment(null);
    setPaymentAmount('');
    setPaymentNotes('');
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER LEMBAR KERJA HUTANG */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <Banknote className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Lembar Kerja Hutang Saya
              </h2>
              <p className="text-xs text-slate-500">
                Pencatatan pribadi kewajiban hutang usaha atau pribadi, terhubung otomatis ke Neraca Keuangan
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Catatan Hutang</span>
        </button>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Hutang Pokok
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
            {formatRupiah(totalPrincipal)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{debts.length} catatan hutang</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Total Sudah Dicicil
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-1">
            {formatRupiah(totalPaid)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Uang kas keluar</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
            Sisa Kewajiban Hutang
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-rose-700 mt-1">
            {formatRupiah(totalRemaining)}
          </p>
          <p className="text-[10px] text-rose-500 mt-0.5">Belum terlunasi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            Kreditor Aktif
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-blue-900 mt-1">
            {activeDebtsCount} <span className="text-xs font-normal text-slate-500">Pihak</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Status belum lunas</p>
        </div>
      </div>

      {/* 3. DAFTAR HUTANG */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-rose-600" />
            <span>Daftar Hutang & Angsuran</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Total {debts.length} pinjaman
          </span>
        </div>

        {debts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-3">
            <Banknote className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium">Belum ada catatan hutang.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Hutang Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {debts.map((debt) => {
              const isExpanded = expandedDebtId === debt.id;
              const percentPaid = debt.principalAmount > 0 
                ? Math.min(100, Math.round((debt.paidAmount / debt.principalAmount) * 100))
                : 0;

              return (
                <div key={debt.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900">
                          {debt.lenderName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            debt.status === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : debt.status === 'SEBAGIAN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {debt.status === 'LUNAS' ? 'LUNAS 100%' : debt.status === 'SEBAGIAN' ? 'SEBAGIAN' : 'BELUM DIBAYAR'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        {debt.category && (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {debt.category}
                          </span>
                        )}
                        <span>Pinjam: {formatDateIndo(debt.startDate)}</span>
                        <span>•</span>
                        <span>Jatuh Tempo: {formatDateIndo(debt.dueDate)}</span>
                      </div>

                      {debt.notes && (
                        <p className="text-xs text-slate-600 italic">"{debt.notes}"</p>
                      )}
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400">Sisa Hutang</p>
                          <p className="font-extrabold text-sm text-rose-600">
                            {formatRupiah(debt.remainingAmount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400">Pokok Pinjaman</p>
                          <p className="font-bold text-slate-900">
                            {formatRupiah(debt.principalAmount)}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full sm:w-48 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentPaid}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {percentPaid}% terbayar ({formatRupiah(debt.paidAmount)})
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {debt.status !== 'LUNAS' && (
                        <button
                          onClick={() => {
                            setSelectedDebtForPayment(debt);
                            setPaymentAmount(Math.min(debt.remainingAmount, 1000000));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Bayar Angsuran</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Riwayat ({debt.installments?.length || 0})</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Hapus catatan hutang ke "${debt.lenderName}"?`)) {
                          onDeleteDebt(debt.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Hutang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Expandable Riwayat Angsuran */}
                  {isExpanded && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-700" />
                        <span>Riwayat Cicilan Pembayaran:</span>
                      </p>

                      {debt.installments && debt.installments.length > 0 ? (
                        <div className="space-y-1.5">
                          {debt.installments.map((ins, idx) => (
                            <div
                              key={ins.id}
                              className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200/60"
                            >
                              <div className="space-y-0.5">
                                <span className="font-semibold text-slate-900">
                                  Angsuran #{idx + 1}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {formatDateIndo(ins.date)} • {ins.notes || 'Pembayaran'}
                                </span>
                              </div>
                              <span className="font-extrabold text-emerald-600">
                                +{formatRupiah(ins.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Belum ada angsuran yang dicatat.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: TAMBAH CATATAN HUTANG BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-rose-200" />
                <h3 className="font-bold text-base">Tambah Catatan Hutang Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pemberi Pinjaman / Kreditor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Bank Mandiri KUR, Pak Budi, Supplier Pulsa"
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Hutang Pokok (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  placeholder="Contoh: 10000000"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                {principalAmount && Number(principalAmount) > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Terbaca: <span className="font-bold text-rose-700">{formatRupiah(Number(principalAmount))}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Pinjam
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Keperluan
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Modal Usaha & Operasional">Modal Usaha & Operasional</option>
                  <option value="Deposit Saldo Jasa Topup">Deposit Saldo Jasa Topup</option>
                  <option value="Likuiditas Kas Pinjaman">Likuiditas Kas Pinjaman</option>
                  <option value="Kebutuhan Pribadi">Kebutuhan Pribadi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan rekening tujuan, perjanjian, dsb"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Simpan Catatan Hutang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CATAT PEMBAYARAN ANGSURAN */}
      {selectedDebtForPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base">Catat Angsuran Pembayaran</h3>
              </div>
              <button
                onClick={() => setSelectedDebtForPayment(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordInstallment} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">{selectedDebtForPayment.lenderName}</p>
                <p className="text-slate-600">
                  Sisa Hutang Saat Ini: <span className="font-bold text-rose-600">{formatRupiah(selectedDebtForPayment.remainingAmount)}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Angsuran yang Dibayar (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={selectedDebtForPayment.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {paymentAmount && Number(paymentAmount) > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Nominal: <span className="font-bold text-emerald-700">{formatRupiah(Number(paymentAmount))}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Pembayaran
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Metode (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Transfer Bank Mandiri, setor tunai"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDebtForPayment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
