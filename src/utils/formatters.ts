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
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function createWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
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
