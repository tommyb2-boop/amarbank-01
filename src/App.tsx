import React, { useState, useEffect } from 'react';
import { AdminUser, Customer, Loan, Payment, NotificationItem, SystemSettings } from './types';
import {
  INITIAL_ADMINS,
  INITIAL_CUSTOMERS,
  INITIAL_LOANS,
  INITIAL_PAYMENTS,
  INITIAL_NOTIFICATIONS,
  DEFAULT_SYSTEM_SETTINGS,
} from './data/initialData';
import { AuthScreen } from './components/AuthScreen';
import { AdminPortal } from './components/AdminPortal';
import { CustomerPortal } from './components/CustomerPortal';
import { getDaysDifference } from './utils/formatters';
import { Smartphone, Monitor } from 'lucide-react';

const STORAGE_KEY_ADMINS = 'amar_bank_admins_v2';
const STORAGE_KEY_CUSTOMERS = 'amar_bank_customers_v2';
const STORAGE_KEY_LOANS = 'amar_bank_loans_v2';
const STORAGE_KEY_PAYMENTS = 'amar_bank_payments_v2';
const STORAGE_KEY_NOTIFS = 'amar_bank_notifs_v2';
const STORAGE_KEY_SETTINGS = 'amar_bank_settings_v2';
const STORAGE_KEY_SESSION = 'amar_bank_session_v2';

export default function App() {
  // 1. Admins state (initial default PIN: 987654, email: dicoba.ngetes@gmail.com)
  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMINS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_ADMINS;
    } catch {
      return INITIAL_ADMINS;
    }
  });

  // 2. System Settings state (city name, branch info, signature)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SYSTEM_SETTINGS;
    } catch {
      return DEFAULT_SYSTEM_SETTINGS;
    }
  });

  // 3. Customers state
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      return saved !== null ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  // 4. Loans state
  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOANS);
      return saved !== null ? JSON.parse(saved) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  });

  // 5. Payments state
  const [payments, setPayments] = useState<Payment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PAYMENTS);
      return saved !== null ? JSON.parse(saved) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  // 6. Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return saved !== null ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // 7. Auth Session:
  // "buat juga agar setiap pertama perangkat baru membuka aplikasi ini, harus login dulu, jika sudah pernah login maka selanjutnya akan langsung bisa masuk otomatis."
  const [currentUser, setCurrentUser] = useState<{
    role: 'ADMIN' | 'CUSTOMER' | null;
    adminData?: AdminUser;
    customerData?: Customer;
  }>(() => {
    try {
      // Remove legacy keys
      localStorage.removeItem('amar_bank_session_v1');
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'ADMIN' || parsed.role === 'CUSTOMER')) {
          return parsed; // Direct auto-login on returning device!
        }
      }
      return { role: null }; // First time device must login first!
    } catch {
      return { role: null };
    }
  });

  // Optional Phone Simulation Frame Toggle (desktop view)
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(admins));
    } catch (e) {
      console.error(e);
    }
  }, [admins]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(systemSettings));
    } catch (e) {
      console.error(e);
    }
  }, [systemSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error(e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(loans));
    } catch (e) {
      console.error(e);
    }
  }, [loans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
    } catch (e) {
      console.error(e);
    }
  }, [payments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      if (currentUser.role) {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Automatic Due-Date Check (≤ 3 days detection for notifications)
  useEffect(() => {
    setLoans((prevLoans) => {
      let hasChanges = false;
      const updatedLoans = prevLoans.map((loan) => {
        if (loan.remainingBalance <= 0) {
          if (loan.status !== 'LUNAS') {
            hasChanges = true;
            return { ...loan, status: 'LUNAS' as const };
          }
          return loan;
        }

        const daysDiff = getDaysDifference(loan.nextDueDate);
        if (daysDiff < 0 && loan.status !== 'MENUNGGAK') {
          hasChanges = true;
          return { ...loan, status: 'MENUNGGAK' as const };
        } else if (daysDiff >= 0 && daysDiff <= 3 && loan.status !== 'PERHATIAN') {
          hasChanges = true;
          return { ...loan, status: 'PERHATIAN' as const };
        }
        return loan;
      });

      return hasChanges ? updatedLoans : prevLoans;
    });
  }, []);

  // Handlers
  const handleAdminLogin = (admin: AdminUser) => {
    const session = {
      role: 'ADMIN' as const,
      adminData: admin,
    };
    setCurrentUser(session);
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCustomerLogin = (customer: Customer) => {
    const session = {
      role: 'CUSTOMER' as const,
      customerData: customer,
    };
    setCurrentUser(session);
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetAdminPin = (email: string, newPin: string) => {
    setAdmins((prev) =>
      prev.map((a) => (a.email.toLowerCase() === email.toLowerCase() ? { ...a, pin: newPin } : a))
    );
  };

  const handleLogout = () => {
    setCurrentUser({ role: null });
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCustomer = (customer: Customer) => {
    setCustomers((prev) => [customer, ...prev]);
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCust.id ? updatedCust : c))
    );
    setLoans((prev) =>
      prev.map((l) =>
        l.customerId === updatedCust.id
          ? { ...l, customerName: updatedCust.fullName, customerPhone: updatedCust.phone }
          : l
      )
    );
  };

  const handleAddLoan = (loan: Loan) => {
    setLoans((prev) => [loan, ...prev]);
  };

  const handleRecordPayment = (payment: Payment, updatedLoan: Loan) => {
    setPayments((prev) => [payment, ...prev]);
    setLoans((prev) =>
      prev.map((l) => (l.id === updatedLoan.id ? updatedLoan : l))
    );

    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: 'Pembayaran Baru Terverifikasi',
      message: `${payment.customerName} membayar angsuran ${payment.loanTitle} sebesar ${payment.amount.toLocaleString('id-ID')} via ${payment.paymentMethod}.`,
      type: 'PAYMENT',
      loanId: payment.loanId,
      customerId: payment.customerId,
      date: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  // Update Admin Profile & Credentials
  const handleUpdateAdmin = (updatedAdmin: AdminUser) => {
    setAdmins((prev) =>
      prev.map((a) => (a.id === updatedAdmin.id ? updatedAdmin : a))
    );
    if (currentUser.adminData?.id === updatedAdmin.id) {
      setCurrentUser((prev) => ({ ...prev, adminData: updatedAdmin }));
    }
  };

  // Update System Settings (City Name, Branch details)
  const handleUpdateSystemSettings = (updatedSettings: SystemSettings) => {
    setSystemSettings(updatedSettings);
  };

  // Reset Semua Data (Kembali Bersih Tanpa Debitur Satupun, Kecuali Data Admin)
  const handleResetAllData = () => {
    setCustomers([]);
    setLoans([]);
    setPayments([]);
    setNotifications([]);
  };

  // Restore Database from JSON
  const handleRestoreData = (payload: {
    customers: Customer[];
    loans: Loan[];
    payments: Payment[];
    systemSettings?: SystemSettings;
  }) => {
    if (Array.isArray(payload.customers)) setCustomers(payload.customers);
    if (Array.isArray(payload.loans)) setLoans(payload.loans);
    if (Array.isArray(payload.payments)) setPayments(payload.payments);
    if (payload.systemSettings) setSystemSettings(payload.systemSettings);
  };

  // Active Admin Data fallback
  const activeAdmin = currentUser.adminData || admins[0] || INITIAL_ADMINS[0];

  return (
    <div className={`min-h-screen ${isPhoneFrame ? 'bg-slate-900 py-6 px-4 flex items-center justify-center' : 'bg-slate-100'} relative`}>
      
      {/* Device Frame View Switcher (Desktop Convenience for smartphone preview) */}
      <div className="fixed top-3 right-3 z-50 no-print hidden md:flex items-center gap-1.5 p-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/20 shadow-md">
        <button
          onClick={() => setIsPhoneFrame(false)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            !isPhoneFrame ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
          title="Tampilan Penuh"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Layar Penuh</span>
        </button>
        <button
          onClick={() => setIsPhoneFrame(true)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            isPhoneFrame ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
          title="Simulasi Ponsel Pintar"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile Frame</span>
        </button>
      </div>

      {/* Frame Container */}
      <div
        className={`w-full transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[420px] h-[860px] bg-white rounded-[44px] shadow-2xl border-[10px] border-slate-800 overflow-y-auto relative ring-1 ring-white/10'
            : 'min-h-screen'
        }`}
      >
        {/* Notch for Phone frame simulation */}
        {isPhoneFrame && (
          <div className="sticky top-0 z-50 w-32 h-5 bg-slate-800 rounded-b-xl mx-auto flex items-center justify-center pointer-events-none mb-1">
            <div className="w-3 h-3 rounded-full bg-slate-950 mr-2" />
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>
        )}

        {/* 1. If not logged in -> Show AuthScreen */}
        {!currentUser.role && (
          <AuthScreen
            admins={admins}
            customers={customers}
            onAdminLogin={handleAdminLogin}
            onCustomerLogin={handleCustomerLogin}
            onResetAdminPin={handleResetAdminPin}
          />
        )}

        {/* 2. If logged in as ADMIN -> Show AdminPortal */}
        {currentUser.role === 'ADMIN' && (
          <AdminPortal
            currentAdmin={activeAdmin}
            systemSettings={systemSettings}
            customers={customers}
            loans={loans}
            payments={payments}
            notifications={notifications}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onAddLoan={handleAddLoan}
            onRecordPayment={handleRecordPayment}
            onMarkNotificationAsRead={handleMarkNotificationAsRead}
            onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
            onClearAllNotifications={handleClearAllNotifications}
            onUpdateAdmin={handleUpdateAdmin}
            onUpdateSystemSettings={handleUpdateSystemSettings}
            onResetAllData={handleResetAllData}
            onRestoreData={handleRestoreData}
            onLogout={handleLogout}
          />
        )}

        {/* 3. If logged in as CUSTOMER -> Show CustomerPortal (Zero Leakage) */}
        {currentUser.role === 'CUSTOMER' && currentUser.customerData && (
          <CustomerPortal
            currentCustomer={currentUser.customerData}
            loans={loans}
            payments={payments}
            adminPhone={systemSettings.officialWhatsApp || activeAdmin.phone || '0812-9876-5432'}
            onLogout={handleLogout}
          />
        )}
      </div>

    </div>
  );
}
