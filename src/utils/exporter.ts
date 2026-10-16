import { Customer, Loan, Payment, DebtRecord, TopupRecord, SystemSettings } from '../types';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from './formatters';

export function downloadSpreadsheet(
  customers: Customer[],
  loans: Loan[],
  payments: Payment[],
  debts: DebtRecord[] = [],
  topupRecords: TopupRecord[] = [],
  systemSettings?: SystemSettings
) {
  // Generate a multi-section compatible HTML table format with .xls extension (native Excel readable with high-fidelity styling)
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const branchCity = systemSettings?.cityName || 'Surabaya';
  const branchName = systemSettings?.branchName || 'PT Bank Amar Indonesia Tbk';

  // 1. REKAP KREDIT & PIUTANG NASABAH
  let totalPlafon = 0;
  let totalPokokBersih = 0;
  let totalMarginKredit = 0;
  let totalTerbayar = 0;
  let totalSisaPiutang = 0;
  let totalLabaMarginDiterima = 0;
  let totalSisaMargin = 0;

  loans.forEach((loan) => {
    totalPlafon += loan.totalBill;
    totalPokokBersih += loan.netPrincipal;
    totalMarginKredit += loan.marginAmount;
    totalTerbayar += loan.totalPaid;
    totalSisaPiutang += loan.remainingBalance;

    const marginRatio = loan.totalBill > 0 ? loan.marginAmount / loan.totalBill : 0;
    const labaMarginPaid = Math.round(loan.totalPaid * marginRatio);
    const marginRemaining = Math.max(0, loan.marginAmount - labaMarginPaid);

    totalLabaMarginDiterima += labaMarginPaid;
    totalSisaMargin += marginRemaining;
  });

  // 2. REKAP HUTANG SAYA (KEWAJIBAN)
  let totalHutangPokok = 0;
  let totalHutangDibayar = 0;
  let totalSisaHutang = 0;

  debts.forEach((debt) => {
    totalHutangPokok += debt.principalAmount;
    totalHutangDibayar += debt.paidAmount;
    totalSisaHutang += debt.remainingAmount;
  });

  // 3. REKAP PENGHASILAN JASA TOPUP
  let totalOmzetTopup = 0;
  let totalModalTopup = 0;
  let totalProfitTopup = 0;
  let totalKasbonTopup = 0;

  topupRecords.forEach((t) => {
    totalOmzetTopup += t.sellPrice;
    totalModalTopup += t.buyPrice;
    totalProfitTopup += t.profit;
    if (t.paymentStatus === 'KASBON') {
      totalKasbonTopup += t.sellPrice;
    }
  });

  // 4. ARUS KEUANGAN & NERACA BERSIH
  const totalLabaBersihDiterima = totalLabaMarginDiterima + totalProfitTopup;
  const totalAkumulasiLabaUsaha = totalMarginKredit + totalProfitTopup;
  const netAssets = totalSisaPiutang + totalProfitTopup - totalSisaHutang;
  const isHealthy = netAssets >= 0;

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
      body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
      .header-main { background-color: #0B2A6B; color: #FFFFFF; font-weight: bold; text-align: center; font-size: 14pt; padding: 12px; }
      .section-header { background-color: #0D47A1; color: white; font-weight: bold; font-size: 11pt; padding: 8px; }
      .section-header-green { background-color: #1B5E20; color: white; font-weight: bold; font-size: 11pt; padding: 8px; }
      .section-header-rose { background-color: #B71C1C; color: white; font-weight: bold; font-size: 11pt; padding: 8px; }
      .table-header { background-color: #1976D2; color: white; font-weight: bold; font-size: 10pt; }
      .table-header-green { background-color: #2E7D32; color: white; font-weight: bold; font-size: 10pt; }
      .table-header-rose { background-color: #C62828; color: white; font-weight: bold; font-size: 10pt; }
      .table-header-amber { background-color: #E65100; color: white; font-weight: bold; font-size: 10pt; }
      .title { font-size: 16pt; font-weight: bold; color: #0B2A6B; }
      .subtitle { font-size: 11pt; color: #37474F; }
      .kpi-title { background-color: #ECEFF1; font-weight: bold; }
      .kpi-val { font-weight: bold; }
      .kpi-profit { background-color: #E8F5E9; color: #1B5E20; font-weight: bold; }
      .kpi-debt { background-color: #FFEBEE; color: #B71C1C; font-weight: bold; }
      .number { text-align: right; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      td, th { border: 1px solid #CFD8DC; padding: 6px; }
    </style>
  </head>
  <body>
    <table>
      <!-- KOP RESMI LAPORAN -->
      <tr><td colspan="10" class="header-main">AMAR BANK - LAPORAN KEUANGAN LENGKAP & REKAPITULASI RESMI</td></tr>
      <tr><td colspan="10" class="center subtitle">Cabang / Wilayah: ${branchCity} (${branchName}) | Waktu Ekspor: ${formatDateTimeIndo(now.toISOString())}</td></tr>
      <tr><td colspan="10" class="center">Dokumen Rekapitulasi Menyeluruh: Neraca Keuangan, Kredit & Piutang, Hutang Saya, dan Transaksi Jasa Topup</td></tr>
      <tr><td colspan="10"></td></tr>

      <!-- ========================================================= -->
      <!-- BAGIAN I: REKAPAN UTAMA NERACA KEUANGAN & LABA RUGI -->
      <!-- ========================================================= -->
      <tr class="section-header"><td colspan="10">I. NERACA KEUANGAN & STATUS LABA USAHA</td></tr>
      <tr class="table-header">
        <th colspan="3">Pos Neraca Keuangan</th>
        <th colspan="3">Nominal (Rupiah)</th>
        <th colspan="4">Keterangan / Status Integrasi</th>
      </tr>
      <tr>
        <td colspan="3" class="kpi-title">Total Plafon Kredit Disalurkan (Akad)</td>
        <td colspan="3" class="number bold">${formatRupiah(totalPlafon)}</td>
        <td colspan="4">Total seluruh tagihan dari ${loans.length} akad kredit terbit</td>
      </tr>
      <tr>
        <td colspan="3" class="kpi-title">Total Angsuran Kredit Diterima (Kas Masuk)</td>
        <td colspan="3" class="number bold kpi-profit">+${formatRupiah(totalTerbayar)}</td>
        <td colspan="4">Total kas riil yang telah diangsur oleh nasabah</td>
      </tr>
      <tr>
        <td colspan="3" class="kpi-title">Sisa Aset Piutang di Nasabah</td>
        <td colspan="3" class="number bold">${formatRupiah(totalSisaPiutang)}</td>
        <td colspan="4">Pokok Bersih: ${formatRupiah(totalPokokBersih)} | Sisa Margin: ${formatRupiah(totalSisaMargin)}</td>
      </tr>
      <tr class="kpi-profit">
        <td colspan="3" class="kpi-title">Laba Margin Kredit Diterima (Realisasi Kas)</td>
        <td colspan="3" class="number bold">+${formatRupiah(totalLabaMarginDiterima)}</td>
        <td colspan="4">Keuntungan bunga/margin kredit yang SUDAH DIBAYAR nasabah</td>
      </tr>
      <tr class="kpi-profit">
        <td colspan="3" class="kpi-title">Laba Bersih dari Jasa Topup</td>
        <td colspan="3" class="number bold">+${formatRupiah(totalProfitTopup)}</td>
        <td colspan="4">Keuntungan murni dari ${topupRecords.length} transaksi pulsa/token/transfer</td>
      </tr>
      <tr style="background-color: #E8F5E9;">
        <td colspan="3" class="bold" style="color: #1B5E20; font-size: 11pt;">★ TOTAL LABA BERSIH OPERASIONAL KAS</td>
        <td colspan="3" class="number bold" style="color: #1B5E20; font-size: 12pt;">+${formatRupiah(totalLabaBersihDiterima)}</td>
        <td colspan="4" class="bold" style="color: #1B5E20;">Total Realisasi Keuntungan Riil (Kredit Terbayar + Topup)</td>
      </tr>
      <tr>
        <td colspan="3" class="kpi-title">Total Seluruh Potensi Laba Usaha</td>
        <td colspan="3" class="number bold">+${formatRupiah(totalAkumulasiLabaUsaha)}</td>
        <td colspan="4">Total margin bunga seluruh akad kredit + laba bersih topup</td>
      </tr>
      <tr class="kpi-debt">
        <td colspan="3" class="kpi-title">Total Sisa Kewajiban Hutang Saya</td>
        <td colspan="3" class="number bold">-${formatRupiah(totalSisaHutang)}</td>
        <td colspan="4">Total hutang pokok yang masih wajib dibayarkan (${debts.filter(d => d.status !== 'LUNAS').length} aktif)</td>
      </tr>
      <tr style="background-color: #E3F2FD;">
        <td colspan="3" class="bold" style="color: #0D47A1; font-size: 11pt;">★ POSISI NILAI BERSIH (NET ASSETS)</td>
        <td colspan="3" class="number bold" style="color: #0D47A1; font-size: 12pt;">${formatRupiah(netAssets)}</td>
        <td colspan="4" class="bold" style="color: #0D47A1;">Status: ${isHealthy ? 'SURPLUS & SEHAT' : 'PERHATIAN DEFISIT'}</td>
      </tr>
      <tr><td colspan="10"></td></tr>

      <!-- ========================================================= -->
      <!-- BAGIAN II: LEMBAR KERJA KREDIT & PIUTANG NASABAH -->
      <!-- ========================================================= -->
      <tr class="section-header"><td colspan="10">II. LEMBAR KERJA KREDIT & PIUTANG NASABAH</td></tr>
      <tr class="table-header">
        <th>ID Kredit</th>
        <th>ID Nasabah</th>
        <th>Nama Nasabah</th>
        <th>Jenis</th>
        <th>Judul Akad / Barang</th>
        <th>Pokok Pinjaman</th>
        <th>Margin Keuntungan</th>
        <th>Total Plafon</th>
        <th>Sudah Terbayar</th>
        <th>Sisa Piutang</th>
      </tr>
      ${loans.map((l) => `
        <tr>
          <td class="center">${l.id}</td>
          <td class="center">${l.customerId}</td>
          <td><b>${l.customerName}</b></td>
          <td class="center">${l.type}</td>
          <td>${l.itemDescription || l.loanTitle}</td>
          <td class="number">${formatRupiah(l.principalAmount)}</td>
          <td class="number" style="color: #1B5E20;">+${formatRupiah(l.marginAmount)} (${l.marginPercentage}%)</td>
          <td class="number bold">${formatRupiah(l.totalBill)}</td>
          <td class="number" style="color: #2E7D32;">${formatRupiah(l.totalPaid)}</td>
          <td class="number bold" style="${l.remainingBalance > 0 ? 'color: #C62828;' : 'color: #1565C0;'}">${formatRupiah(l.remainingBalance)}</td>
        </tr>
      `).join('')}
      <tr><td colspan="10"></td></tr>

      <!-- ========================================================= -->
      <!-- BAGIAN III: RIWAYAT PEMBAYARAN MASUK / KWITANSI -->
      <!-- ========================================================= -->
      <tr class="section-header"><td colspan="10">III. RIWAYAT PEMBAYARAN ANGSURAN MASUK & KWITANSI</td></tr>
      <tr class="table-header">
        <th>No. Kwitansi / Faktur</th>
        <th>ID Kredit</th>
        <th>Nama Nasabah</th>
        <th>Tanggal & Jam</th>
        <th>Angsuran Ke</th>
        <th>Nominal Bayar</th>
        <th>Metode Pembayaran</th>
        <th>No. Referensi</th>
        <th colspan="2">Sisa Piutang Setelah Bayar</th>
      </tr>
      ${payments.map((p) => `
        <tr>
          <td class="center"><b>${p.invoiceNo}</b></td>
          <td class="center">${p.loanId}</td>
          <td>${p.customerName}</td>
          <td>${formatDateIndo(p.date)}</td>
          <td class="center">${p.installmentNumber} / ${p.totalInstallments}</td>
          <td class="number bold" style="color: #1B5E20;">+${formatRupiah(p.amount)}</td>
          <td class="center">${p.paymentMethod} ${p.bankOrWalletDetail ? `(${p.bankOrWalletDetail})` : ''}</td>
          <td class="center">${p.referenceNumber || '-'}</td>
          <td colspan="2" class="number bold">${formatRupiah(p.remainingAfter)}</td>
        </tr>
      `).join('')}
      <tr><td colspan="10"></td></tr>

      <!-- ========================================================= -->
      <!-- BAGIAN IV: LEMBAR KERJA HUTANG SAYA (KEWAJIBAN PRIBADI) -->
      <!-- ========================================================= -->
      <tr class="section-header-rose"><td colspan="10">IV. LEMBAR KERJA HUTANG SAYA (KEWAJIBAN & PENCATATAN PRIBADI)</td></tr>
      <tr class="table-header-rose">
        <th>ID Hutang</th>
        <th>Pemberi Pinjaman (Lender)</th>
        <th>Kategori</th>
        <th>Total Hutang Pokok</th>
        <th>Sudah Terbayar</th>
        <th>Sisa Hutang</th>
        <th>Tanggal Pinjam</th>
        <th>Jatuh Tempo</th>
        <th>Status</th>
        <th>Mutasi Angsuran</th>
      </tr>
      ${debts.length === 0 ? `
        <tr><td colspan="10" class="center" style="color: #78909C; font-style: italic;">Tidak ada catatan hutang pribadi yang tersimpan.</td></tr>
      ` : debts.map((d) => `
        <tr>
          <td class="center"><b>${d.id}</b></td>
          <td><b>${d.lenderName}</b></td>
          <td class="center">${d.category || 'Bank/Pribadi'}</td>
          <td class="number bold">${formatRupiah(d.principalAmount)}</td>
          <td class="number" style="color: #2E7D32;">${formatRupiah(d.paidAmount)}</td>
          <td class="number bold" style="color: #B71C1C;">${formatRupiah(d.remainingAmount)}</td>
          <td class="center">${d.startDate ? formatDateIndo(d.startDate) : '-'}</td>
          <td class="center">${d.dueDate ? formatDateIndo(d.dueDate) : '-'}</td>
          <td class="center"><b>${d.status}</b></td>
          <td class="center">${d.installments?.length || 0}x bayar</td>
        </tr>
      `).join('')}
      <tr><td colspan="10"></td></tr>

      <!-- ========================================================= -->
      <!-- BAGIAN V: LEMBAR KERJA PENGHASILAN JASA TOPUP -->
      <!-- ========================================================= -->
      <tr class="section-header-green"><td colspan="10">V. LEMBAR KERJA PENGHASILAN JASA TOPUP (PULSA, TOKEN, TRANSFER)</td></tr>
      <tr class="table-header-green">
        <th>ID Transaksi</th>
        <th>Tanggal</th>
        <th>Kategori</th>
        <th>Nama Pelanggan</th>
        <th>No. Tujuan / Rekening</th>
        <th>Nama Produk</th>
        <th>Harga Modal (Beli)</th>
        <th>Harga Jual (Omzet)</th>
        <th>Laba Bersih</th>
        <th>Status Pembayaran</th>
      </tr>
      ${topupRecords.length === 0 ? `
        <tr><td colspan="10" class="center" style="color: #78909C; font-style: italic;">Belum ada catatan transaksi jasa topup yang tersimpan.</td></tr>
      ` : topupRecords.map((t) => `
        <tr>
          <td class="center"><b>${t.id}</b></td>
          <td>${formatDateIndo(t.date)}</td>
          <td class="center">${t.category}</td>
          <td><b>${t.customerName}</b></td>
          <td class="center">${t.targetNumber}</td>
          <td>${t.productName}</td>
          <td class="number">${formatRupiah(t.buyPrice)}</td>
          <td class="number bold">${formatRupiah(t.sellPrice)}</td>
          <td class="number bold" style="color: #1B5E20;">+${formatRupiah(t.profit)}</td>
          <td class="center" style="${t.paymentStatus === 'KASBON' ? 'color: #E65100; font-weight: bold;' : 'color: #2E7D32; font-weight: bold;'}">${t.paymentStatus}</td>
        </tr>
      `).join('')}
      <tr><td colspan="10"></td></tr>

      <!-- ========================================================= -->
      <!-- BAGIAN VI: DATA MASTER NASABAH -->
      <!-- ========================================================= -->
      <tr class="section-header"><td colspan="10">VI. DATA MASTER NASABAH TERDAFTAR</td></tr>
      <tr class="table-header">
        <th>ID Nasabah</th>
        <th>Nama Lengkap</th>
        <th>No. WhatsApp / HP</th>
        <th colspan="4">Alamat Domisili</th>
        <th colspan="3">Catatan Khusus</th>
      </tr>
      ${customers.map((c) => `
        <tr>
          <td class="center"><b>${c.id}</b></td>
          <td><b>${c.fullName}</b></td>
          <td>'${c.phone}</td>
          <td colspan="4">${c.address || '-'}</td>
          <td colspan="3">${c.notes || '-'}</td>
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
  link.download = `AmarBank_Database_Lengkap_${today}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openEmailBackup(
  email: string,
  customers: Customer[],
  loans: Loan[],
  payments: Payment[],
  debts: DebtRecord[] = [],
  topupRecords: TopupRecord[] = [],
  systemSettings?: SystemSettings
) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const branchCity = systemSettings?.cityName || 'Surabaya';

  // 1. Rekapan Kredit
  const totalPiutang = loans.reduce((acc, l) => acc + l.totalBill, 0);
  const totalTerkumpul = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalSisaPiutang = loans.reduce((acc, l) => acc + l.remainingBalance, 0);
  const totalMarginKredit = loans.reduce((acc, l) => acc + l.marginAmount, 0);

  let totalLabaMarginDiterima = 0;
  loans.forEach((l) => {
    const ratio = l.totalBill > 0 ? l.marginAmount / l.totalBill : 0;
    totalLabaMarginDiterima += Math.round(l.totalPaid * ratio);
  });

  // 2. Rekapan Hutang
  const totalHutangPokok = debts.reduce((acc, d) => acc + d.principalAmount, 0);
  const totalHutangDibayar = debts.reduce((acc, d) => acc + d.paidAmount, 0);
  const totalSisaHutang = debts.reduce((acc, d) => acc + d.remainingAmount, 0);

  // 3. Rekapan Topup
  const totalOmzetTopup = topupRecords.reduce((acc, t) => acc + t.sellPrice, 0);
  const totalModalTopup = topupRecords.reduce((acc, t) => acc + t.buyPrice, 0);
  const totalLabaTopup = topupRecords.reduce((acc, t) => acc + t.profit, 0);
  const totalKasbonTopup = topupRecords
    .filter((t) => t.paymentStatus === 'KASBON')
    .reduce((acc, t) => acc + t.sellPrice, 0);

  // 4. Arus Keuangan
  const totalLabaBersihKas = totalLabaMarginDiterima + totalLabaTopup;
  const totalPotensiLaba = totalMarginKredit + totalLabaTopup;
  const netAssets = totalSisaPiutang + totalLabaTopup - totalSisaHutang;

  const subject = `[Backup Lengkap] Amar Bank - Laporan Neraca, Kredit, Hutang & Topup (${today})`;

  const body = `Yth. Administrator Amar Bank (${branchCity}),

Berikut adalah Rekapitulasi Lengkap Seluruh Lembar Kerja Amar Bank per ${formatDateTimeIndo(now.toISOString())}:

==================================================
1. REKAPITULASI NERACA KEUANGAN & LABA USAHA
==================================================
• Sisa Aset Piutang di Nasabah     : ${formatRupiah(totalSisaPiutang)}
• Sisa Kewajiban Hutang Saya       : ${formatRupiah(totalSisaHutang)}
• Laba Margin Kredit Diterima (Kas): +${formatRupiah(totalLabaMarginDiterima)}
• Laba Bersih Jasa Topup           : +${formatRupiah(totalLabaTopup)}
--------------------------------------------------
★ TOTAL LABA BERSIH OPERASIONAL KAS: +${formatRupiah(totalLabaBersihKas)}
★ Total Potensi Seluruh Laba Usaha : +${formatRupiah(totalPotensiLaba)}
★ POSISI NILAI BERSIH (NET ASSET)  : ${formatRupiah(netAssets)} (Status: ${netAssets >= 0 ? 'SURPLUS' : 'DEFISIT'})

==================================================
2. LEMBAR KERJA KREDIT & PIUTANG NASABAH
==================================================
• Total Plafon Kredit Disalurkan   : ${formatRupiah(totalPiutang)}
• Total Pembayaran Diterima        : ${formatRupiah(totalTerkumpul)}
• Sisa Piutang Berjalan            : ${formatRupiah(totalSisaPiutang)}
• Jumlah Nasabah Terdaftar         : ${customers.length} Orang
• Jumlah Akad Kredit Aktif         : ${loans.filter((l) => l.status !== 'LUNAS').length} Akad

==================================================
3. LEMBAR KERJA HUTANG SAYA (PRIBADI)
==================================================
• Total Pokok Pinjaman Hutang      : ${formatRupiah(totalHutangPokok)}
• Hutang yang Sudah Dibayar        : ${formatRupiah(totalHutangDibayar)}
• Sisa Hutang Wajib Dibayar        : ${formatRupiah(totalSisaHutang)}
• Catatan Hutang Aktif             : ${debts.filter((d) => d.status !== 'LUNAS').length} Pinjaman

==================================================
4. LEMBAR KERJA JASA TOPUP (PULSA / PLN)
==================================================
• Total Omzet Penjualan            : ${formatRupiah(totalOmzetTopup)}
• Total Modal / Deposit Beli       : ${formatRupiah(totalModalTopup)}
• Laba Bersih Jasa Topup           : +${formatRupiah(totalLabaTopup)}
• Tagihan Kasbon Belum Bayar       : ${formatRupiah(totalKasbonTopup)}
• Total Transaksi Selesai          : ${topupRecords.length} Transaksi

Catatan:
Berkas spreadsheet lengkap (.xls) yang mencakup seluruh lembar kerja di atas juga dapat diunduh kapan saja melalui tombol "Unduh File Spreadsheet (.xls)" di aplikasi Amar Bank.

Salam hormat,
Sistem Manajemen Terpadu Amar Bank
Dicetak secara otomatis`;

  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl, '_blank');
}

export function backupDatabaseJSON(payload: {
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  debts?: DebtRecord[];
  topupRecords?: TopupRecord[];
  systemSettings?: SystemSettings;
  exportedAt: string;
  version: string;
  backupNote?: string;
}) {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
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
