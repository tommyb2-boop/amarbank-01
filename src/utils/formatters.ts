export function formatRupiah(value: number): string {
  if (isNaN(value)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('620')) {
    // Menghilangkan nol jika user mengetik format +62 0812...
    cleaned = '62' + cleaned.substring(3);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function createWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Membuka aplikasi WhatsApp langsung ke nomor tujuan dengan pesan yang sudah terisi.
 * Dioptimalkan khusus untuk Android PWA / Chrome standalone menggunakan URI scheme native (whatsapp://)
 * sehingga langsung membuka aplikasi WhatsApp di HP tanpa tertahan di browser web.
 */
export function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = cleanPhoneNumber(phone);
  if (!cleanPhone || cleanPhone.length < 8) {
    console.warn('Nomor WhatsApp nasabah tidak valid atau belum terdaftar:', phone);
    return;
  }

  const encodedMessage = encodeURIComponent(message);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // 1. WhatsApp Native URL Scheme (Membuka aplikasi WhatsApp langsung di Android tanpa layar perantara browser)
  const nativeUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
  // 2. URL Fallback Universal (Android App Links)
  const webUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;

  if (isMobile) {
    // Di Android PWA (Standalone WebAPK), pemicuan langsung melalui klik anchor protocol whatsapp://
    // akan langsung ditangkap oleh Intent Filter sistem Android WhatsApp
    try {
      const link = document.createElement('a');
      link.href = nativeUrl;
      // Jangan gunakan target="_blank" di mobile PWA agar tidak membuka tab browser kosong
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.location.href = nativeUrl;
    }

    // Safety fallback jika whatsapp:// belum selesai dialihkan setelah 800ms
    const startTime = Date.now();
    setTimeout(() => {
      // Jika browser masih aktif (belum beralih ke app WhatsApp), coba fallback
      if (Date.now() - startTime < 1600 && document.hasFocus && document.hasFocus()) {
        window.location.href = webUrl;
      }
    }, 800);
  } else {
    // Desktop: Buka WhatsApp Web atau aplikasi desktop
    const desktopUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
    const win = window.open(desktopUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function calculateDueDate(startDateStr: string, tenorCount: number, tenorUnit: 'BULAN' | 'MINGGU' | 'HARI'): string {
  const date = new Date(startDateStr || new Date().toISOString().split('T')[0]);
  if (tenorUnit === 'BULAN') {
    date.setMonth(date.getMonth() + Number(tenorCount));
  } else if (tenorUnit === 'MINGGU') {
    date.setDate(date.getDate() + Number(tenorCount) * 7);
  } else if (tenorUnit === 'HARI') {
    date.setDate(date.getDate() + Number(tenorCount));
  }
  return date.toISOString().split('T')[0];
}

export function calculateNextDueDate(startDateStr: string, tenorUnit: 'BULAN' | 'MINGGU' | 'HARI', currentInstallmentIndex: number = 1): string {
  const date = new Date(startDateStr || new Date().toISOString().split('T')[0]);
  if (tenorUnit === 'BULAN') {
    date.setMonth(date.getMonth() + currentInstallmentIndex);
  } else if (tenorUnit === 'MINGGU') {
    date.setDate(date.getDate() + currentInstallmentIndex * 7);
  } else if (tenorUnit === 'HARI') {
    date.setDate(date.getDate() + currentInstallmentIndex);
  }
  return date.toISOString().split('T')[0];
}

export function getDaysDifference(targetDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
