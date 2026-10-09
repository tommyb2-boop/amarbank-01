import React, { useState } from 'react';
import { Customer } from '../types';
import { UserPlus, X, Copy, Check, Share2, Shield, Phone, MapPin, FileText } from 'lucide-react';
import { createWhatsAppLink } from '../utils/formatters';

interface CustomerModalProps {
  existingCustomers: Customer[];
  customerToEdit?: Customer | null;
  onSave: (customer: Customer) => void;
  onClose: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  existingCustomers,
  customerToEdit,
  onSave,
  onClose,
}) => {
  // Generate next customer ID if creating new
  const nextId = React.useMemo(() => {
    if (customerToEdit) return customerToEdit.id;
    const nums = existingCustomers.map((c) => {
      const match = c.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 1000;
    });
    const maxNum = nums.length > 0 ? Math.max(...nums) : 1000;
    return `CUST-${maxNum + 1}`;
  }, [existingCustomers, customerToEdit]);

  const [id] = useState<string>(customerToEdit ? customerToEdit.id : nextId);
  const [fullName, setFullName] = useState<string>(customerToEdit?.fullName || '');
  const [phone, setPhone] = useState<string>(customerToEdit?.phone || '');
  const [address, setAddress] = useState<string>(customerToEdit?.address || '');
  const [notes, setNotes] = useState<string>(customerToEdit?.notes || '');
  const [pin, setPin] = useState<string>(customerToEdit?.pin || '123456');
  const [error, setError] = useState<string>('');
  const [savedSuccessCustomer, setSavedSuccessCustomer] = useState<Customer | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Nama lengkap nasabah wajib diisi');
      return;
    }
    if (!phone.trim()) {
      setError('Nomor telepon / WhatsApp wajib diisi');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setError('PIN akses minimal 4 digit angka');
      return;
    }

    const newCustomer: Customer = {
      id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim() || '-',
      notes: notes.trim() || undefined,
      pin: pin.trim(),
      createdAt: customerToEdit?.createdAt || new Date().toISOString(),
    };

    onSave(newCustomer);
    setSavedSuccessCustomer(newCustomer);
  };

  const handleShareCredentials = () => {
    if (!savedSuccessCustomer) return;
    const msg = `Halo Bapak/Ibu ${savedSuccessCustomer.fullName},

Akun Nasabah Anda di Amar Bank telah aktif!
Gunakan data berikut untuk masuk ke Portal Mandiri Nasabah:
- ID Nasabah: *${savedSuccessCustomer.id}* (atau No. HP)
- PIN Akses : *${savedSuccessCustomer.pin}*

Di portal ini, Anda dapat memantau tagihan, riwayat angsuran, serta mengunduh Kwitansi Digital resmi.
Terima kasih,
Amar Bank Indonesia`;
    const waUrl = createWhatsAppLink(savedSuccessCustomer.phone, msg);
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {customerToEdit ? 'Ubah Data Nasabah' : 'Pendaftaran Nasabah Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                Kode ID otomatis & pembuatan PIN portal mandiri
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

        {savedSuccessCustomer ? (
          /* Success Dialog with Share Credentials Action */
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Nasabah Berhasil Disimpan!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Data nasabah dan akses PIN telah tersimpan dengan aman di sistem.
              </p>
            </div>

            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ID Nasabah Unik:</span>
                <span className="font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {savedSuccessCustomer.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nama Lengkap:</span>
                <span className="font-semibold text-slate-900">{savedSuccessCustomer.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">No. WhatsApp / HP:</span>
                <span className="font-semibold text-slate-900">{savedSuccessCustomer.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">PIN Login Nasabah:</span>
                <span className="font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {savedSuccessCustomer.pin}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleShareCredentials}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim ID & PIN via WhatsApp ke Nasabah</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`ID: ${savedSuccessCustomer.id}\nPIN: ${savedSuccessCustomer.pin}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Berhasil Disalin!' : 'Salin Kredensial'}</span>
              </button>
              <button
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors mt-1 cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            {/* Unique Auto ID Display */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ID / Kode Unik Nasabah (Otomatis)
              </label>
              <div className="flex items-center px-3.5 py-2.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 font-mono text-sm font-bold">
                {id}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Kode akun resmi ini digunakan nasabah untuk login ke Portal Pelanggan.
              </p>
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Nasabah *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 outline-none transition-all"
              />
            </div>

            {/* No WhatsApp / Telepon */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-blue-900" />
                <span>Nomor WhatsApp / HP Aktif *</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 outline-none transition-all"
              />
            </div>

            {/* Alamat Domisili */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-900" />
                <span>Alamat Domisili Lengkap</span>
              </label>
              <textarea
                rows={2}
                placeholder="Alamat rumah, kelurahan, kecamatan, kota..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 outline-none transition-all resize-none"
              />
            </div>

            {/* Catatan Khusus */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-900" />
                <span>Catatan Khusus (Pekerjaan / Usaha)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Pemilik Warung Madura, Karyawan BUMN, dll"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-xs text-slate-900 outline-none transition-all"
              />
            </div>

            {/* Buat PIN Akses Nasabah */}
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
              <label className="block text-xs font-semibold text-blue-950 mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-900" />
                <span>Buat PIN Akses Portal Nasabah *</span>
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="6 Digit PIN (contoh: 123456)"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-blue-200 focus:border-blue-700 font-mono text-sm tracking-widest text-blue-900 outline-none transition-all"
              />
              <p className="text-[10px] text-blue-800 mt-1">
                PIN ini akan digunakan nasabah saat masuk ke portal mandiri.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer"
              >
                {customerToEdit ? 'Simpan Perubahan Nasabah' : 'Daftarkan Nasabah & Buat Akses'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
