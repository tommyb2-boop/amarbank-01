import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Customer, Loan, Payment, SystemSettings, DebtRecord, TopupRecord } from '../types';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
export const GOOGLE_DRIVE_API_KEY = 'AIzaSyDyTOJdk7EfEn6dFZF4Cq-nwNwQsYF5KTo';

// Reuse existing Firebase app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: User | null = null;
let isSigningIn = false;

export interface GoogleDriveFileItem {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

export interface GoogleDriveBackupPayload {
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  debts?: DebtRecord[];
  topupRecords?: TopupRecord[];
  systemSettings?: SystemSettings;
  exportedAt: string;
  version: string;
  backupNote?: string;
}

/**
 * Initialize auth listener for Google Drive
 */
export const initGoogleDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedGoogleUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google to get Google Drive access token
 */
export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh access token dari Google Drive');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token
 */
export const getGoogleDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Get current Google User
 */
export const getCurrentGoogleUser = (): User | null => {
  return cachedGoogleUser || auth.currentUser;
};

/**
 * Sign out from Google Drive
 */
export const signOutGoogleDrive = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedGoogleUser = null;
};

/**
 * Upload database backup directly to Google Drive
 */
export async function uploadBackupToGoogleDrive(
  data: {
    customers: Customer[];
    loans: Loan[];
    payments: Payment[];
    debts?: DebtRecord[];
    topupRecords?: TopupRecord[];
    systemSettings?: SystemSettings;
  },
  customFileName?: string,
  token?: string
): Promise<{ fileId: string; fileName: string; timestamp: string }> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) {
    throw new Error('Belum terhubung ke Google Drive. Silakan hubungkan akun Google terlebih dahulu.');
  }

  const boundary = '-------AmarBankBoundary' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = customFileName || `AmarBank_Database_Backup_${dateStr}.json`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `Cadangan Resmi Database Amar Bank - ${now.toLocaleString('id-ID')}`,
  };

  const payload: GoogleDriveBackupPayload = {
    customers: data.customers || [],
    loans: data.loans || [],
    payments: data.payments || [],
    debts: data.debts || [],
    topupRecords: data.topupRecords || [],
    systemSettings: data.systemSettings,
    exportedAt: now.toISOString(),
    version: '2.1-amar-drive',
    backupNote: `Cadangan Database Amar Bank ke Google Drive`,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(payload, null, 2) +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload to Drive failed:', errorText);
    throw new Error(`Gagal mengunggah ke Google Drive (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return {
    fileId: result.id,
    fileName: result.name || fileName,
    timestamp: now.toISOString(),
  };
}

/**
 * List existing Amar Bank backups from Google Drive
 */
export async function listGoogleDriveBackups(token?: string): Promise<GoogleDriveFileItem[]> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) {
    throw new Error('Belum terhubung ke Google Drive. Silakan hubungkan akun Google.');
  }

  const query = encodeURIComponent("name contains 'AmarBank_Database_Backup' and trashed = false");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,modifiedTime,size)&orderBy=modifiedTime desc`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal mengambil daftar cadangan dari Google Drive: ${errorText}`);
  }

  const result = await response.json();
  return result.files || [];
}

/**
 * Download database backup from Google Drive
 */
export async function downloadBackupFromGoogleDrive(
  fileId: string,
  token?: string
): Promise<GoogleDriveBackupPayload> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) {
    throw new Error('Belum terhubung ke Google Drive.');
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal mengunduh file cadangan dari Google Drive: ${errorText}`);
  }

  const data: GoogleDriveBackupPayload = await response.json();
  return data;
}

/**
 * Delete a backup file from Google Drive (Requires explicit confirmation before calling)
 */
export async function deleteBackupFromGoogleDrive(fileId: string, token?: string): Promise<boolean> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) throw new Error('Belum terhubung ke Google Drive.');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.ok;
}
