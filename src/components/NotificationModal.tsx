import React from 'react';
import { NotificationItem, Loan } from '../types';
import { formatDateIndo, createWhatsAppLink, formatRupiah } from '../utils/formatters';
import { Bell, CheckCheck, Trash2, X, AlertTriangle, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';

interface NotificationModalProps {
  notifications: NotificationItem[];
  loans: Loan[];
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notifications,
  loans,
  onClose,
  onMarkAllAsRead,
  onClearAll,
  onMarkAsRead,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleSendWaReminder = (notif: NotificationItem) => {
    if (!notif.loanId) return;
    const loan = loans.find((l) => l.id === notif.loanId);
    if (!loan) return;

    const message = `Yth. Bapak/Ibu ${loan.customerName},

Kami dari Amar Bank ingin menginformasikan pengingat jatuh tempo angsuran kredit Anda:
- Akad: ${loan.loanTitle}
- Jumlah Angsuran: ${formatRupiah(loan.installmentPerPeriod)}
- Jatuh Tempo: ${formatDateIndo(loan.nextDueDate)}
- Sisa Pokok: ${formatRupiah(loan.remainingBalance)}

Mohon melakukan pembayaran sebelum tanggal jatuh tempo melalui Transfer, QRIS, atau kasir Amar Bank.
Terima kasih atas kerja samanya.`;

    const waUrl = createWhatsAppLink(loan.customerPhone, message);
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pusat Notifikasi & Jatuh Tempo
              </h2>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} peringatan baru belum dibaca` : 'Semua notifikasi telah dibaca'}
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

        {/* Action Controls */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
          <button
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className={`flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
              unreadCount > 0 ? 'text-blue-700 hover:text-blue-900' : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCheck className="w-4 h-4" />
            <span>Tandai Semua Dibaca</span>
          </button>

          <button
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className={`flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
              notifications.length > 0 ? 'text-rose-600 hover:text-rose-800' : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Riwayat</span>
          </button>
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/50 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Kotak Notifikasi Bersih</p>
              <p className="text-xs text-slate-500 mt-0.5">Tidak ada peringatan jatuh tempo saat ini.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isDueSoon = notif.type === 'DUE_SOON';
              const isOverdue = notif.type === 'OVERDUE';
              const isPayment = notif.type === 'PAYMENT';

              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead(notif.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    !notif.isRead
                      ? isDueSoon || isOverdue
                        ? 'bg-amber-50/70 border-amber-200 shadow-xs'
                        : 'bg-blue-50/70 border-blue-200'
                      : 'bg-white border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isOverdue ? 'bg-rose-100 text-rose-700' :
                      isDueSoon ? 'bg-amber-100 text-amber-800' :
                      isPayment ? 'bg-emerald-100 text-emerald-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {isOverdue || isDueSoon ? <AlertTriangle className="w-4 h-4" /> :
                       isPayment ? <CheckCircle2 className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {formatDateIndo(notif.date)}
                        </span>

                        {notif.loanId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendWaReminder(notif);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Kirim WA Pengingat</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
