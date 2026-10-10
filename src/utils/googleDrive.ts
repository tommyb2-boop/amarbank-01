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

// Target Google Drive Folder ID provided by user:
// https://drive.google.com/drive/folders/14eycL32PLbD9TMc_7raUbP9vVgrjSOR2?usp=drive_link
export const TARGET_DRIVE_FOLDER_ID = '14eycL32PLbD9TMc_7raUbP9vVgrjSOR2';
export const TARGET_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/14eycL32PLbD9TMc_7raUbP9vVgrjSOR2?usp=drive_link';

// Define Drive scope
export const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
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

export const signInWithGoogleDrive = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token otorisasi Google Drive');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const signOutGoogleDrive = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (err) {
    console.error('Logout error:', err);
  }
};

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  description?: string;
  backupNote?: string;
}

/**
 * Upload a JSON database backup directly to the specific target Google Drive folder
 */
export async function uploadBackupToDrive(
  token: string,
  backupData: any,
  backupNoteText?: string,
  fileName?: string
): Promise<{ id: string; name: string }> {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const nowIndo = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });
  const name = fileName || `AmarBank_Database_Backup_${dateStr}.json`;

  const note = backupNoteText || `Cadangan Database Amar Bank pada ${nowIndo}`;

  // Embed the backup note directly into the payload as well
  const enrichedPayload = {
    ...backupData,
    backupNote: note,
    backupFolderId: TARGET_DRIVE_FOLDER_ID,
    exportedAt: backupData.exportedAt || new Date().toISOString(),
  };

  const fileContent = JSON.stringify(enrichedPayload, null, 2);

  // Set parents to the user's specific folder
  const metadata: any = {
    name,
    mimeType: 'application/json',
    description: `Catatan Backup: ${note} | Folder: 14eycL32PLbD9TMc_7raUbP9vVgrjSOR2`,
    parents: [TARGET_DRIVE_FOLDER_ID],
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append(
    'file',
    new Blob([fileContent], { type: 'application/json' })
  );

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    // If upload directly to folder fails due to permissions, fallback to standard upload with folder tag
    if (errorText.includes('File not found') || errorText.includes('insufficientFilePermissions')) {
      const fallbackMetadata = {
        name,
        mimeType: 'application/json',
        description: `Catatan Backup: ${note} (Tujuan: Folder Amar Bank)`,
      };
      const fallbackForm = new FormData();
      fallbackForm.append(
        'metadata',
        new Blob([JSON.stringify(fallbackMetadata)], { type: 'application/json' })
      );
      fallbackForm.append(
        'file',
        new Blob([fileContent], { type: 'application/json' })
      );

      const fallbackRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fallbackForm,
        }
      );
      if (!fallbackRes.ok) {
        throw new Error(`Gagal mengunggah file ke Google Drive: ${await fallbackRes.text()}`);
      }
      const fbResult = await fallbackRes.json();
      return { id: fbResult.id, name: fbResult.name };
    }
    throw new Error(`Gagal mengunggah file ke Google Drive: ${errorText}`);
  }

  const result = await response.json();
  return { id: result.id, name: result.name };
}

/**
 * List Amar Bank backup files from the target Google Drive folder (or created by app)
 */
export async function listDriveBackups(token: string): Promise<DriveBackupFile[]> {
  // Query for files in the specific folder first, or files with AmarBank in the name
  const query = encodeURIComponent(
    `('${TARGET_DRIVE_FOLDER_ID}' in parents or name contains 'AmarBank') and trashed = false`
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size,description,parents)&orderBy=createdTime desc&pageSize=50`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // If folder querying isn't allowed, fallback to name contains 'AmarBank'
    const fallbackQuery = encodeURIComponent("name contains 'AmarBank' and trashed = false");
    const fallbackUrl = `https://www.googleapis.com/drive/v3/files?q=${fallbackQuery}&fields=files(id,name,createdTime,size,description)&orderBy=createdTime desc&pageSize=50`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!fallbackRes.ok) {
      const errText = await fallbackRes.text();
      throw new Error(`Gagal mengambil daftar file dari Google Drive: ${errText}`);
    }
    const fbData = await fallbackRes.json();
    return (fbData.files || []) as DriveBackupFile[];
  }

  const data = await response.json();
  return (data.files || []) as DriveBackupFile[];
}

/**
 * Download a backup JSON file directly from Google Drive
 */
export async function downloadBackupFromDrive(token: string, fileId: string): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal mengunduh file cadangan dari Google Drive: ${errText}`);
  }

  const json = await response.json();
  return json;
}
