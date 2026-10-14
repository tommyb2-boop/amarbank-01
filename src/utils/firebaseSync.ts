import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Customer, Loan, Payment, SystemSettings, AdminUser, DebtRecord, TopupRecord } from '../types';

// Inisialisasi Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface FirebaseDatabasePayload {
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  debts?: DebtRecord[];
  topupRecords?: TopupRecord[];
  systemSettings?: SystemSettings;
  admins?: AdminUser[];
  exportedAt: string;
  version: string;
  updatedBy?: string;
  note?: string;
}

export interface FirebaseBackupMeta {
  lastBackupAt: string | null;
  totalCustomers: number;
  totalLoans: number;
  totalPayments: number;
  updatedBy: string;
}

const DATABASE_DOC_PATH = 'database';
const COLLECTION_NAME = 'amar_bank_cloud';

/**
 * Menyimpan / Mencadangkan seluruh database ke Firebase Firestore
 * Otomatis memperbarui dokumen utama sehingga seluruh client yang terhubung tersinkronisasi.
 */
export async function backupDatabaseToFirebase(
  data: {
    customers: Customer[];
    loans: Loan[];
    payments: Payment[];
    debts?: DebtRecord[];
    topupRecords?: TopupRecord[];
    systemSettings?: SystemSettings;
    admins?: AdminUser[];
  },
  note?: string,
  updatedBy: string = 'Admin Amar Bank'
): Promise<{ success: boolean; timestamp: string }> {
  try {
    const timestamp = new Date().toISOString();
    const docRef = doc(db, COLLECTION_NAME, DATABASE_DOC_PATH);

    const payload: FirebaseDatabasePayload = {
      customers: data.customers || [],
      loans: data.loans || [],
      payments: data.payments || [],
      debts: data.debts || [],
      topupRecords: data.topupRecords || [],
      systemSettings: data.systemSettings,
      admins: data.admins,
      exportedAt: timestamp,
      version: '2.1-firebase-neraca',
      updatedBy,
      note: note || `Backup otomatis ke Firebase Cloud`,
    };

    // Bersihkan undefined values untuk kompatibilitas Firestore
    const cleanPayload = JSON.parse(JSON.stringify(payload));
    await setDoc(docRef, cleanPayload);

    return { success: true, timestamp };
  } catch (error: any) {
    console.error('Error backup to Firebase:', error);
    throw new Error(error?.message || 'Gagal menyimpan cadangan ke Firebase');
  }
}

/**
 * Mengambil database terbaru dari Firebase Firestore
 */
export async function fetchLatestFromFirebase(): Promise<FirebaseDatabasePayload | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DATABASE_DOC_PATH);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as FirebaseDatabasePayload;
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching from Firebase:', error);
    throw new Error(error?.message || 'Gagal membaca database dari Firebase');
  }
}

/**
 * Mengambil data pelanggan saja dari Firebase Firestore (untuk Portal Pelanggan / Login Pelanggan)
 */
export async function fetchLatestCustomersFromFirebase(): Promise<Customer[]> {
  try {
    const data = await fetchLatestFromFirebase();
    if (data && Array.isArray(data.customers)) {
      return data.customers;
    }
    return [];
  } catch (error: any) {
    console.error('Error fetching customers from Firebase:', error);
    throw new Error(error?.message || 'Gagal mengunduh data pelanggan dari Firebase');
  }
}

/**
 * Berlangganan (realtime listener) pembaruan database dari Firebase
 * Setiap kali ada perubahan/backup di Firebase, fungsi callback otomatis dipanggil
 * untuk memperbarui seluruh data aplikasi secara real-time.
 */
export function subscribeToFirebaseDatabase(
  onUpdate: (payload: FirebaseDatabasePayload) => void,
  onError?: (error: Error) => void
) {
  const docRef = doc(db, COLLECTION_NAME, DATABASE_DOC_PATH);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as FirebaseDatabasePayload;
        onUpdate(data);
      }
    },
    (error) => {
      console.warn('Realtime sync warning:', error);
      if (onError) onError(error);
    }
  );
}
