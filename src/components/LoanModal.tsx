import React, { useState, useMemo } from 'react';
import { Customer, Loan, LoanType, TenorUnit } from '../types';
import { formatRupiah, calculateDueDate, calculateNextDueDate } from '../utils/formatters';
import { CreditCard, X, Calculator, ShoppingBag, Banknote, Calendar, Percent } from 'lucide-react';

interface LoanModalProps {
  customers: Customer[];
  existingLoans: Loan[];
  onSave: (loan: Loan) => void;
  onClose: () => void;
  preselectedCustomerId?: string;
}

export const LoanModal: React.FC<LoanModalProps> = ({
  customers,
  existingLoans,
  onSave,
  onClose,
  preselectedCustomerId,
}) => {
  const [customerId, setCustomerId] = useState<string>(
    preselectedCustomerId || (customers[0]?.id || '')
  );
  const [loanType, setLoanType] = useState<LoanType>('BARANG');
  const [loanTitle, setLoanTitle] = useState<string>('');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [principalAmount, setPrincipalAmount] = useState<number>(5000000);
  const [dpAmount, setDpAmount] = useState<number>(0);
  const [marginPercentage, setMarginPercentage] = useState<number>(5);
  const [isCustomMargin, setIsCustomMargin] = useState<boolean>(false);
  const [customMarginInput, setCustomMarginInput] = useState<string>('5');
  const [tenorCount, setTenorCount] = useState<number>(6);
  const [tenorUnit, setTenorUnit] = useState<TenorUnit>('BULAN');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Auto-generate loan ID
  const nextLoanId = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(0, 6);
    const count = existingLoans.length + 1;
    return `LN-${todayStr}-${String(count).padStart(3, '0')}`;
  }, [existingLoans]);

  // Real-time calculations
  const calculation = useMemo(() => {
    const principal = Number(principalAmount) || 0;
    const dp = Number(dpAmount) || 0;
    const netPrincipal = Math.max(0, principal - dp);
    const margin = Number(marginPercentage) || 0;
    const marginAmount = Math.round((netPrincipal * margin) / 100);
    const totalBill = netPrincipal + marginAmount;
    const tCount = Math.max(1, Number(tenorCount) || 1);
    const installmentPerPeriod = Math.round(totalBill / tCount);

    const dueDate = calculateDueDate(startDate, tCount, tenorUnit);
    const nextDueDate = calculateNextDueDate(startDate, tenorUnit, 1);

    return {
      netPrincipal,
      marginAmount,
      totalBill,
      installmentPerPeriod,
      dueDate,
      nextDueDate,
    };
  }, [principalAmount, dpAmount, marginPercentage, tenorCount, tenorUnit, startDate]);

  const presetMargins = [
    { label: '0% (Bebas Riba)', val: 0 },
    { label: '2.5%', val: 2.5 },
    { label: '5%', val: 5 },
    { label: '10%', val: 10 },
    { label: '15%', val: 15 },
    { label: '20%', val: 20 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Pilih nasabah pemohon kredit terlebih dahulu');
      return;
    }
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) {
      setError('Data nasabah tidak ditemukan');
      return;
    }
    if (principalAmount <= 0) {
      setError('Nominal pokok kredit harus lebih dari Rp 0');
      return;
    }
    if (dpAmount >= principalAmount) {
      setError('Uang muka (DP) tidak boleh melebihi atau sama dengan pokok');
      return;
    }

    const title = loanTitle.trim() || (loanType === 'BARANG' ? `Kredit ${itemDescription || 'Barang Elektronik'}` : 'Pinjaman Tunai Dana Usaha');

    const newLoan: Loan = {
      id: nextLoanId,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      type: loanType,
      loanTitle: title,
      itemDescription: loanType === 'BARANG' ? itemDescription.trim() : undefined,
      principalAmount,
      dpAmount,
      netPrincipal: calculation.netPrincipal,
      marginPercentage,
      marginAmount: calculation.marginAmount,
      totalBill: calculation.totalBill,
      tenorCount,
      tenorUnit,
      installmentPerPeriod: calculation.installmentPerPeriod,
      startDate,
      dueDate: calculation.dueDate,
      nextDueDate: calculation.nextDueDate,
      totalPaid: 0,
      remainingBalance: calculation.totalBill,
      status: 'LANCAR',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSave(newLoan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pencatatan Akad Kredit Baru
              </h2>
              <p className="text-xs text-slate-500">
                Kalkulasi otomatis margin %, DP, dan tenor fleksibel
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

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Pilih Nasabah */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Nasabah Peminjam *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 outline-none bg-white font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.id}) - {c.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Dua Jenis Transaksi: Kredit Barang vs Pinjaman Tunai */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenis Akad Pembiayaan *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLoanType('BARANG')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                  loanType === 'BARANG'
                    ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Kredit Barang</span>
              </button>
              <button
                type="button"
                onClick={() => setLoanType('TUNAI')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                  loanType === 'TUNAI'
                    ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Pinjaman Tunai</span>
              </button>
            </div>
          </div>

          {/* Judul & Deskripsi Barang / Catatan Pinjaman */}
          {loanType === 'BARANG' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Barang Kredit *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Laptop Asus ROG, Sepeda Motor Honda Vario, Kulkas LG"
                value={itemDescription}
                onChange={(e) => {
                  setItemDescription(e.target.value);
                  if (!loanTitle) setLoanTitle(`Kredit ${e.target.value}`);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tujuan / Peruntukan Dana Pinjaman Tunai *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Modal Usaha Warung Sembako, Tambahan Kas Toko"
                value={loanTitle}
                onChange={(e) => setLoanTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 outline-none"
              />
            </div>
          )}

          {/* Nominal Pokok & Uang Muka (DP) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Pokok (Harga Barang/Dana) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  required
                  min={100000}
                  step={50000}
                  value={principalAmount || ''}
                  onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 font-mono text-xs font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Uang Muka (DP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min={0}
                  step={50000}
                  value={dpAmount || 0}
                  onChange={(e) => setDpAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 font-mono text-xs font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>

          {/* PERHITUNGAN MARGIN / BUNGA PERSENTASE (%) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-blue-900" />
                <span>Margin Keuntungan / Bunga (%):</span>
              </label>
              <span className="text-xs font-mono font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded">
                {marginPercentage}%
              </span>
            </div>

            {/* Tombol Pilihan Persentase Instan */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {presetMargins.map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => {
                    setMarginPercentage(item.val);
                    setIsCustomMargin(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    !isCustomMargin && marginPercentage === item.val
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-200 border border-slate-200 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Custom margin input toggle */}
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomMargin(!isCustomMargin)}
                className="text-[11px] text-blue-800 underline hover:text-blue-950 cursor-pointer"
              >
                {isCustomMargin ? 'Gunakan pilihan preset instan' : '+ Masukkan persentase custom lainnya'}
              </button>

              {isCustomMargin && (
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={customMarginInput}
                    onChange={(e) => {
                      setCustomMarginInput(e.target.value);
                      setMarginPercentage(parseFloat(e.target.value) || 0);
                    }}
                    className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-center outline-none"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              )}
            </div>
          </div>

          {/* FLEKSIBILITAS TENOR & SATUAN WAKTU */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Satuan Tenor *
              </label>
              <select
                value={tenorUnit}
                onChange={(e) => setTenorUnit(e.target.value as TenorUnit)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs font-medium text-slate-900 outline-none bg-white"
              >
                <option value="BULAN">Bulan (Bulanan)</option>
                <option value="MINGGU">Minggu (Mingguan)</option>
                <option value="HARI">Hari (Harian)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Durasi / Jumlah Periode *
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={tenorCount}
                onChange={(e) => setTenorCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 font-mono text-xs font-semibold text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Tanggal Mulai */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-900" />
              <span>Tanggal Mulai Akad *</span>
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs text-slate-900 outline-none"
            />
          </div>

          {/* SIMULASI REAL-TIME KALKULASI TAGIHAN */}
          <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200/80 space-y-2">
            <div className="flex items-center gap-1.5 pb-1 border-b border-blue-200">
              <Calculator className="w-4 h-4 text-blue-900" />
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Simulasi Nominal Angsuran Real-Time
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-600">Pokok Bersih (Stlh DP):</span>
                <p className="font-mono font-semibold text-slate-900">
                  {formatRupiah(calculation.netPrincipal)}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Margin ({marginPercentage}%):</span>
                <p className="font-mono font-semibold text-blue-900">
                  + {formatRupiah(calculation.marginAmount)}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Total Piutang Tagihan:</span>
                <p className="font-mono font-bold text-slate-950 text-xs">
                  {formatRupiah(calculation.totalBill)}
                </p>
              </div>
              <div>
                <span className="text-slate-600">Jatuh Tempo Akhir:</span>
                <p className="font-medium text-slate-800">
                  {calculation.dueDate}
                </p>
              </div>
            </div>

            {/* Highlight Angsuran Per Periode */}
            <div className="mt-2 pt-2 border-t border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-950">
                  Angsuran per {tenorUnit === 'BULAN' ? 'Bulan' : tenorUnit === 'MINGGU' ? 'Minggu' : 'Hari'}:
                </span>
                <p className="text-[10px] text-blue-700">
                  Selama {tenorCount} kali pembayaran
                </p>
              </div>
              <span className="font-mono text-base font-extrabold text-blue-950">
                {formatRupiah(calculation.installmentPerPeriod)}
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer"
            >
              Simpan & Terbitkan Akad Kredit
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
