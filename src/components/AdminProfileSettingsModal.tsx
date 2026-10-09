import React, { useState } from 'react';
import { AdminUser, SystemSettings } from '../types';
import { Settings, X, Save, User, Mail, Phone, Lock, Building, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdminProfileSettingsModalProps {
  currentAdmin: AdminUser;
  systemSettings: SystemSettings;
  onSaveAdmin: (updatedAdmin: AdminUser) => void;
  onSaveSystemSettings: (updatedSettings: SystemSettings) => void;
  onClose: () => void;
}

export const AdminProfileSettingsModal: React.FC<AdminProfileSettingsModalProps> = ({
  currentAdmin,
  systemSettings,
  onSaveAdmin,
  onSaveSystemSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ADMIN' | 'SYSTEM'>('ADMIN');

  // Admin profile fields
  const [fullName, setFullName] = useState(currentAdmin.fullName);
  const [email, setEmail] = useState(currentAdmin.email);
  const [phone, setPhone] = useState(currentAdmin.phone);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');

  // System settings fields
  const [cityName, setCityName] = useState(systemSettings.cityName);
  const [branchName, setBranchName] = useState(systemSettings.branchName);
  const [divisionName, setDivisionName] = useState(systemSettings.divisionName);
  const [branchAddress, setBranchAddress] = useState(systemSettings.branchAddress);
  const [branchPhone, setBranchPhone] = useState(systemSettings.branchPhone);
  const [officialWhatsApp, setOfficialWhatsApp] = useState(systemSettings.officialWhatsApp);
  const [responsibleName, setResponsibleName] = useState(systemSettings.responsibleName);
  const [responsibleTitle, setResponsibleTitle] = useState(systemSettings.responsibleTitle);

  // Status message
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmitAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Nama lengkap, email, dan nomor HP admin tidak boleh kosong.');
      return;
    }

    let finalPin = currentAdmin.pin;

    // If changing PIN
    if (newPin.trim()) {
      if (currentPinInput.trim() !== currentAdmin.pin) {
        setErrorMsg('PIN lama yang Anda masukkan tidak sesuai.');
        return;
      }
      if (newPin.length < 6) {
        setErrorMsg('PIN baru minimal harus 6 digit angka.');
        return;
      }
      if (newPin !== newPinConfirm) {
        setErrorMsg('Konfirmasi PIN baru tidak cocok.');
        return;
      }
      finalPin = newPin.trim();
    }

    const updatedAdmin: AdminUser = {
      ...currentAdmin,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      pin: finalPin,
    };

    onSaveAdmin(updatedAdmin);
    setSuccessMsg('Profil dan kredensial admin berhasil diperbarui!');
    setCurrentPinInput('');
    setNewPin('');
    setNewPinConfirm('');
  };

  const handleSubmitSystem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!cityName.trim()) {
      setErrorMsg('Nama kota penandatanganan tidak boleh kosong.');
      return;
    }

    const updatedSettings: SystemSettings = {
      cityName: cityName.trim(),
      branchName: branchName.trim(),
      divisionName: divisionName.trim(),
      branchAddress: branchAddress.trim(),
      branchPhone: branchPhone.trim(),
      officialWhatsApp: officialWhatsApp.trim(),
      responsibleName: responsibleName.trim(),
      responsibleTitle: responsibleTitle.trim(),
    };

    onSaveSystemSettings(updatedSettings);
    setSuccessMsg('Pengaturan sistem dan kop PDF berhasil disimpan!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pengaturan Profil & Sistem Aplikasi
              </h2>
              <p className="text-xs text-slate-500">
                Edit data login admin, nama kota PDF, dan identitas instansi
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

        {/* Tab Selector */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 flex gap-2 shrink-0 bg-white">
          <button
            onClick={() => {
              setActiveTab('ADMIN');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'ADMIN'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            1. Profil & PIN Admin
          </button>
          <button
            onClick={() => {
              setActiveTab('SYSTEM');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'SYSTEM'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            2. Detail Sistem & Kota PDF
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1">
          {activeTab === 'ADMIN' ? (
            <form onSubmit={handleSubmitAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-900" />
                  <span>Nama Lengkap Admin *</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-900" />
                  <span>Email Resmi / Email Pemulihan *</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs text-slate-900 outline-none font-medium"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Email ini digunakan saat meminta kode verifikasi lupa password atau reset data bersih.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-900" />
                  <span>Nomor WhatsApp / HP Admin *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs text-slate-900 outline-none"
                />
              </div>

              {/* Ganti PIN Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <Lock className="w-4 h-4 text-blue-900" />
                  <span className="text-xs font-bold text-slate-800">
                    Ubah PIN / Password Login (Opsional)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Kosongkan jika Anda tidak ingin merubah PIN saat ini.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIN Saat Ini (Wajib jika ingin ganti PIN)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Masukkan PIN saat ini"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono tracking-widest text-slate-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PIN Baru (6 Digit)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="PIN Baru"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono tracking-widest text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Konfirmasi PIN Baru
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="Ulangi PIN"
                      value={newPinConfirm}
                      onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono tracking-widest text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil Admin</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitSystem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-900" />
                  <span>Nama Kota Tertera di PDF Hasil Export *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Surabaya, Jakarta, Bandung, Medan"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs font-bold text-slate-900 outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Nama kota ini akan otomatis dicetak pada tanggal dokumen dan kolom tanda tangan laporan PDF (contoh: "{cityName}, 09 Oktober 2026").
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-blue-900" />
                  <span>Nama Instansi / Entitas Usaha *</span>
                </label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Divisi / Sub-Judul Lembaga
                </label>
                <input
                  type="text"
                  value={divisionName}
                  onChange={(e) => setDivisionName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Kantor Cabang
                </label>
                <input
                  type="text"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Telepon Kantor
                  </label>
                  <input
                    type="text"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Layanan
                  </label>
                  <input
                    type="text"
                    value={officialWhatsApp}
                    onChange={(e) => setOfficialWhatsApp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-700 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Penanggung Jawab Tanda Tangan */}
              <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-2">
                <p className="text-xs font-bold text-blue-950">
                  Data Penanggung Jawab Laporan (Tanda Tangan PDF)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nama Pejabat / Pimpinan
                    </label>
                    <input
                      type="text"
                      value={responsibleName}
                      onChange={(e) => setResponsibleName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Jabatan Resmi
                    </label>
                    <input
                      type="text"
                      value={responsibleTitle}
                      onChange={(e) => setResponsibleTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-900/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Detail Sistem & Format PDF</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
