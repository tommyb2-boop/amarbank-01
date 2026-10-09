export type LoanType = 'BARANG' | 'TUNAI';
export type TenorUnit = 'BULAN' | 'MINGGU' | 'HARI';
export type LoanStatus = 'LANCAR' | 'PERHATIAN' | 'MENUNGGAK' | 'LUNAS';
export type PaymentMethod = 'TUNAI' | 'TRANSFER_BANK' | 'QRIS' | 'E_WALLET';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  pin: string;
  createdAt: string;
}

export interface Customer {
  id: string; // e.g. CUST-1001
  fullName: string;
  phone: string;
  address: string;
  notes?: string;
  pin: string;
  createdAt: string;
}

export interface Loan {
  id: string; // e.g. LN-202610-001
  customerId: string;
  customerName: string;
  customerPhone: string;
  type: LoanType;
  itemDescription?: string; // e.g. HP Samsung, Laptop Asus
  loanTitle: string; // Title or purpose
  principalAmount: number; // Pokok harga barang / jumlah pinjaman
  dpAmount: number; // Uang muka
  netPrincipal: number; // Pokok setelah DP
  marginPercentage: number; // Margin bunga % (0%, 2.5%, 5%, 10%, etc)
  marginAmount: number; // Nominal margin
  totalBill: number; // netPrincipal + marginAmount
  tenorCount: number; // Durasi tenor
  tenorUnit: TenorUnit; // Bulan, Minggu, Hari
  installmentPerPeriod: number; // Tagihan per periode
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD (jatuh tempo akhir)
  nextDueDate: string; // YYYY-MM-DD (jatuh tempo angsuran berikutnya)
  totalPaid: number; // Total yang sudah dibayarkan
  remainingBalance: number; // Sisa piutang
  status: LoanStatus;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceNo: string; // e.g. KW-202610-001
  loanId: string;
  loanTitle: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  installmentNumber: number;
  totalInstallments: number;
  remainingAfter: number;
  paymentMethod: PaymentMethod;
  bankOrWalletDetail?: string; // e.g. 'Bank Amar', 'BCA', 'QRIS Mandiri', 'GoPay'
  referenceNumber?: string;
  notes?: string;
  date: string; // ISO string
  verifiedBy: string; // e.g. 'Bambang Prasetyo (Admin Amar Bank)'
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'DUE_SOON' | 'OVERDUE' | 'PAYMENT' | 'SYSTEM';
  loanId?: string;
  customerId?: string;
  date: string;
  isRead: boolean;
  daysRemaining?: number;
}

export interface SystemSettings {
  cityName: string; // e.g. 'Surabaya'
  branchName: string; // e.g. 'PT Bank Amar Indonesia Tbk'
  divisionName: string; // e.g. 'Divisi Manajemen Piutang & Pembiayaan Ritel'
  branchAddress: string; // e.g. 'Graha Amar, Jl. Basuki Rahmat 122'
  branchPhone: string; // e.g. '(031) 567-8910'
  officialWhatsApp: string; // e.g. '0812-9876-5432'
  responsibleName: string; // e.g. 'Bambang Prasetyo, S.E.'
  responsibleTitle: string; // e.g. 'Head of Retail & Credit Admin'
}

