import { Customer, Loan, Payment } from '../types';
import { formatRupiah, formatDateIndo } from './formatters';

export function downloadSpreadsheet(
  customers: Customer[],
  loans: Loan[],
  payments: Payment[]
) {
  // Generate a multi-sheet compatible HTML table format with .xls extension (native Excel readable with styling)
  const today = new Date().toISOString().split('T')[0];

  const html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Rekapitulasi Amar Bank</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    <style>
      body { font-family: Calibri, sans-serif; }
      .header { background-color: #0D47A1; color: white; font-weight: bold; text-align: center; }
      .subheader { background-color: #E3F2FD; font-weight: bold; }
      .title { font-size: 16pt; font-weight: bold; color: #0D47A1; }
      .table-header { background-color: #1565C0; color: white; font-weight: bold; }
      .number { text-align: right; }
      .center { text-align: center; }
      td, th { border: 1px solid #B0BEC5; padding: 6px; }
    </style>
  </head>
  <body>
    <table>
      <tr><td colspan="8" class="title">AMAR BANK - REKAPITULASI KREDIT, PIUTANG & ANGSURAN</td></tr>
      <tr><td colspan="8">Tanggal Unduh: ${today} | Sistem Pencatatan Resmi</td></tr>
      <tr><td colspan="8"></td></tr>

      <!-- BAGIAN 1: AKAD KREDIT & PIUTANG -->
      <tr class="header"><td colspan="8">I. DAFTAR AKAD KREDIT & PIUTANG NASABAH</td></tr>
      <tr class="table-header">
        <th>ID Kredit</th>
        <th>ID Nasabah</th>
        <th>Nama Nasabah</th>
        <th>Jenis Kredit</th>
        <th>Deskripsi / Catatan</th>
        <th>Total Plafon (Pokok + Margin)</th>
        <th>Sudah Dibayar</th>
        <th>Sisa Piutang</th>
        <th>Status</th>
      </tr>
      ${loans.map(l => `
        <tr>
          <td class="center">${l.id}</td>
          <td class="center">${l.customerId}</td>
          <td>${l.customerName}</td>
          <td class="center">${l.type}</td>
          <td>${l.itemDescription || l.loanTitle}</td>
          <td class="number">${formatRupiah(l.totalBill)}</td>
          <td class="number">${formatRupiah(l.totalPaid)}</td>
          <td class="number">${formatRupiah(l.remainingBalance)}</td>
          <td class="center">${l.status}</td>
        </tr>
      `).join('')}

      <tr><td colspan="8"></td></tr>
      <!-- BAGIAN 2: RIWAYAT PEMBAYARAN MASUK -->
      <tr class="header"><td colspan="8">II. RIWAYAT PEMBAYARAN MASUK & KWITANSI</td></tr>
      <tr class="table-header">
        <th>No. Faktur (Kwitansi)</th>
        <th>ID Kredit</th>
        <th>Nama Nasabah</th>
        <th>Tanggal & Jam</th>
        <th>Angsuran Ke</th>
        <th>Nominal Bayar</th>
        <th>Metode Pembayaran</th>
        <th>Sisa Setelah Bayar</th>
      </tr>
      ${payments.map(p => `
        <tr>
          <td class="center">${p.invoiceNo}</td>
          <td class="center">${p.loanId}</td>
          <td>${p.customerName}</td>
          <td>${formatDateIndo(p.date)}</td>
          <td class="center">${p.installmentNumber} / ${p.totalInstallments}</td>
          <td class="number">${formatRupiah(p.amount)}</td>
          <td class="center">${p.paymentMethod} (${p.bankOrWalletDetail || '-'})</td>
          <td class="number">${formatRupiah(p.remainingAfter)}</td>
        </tr>
      `).join('')}

      <tr><td colspan="8"></td></tr>
      <!-- BAGIAN 3: DATA MASTER NASABAH -->
      <tr class="header"><td colspan="8">III. DATA MASTER NASABAH TERDAFTAR</td></tr>
      <tr class="table-header">
        <th>ID Nasabah</th>
        <th>Nama Lengkap</th>
        <th>No. WhatsApp / HP</th>
        <th colspan="3">Alamat Domisili</th>
        <th colspan="2">Catatan Khusus</th>
      </tr>
      ${customers.map(c => `
        <tr>
          <td class="center">${c.id}</td>
          <td>${c.fullName}</td>
          <td>'${c.phone}</td>
          <td colspan="3">${c.address}</td>
          <td colspan="2">${c.notes || '-'}</td>
        </tr>
      `).join('')}
    </table>
  </body>
  </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AmarBank_Backup_Rekapitulasi_${today}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openEmailBackup(
  email: string,
  customers: Customer[],
  loans: Loan[],
  payments: Payment[]
) {
  const today = new Date().toISOString().split('T')[0];
  const totalPiutang = loans.reduce((acc, l) => acc + l.totalBill, 0);
  const totalTerkumpul = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalSisa = loans.reduce((acc, l) => acc + l.remainingBalance, 0);

  const subject = `[Backup Data] Amar Bank - Rekapitulasi Kredit & Piutang (${today})`;

  const body = `Yth. Administrator Amar Bank,

Berikut adalah ringkasan rekapitulasi data kredit, piutang, dan angsuran Amar Bank per ${today}:

RINGKASAN KEUANGAN:
- Total Plafon Piutang Disalurkan : ${formatRupiah(totalPiutang)}
- Total Pembayaran Terkumpul      : ${formatRupiah(totalTerkumpul)}
- Total Sisa Piutang Berjalan     : ${formatRupiah(totalSisa)}
- Jumlah Nasabah Terdaftar        : ${customers.length} Orang
- Jumlah Akad Kredit Aktif        : ${loans.filter(l => l.status !== 'LUNAS').length} Akad
- Total Transaksi Pembayaran      : ${payments.length} Transaksi

DETAIL NASABAH & AKAD:
${loans.map((l, idx) => `${idx + 1}. [${l.customerId}] ${l.customerName} - ${l.loanTitle}
   Plafon: ${formatRupiah(l.totalBill)} | Sisa: ${formatRupiah(l.remainingBalance)} | Status: ${l.status}`).join('\n')}

Catatan:
File spreadsheet (.xls) lengkap juga dapat diunduh langsung melalui tombol "Unduh File Spreadsheet" di aplikasi Amar Bank.

Salam,
Sistem Manajemen Kredit Amar Bank
Dicetak secara otomatis`;

  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, '_blank');
}

export function backupDatabaseJSON(
  payload: {
    customers: Customer[];
    loans: Loan[];
    payments: Payment[];
    systemSettings?: any;
    exportedAt: string;
    version: string;
  }
) {
  const dateStr = new Date().toISOString().split('T')[0];
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AmarBank_Database_Backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

