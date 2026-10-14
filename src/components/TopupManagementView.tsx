import React, { useState, useMemo } from 'react';
import { TopupRecord, TopupCategory } from '../types';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '../utils/formatters';
import {
  Smartphone,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Zap,
  TrendingUp,
  Receipt,
  X,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  Wallet,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react';

interface TopupManagementViewProps {
  topupRecords: TopupRecord[];
  onAddTopup: (record: TopupRecord) => void;
  onUpdateTopup: (record: TopupRecord) => void;
  onDeleteTopup: (id: string) => void;
}

const CATEGORY_LABELS: Record<TopupCategory, { label: string; icon: string; color: string }> = {
  TOKEN_PLN: { label: 'Token PLN', icon: '⚡', color: 'bg-amber-100 text-amber-800' },
  PULSA: { label: 'Pulsa Reguler', icon: '📱', color: 'bg-blue-100 text-blue-800' },
  PAKET_DATA: { label: 'Paket Data', icon: '🌐', color: 'bg-cyan-100 text-cyan-800' },
  E_WALLET: { label: 'Top Up E-Wallet', icon: '💳', color: 'bg-emerald-100 text-emerald-800' },
  TRANSFER_BANK: { label: 'Transfer Saldo', icon: '🏦', color: 'bg-purple-100 text-purple-800' },
  TAGIHAN: { label: 'Tagihan / BPJS', icon: '📑', color: 'bg-slate-100 text-slate-800' },
  LAINNYA: { label: 'Lainnya', icon: '✨', color: 'bg-gray-100 text-gray-800' },
};

export const TopupManagementView: React.FC<TopupManagementViewProps> = ({
  topupRecords,
  onAddTopup,
  onUpdateTopup,
  onDeleteTopup,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<'ALL' | 'MONTH' | 'TODAY'>('ALL');

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [targetNumber, setTargetNumber] = useState('');
  const [category, setCategory] = useState<TopupCategory>('TOKEN_PLN');
  const [productName, setProductName] = useState('');
  const [buyPrice, setBuyPrice] = useState<number | ''>('');
  const [sellPrice, setSellPrice] = useState<number | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<'LUNAS' | 'KASBON'>('LUNAS');
  const [notes, setNotes] = useState('');

  // Quick preset suggestions
  const PRESETS = [
    { cat: 'TOKEN_PLN' as TopupCategory, name: 'Token PLN 20.000', buy: 20500, sell: 23000 },
    { cat: 'TOKEN_PLN' as TopupCategory, name: 'Token PLN 50.000', buy: 50500, sell: 53000 },
    { cat: 'TOKEN_PLN' as TopupCategory, name: 'Token PLN 100.000', buy: 100500, sell: 104000 },
    { cat: 'E_WALLET' as TopupCategory, name: 'DANA 50.000', buy: 50800, sell: 53000 },
    { cat: 'E_WALLET' as TopupCategory, name: 'DANA 100.000', buy: 101000, sell: 104000 },
    { cat: 'PULSA' as TopupCategory, name: 'Pulsa Telkomsel 25.000', buy: 25200, sell: 28000 },
    { cat: 'PULSA' as TopupCategory, name: 'Pulsa Telkomsel 50.000', buy: 50300, sell: 53000 },
  ];

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setCategory(preset.cat);
    setProductName(preset.name);
    setBuyPrice(preset.buy);
    setSellPrice(preset.sell);
  };

  const calculatedProfit = useMemo(() => {
    if (sellPrice && buyPrice) {
      return Number(sellPrice) - Number(buyPrice);
    }
    return 0;
  }, [sellPrice, buyPrice]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayStr = now.toISOString().slice(0, 10);

    return topupRecords.filter((t) => {
      // Period filter
      if (selectedPeriod === 'TODAY' && t.date.slice(0, 10) !== todayStr) return false;
      if (selectedPeriod === 'MONTH') {
        const d = new Date(t.date);
        if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;

      // Status filter
      if (selectedStatus !== 'ALL' && t.paymentStatus !== selectedStatus) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.customerName.toLowerCase().includes(q);
        const matchNum = t.targetNumber.toLowerCase().includes(q);
        const matchProd = t.productName.toLowerCase().includes(q);
        if (!matchName && !matchNum && !matchProd) return false;
      }

      return true;
    });
  }, [topupRecords, selectedPeriod, selectedCategory, selectedStatus, searchQuery]);

  // Summary Metrics based on filtered
  const totalOmzet = filteredRecords.reduce((sum, t) => sum + t.sellPrice, 0);
  const totalModal = filteredRecords.reduce((sum, t) => sum + t.buyPrice, 0);
  const totalProfit = filteredRecords.reduce((sum, t) => sum + t.profit, 0);
  const totalKasbon = filteredRecords
    .filter((t) => t.paymentStatus === 'KASBON')
    .reduce((sum, t) => sum + t.sellPrice, 0);

  const handleCreateTopup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !productName.trim() || !buyPrice || !sellPrice) {
      alert('Mohon isi nama pelanggan, produk, harga modal, dan harga jual');
      return;
    }

    const buy = Number(buyPrice);
    const sell = Number(sellPrice);
    const profit = sell - buy;

    const newRecord: TopupRecord = {
      id: `TP-${Date.now()}`,
      date: new Date().toISOString(),
      customerName: customerName.trim(),
      targetNumber: targetNumber.trim() || '-',
      category,
      productName: productName.trim(),
      buyPrice: buy,
      sellPrice: sell,
      profit,
      paymentStatus,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddTopup(newRecord);
    setIsAddModalOpen(false);

    // Reset Form
    setCustomerName('');
    setTargetNumber('');
    setProductName('');
    setBuyPrice('');
    setSellPrice('');
    setNotes('');
  };

  const handleToggleKasbon = (record: TopupRecord) => {
    const updated: TopupRecord = {
      ...record,
      paymentStatus: record.paymentStatus === 'KASBON' ? 'LUNAS' : 'KASBON',
    };
    onUpdateTopup(updated);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER LEMBAR KERJA TOPUP */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Smartphone className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Lembar Kerja Jasa Topup
              </h2>
              <p className="text-xs text-slate-500">
                Pencatatan pribadi transaksi pulsa, token listrik PLN, e-wallet & pembayaran, laba terhubung ke Neraca
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Transaksi Topup</span>
        </button>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Omzet Penjualan
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
            {formatRupiah(totalOmzet)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{filteredRecords.length} transaksi</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Modal / Deposit
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-slate-700 mt-1">
            {formatRupiah(totalModal)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Modal terpakai</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Keuntungan Bersih (Laba)
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-1">
            +{formatRupiah(totalProfit)}
          </p>
          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Mengalir ke Neraca</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Kasbon / Belum Lunas
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-amber-600 mt-1">
            {formatRupiah(totalKasbon)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Piutang kasbon pelanggan</p>
        </div>
      </div>

      {/* 3. FILTER & PENCARIAN */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pelanggan, nomor HP / meteran, nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Periode */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              {(['ALL', 'MONTH', 'TODAY'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer text-xs ${
                    selectedPeriod === p
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p === 'ALL' ? 'Semua' : p === 'MONTH' ? 'Bulan Ini' : 'Hari Ini'}
                </button>
              ))}
            </div>

            {/* Kategori Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="TOKEN_PLN">⚡ Token PLN</option>
              <option value="PULSA">📱 Pulsa</option>
              <option value="PAKET_DATA">🌐 Paket Data</option>
              <option value="E_WALLET">💳 E-Wallet</option>
              <option value="TRANSFER_BANK">🏦 Transfer Bank</option>
              <option value="TAGIHAN">📑 Tagihan / BPJS</option>
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="LUNAS">Lunas</option>
              <option value="KASBON">Kasbon (Belum Bayar)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABEL DAFTAR TRANSAKSI TOPUP */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Riwayat Transaksi Jasa Topup</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {filteredRecords.length} transaksi ditampilkan
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-3">
            <Smartphone className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium">Tidak ada transaksi ditemukan.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Transaksi Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Pelanggan & Tujuan</th>
                  <th className="px-4 py-3">Produk / Layanan</th>
                  <th className="px-4 py-3 text-right">Modal</th>
                  <th className="px-4 py-3 text-right">Harga Jual</th>
                  <th className="px-4 py-3 text-right">Laba (Untung)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((t) => {
                  const catMeta = CATEGORY_LABELS[t.category] || CATEGORY_LABELS.LAINNYA;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-[11px]">
                        <div>{formatDateIndo(t.date)}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{t.customerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{t.targetNumber}</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mr-1.5 ${catMeta.color}`}>
                          {catMeta.icon} {catMeta.label}
                        </span>
                        <span className="font-medium text-slate-800">{t.productName}</span>
                        {t.notes && (
                          <div className="text-[10px] text-slate-400 italic">"{t.notes}"</div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-slate-600">
                        {formatRupiah(t.buyPrice)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-slate-900">
                        {formatRupiah(t.sellPrice)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right font-extrabold text-emerald-600">
                        +{formatRupiah(t.profit)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleToggleKasbon(t)}
                          title="Klik untuk mengubah status pembayaran"
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            t.paymentStatus === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200 animate-pulse'
                          }`}
                        >
                          {t.paymentStatus === 'LUNAS' ? '✓ Lunas' : '⏳ Kasbon'}
                        </button>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Hapus catatan transaksi ${t.productName} (${t.customerName})?`)) {
                              onDeleteTopup(t.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL TAMBAH TRANSAKSI TOPUP */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base">Catat Transaksi Jasa Topup</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTopup} className="p-5 space-y-3.5 max-h-[85vh] overflow-y-auto">
              {/* Presets Cepat */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Preset Cepat (Klik untuk isi otomatis)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Layanan *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TopupCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="TOKEN_PLN">⚡ Token PLN / Listrik</option>
                  <option value="PULSA">📱 Pulsa Reguler All Operator</option>
                  <option value="PAKET_DATA">🌐 Paket Data / Kuota</option>
                  <option value="E_WALLET">💳 E-Wallet (DANA, ShopeePay, GoPay, OVO)</option>
                  <option value="TRANSFER_BANK">🏦 Transfer Uang / Saldo</option>
                  <option value="TAGIHAN">📑 Tagihan / BPJS / PDAM</option>
                  <option value="LAINNYA">✨ Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Pembeli / Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Bu Budi, Pak RT, Mbak Rini"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Tujuan / No Meter PLN / No HP
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789 atau 54210987123"
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Produk / Nominal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Token PLN 50.000 atau DANA 100rb"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Modal / Beli (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 50500"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 53000"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Box Kalkulasi Keuntungan Otomatis */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 block">
                    Estimasi Keuntungan Bersih (Laba):
                  </span>
                  <span className="text-[10px] text-emerald-600">
                    Otomatis dihitung: Harga Jual - Modal
                  </span>
                </div>
                <span className="text-base font-extrabold text-emerald-700">
                  +{formatRupiah(calculatedProfit)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Pembayaran
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'LUNAS' | 'KASBON')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="LUNAS">✓ Lunas Langsung</option>
                    <option value="KASBON">⏳ Kasbon (Hutang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Tunai / QRIS"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Simpan Transaksi Topup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
