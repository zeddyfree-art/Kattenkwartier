/**
 * Google Drive sync. The back-up lives in the app's hidden Drive folder
 * (appDataFolder): only this game can see it, and it does not clutter her Drive.
 */
import { applyBackup, isBackup, makeBackup, type Backup } from './backup';
import { GOOGLE_CLIENT_ID } from './config';
import { load, save } from './store';

const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const FILE = 'kattenkwartier.json';

interface TokenResponse { access_token?: string; expires_in?: number; error?: string }
interface TokenClient { requestAccessToken(o?: { prompt?: string }): void; callback: (r: TokenResponse) => void }
declare global {
  interface Window {
    google?: { accounts: { oauth2: {
      initTokenClient(c: { client_id: string; scope: string; callback: (r: TokenResponse) => void }): TokenClient;
      revoke(token: string, done?: () => void): void;
    } } };
  }
}

let token: { value: string; until: number } | null = null;
let client: TokenClient | null = null;

export const driveAvailable = () => GOOGLE_CLIENT_ID.length > 0;
export const driveLinked = () => load<boolean>('driveLinked', false);
export const lastSync = () => load<string | null>('driveLastSync', null);
export const hasToken = () => !!token && Date.now() < token.until;

function loadScript(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Kon Google niet bereiken. Ben je online?'));
    document.head.append(s);
  });
}

/** Must be called from a tap (it may open a Google sign-in window). */
async function getToken(): Promise<string> {
  if (hasToken()) return token!.value;
  await loadScript();
  return new Promise((resolve, reject) => {
    client ??= window.google!.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: SCOPE, callback: () => {} });
    client.callback = (r) => {
      if (!r.access_token) { reject(new Error('Inloggen bij Google is niet gelukt.')); return; }
      token = { value: r.access_token, until: Date.now() + ((r.expires_in ?? 3600) - 60) * 1000 };
      save('driveLinked', true);
      resolve(r.access_token);
    };
    client.requestAccessToken({ prompt: driveLinked() ? '' : 'consent' });
  });
}

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token!.value}` },
  });
  if (res.status === 401) token = null;
  if (!res.ok) throw new Error(`Google Drive gaf een fout (${res.status}).`);
  return res;
}

async function findFile(): Promise<string | null> {
  const q = encodeURIComponent(`name='${FILE}'`);
  const res = await api(`/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)`);
  const { files } = (await res.json()) as { files: { id: string }[] };
  return files[0]?.id ?? null;
}

async function upload(id: string | null, data: Backup) {
  const body = JSON.stringify(data);
  if (id) {
    await api(`/upload/drive/v3/files/${id}?uploadType=media`, { method: 'PATCH', body, headers: { 'Content-Type': 'application/json' } });
    return;
  }
  const boundary = 'kk' + Math.random().toString(36).slice(2);
  const meta = JSON.stringify({ name: FILE, parents: ['appDataFolder'] });
  const multipart = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
  await api('/upload/drive/v3/files?uploadType=multipart', { method: 'POST', body: multipart, headers: { 'Content-Type': `multipart/related; boundary=${boundary}` } });
}

/**
 * Two-way sync: combine Drive's copy with this device, then store the result in Drive.
 * `interactive` = started by a tap (may sign in, may switch to the other device's puzzle).
 * Returns true when the unfinished puzzle was replaced by a newer one from Drive.
 */
export async function syncDrive(interactive: boolean): Promise<boolean> {
  if (!driveAvailable()) return false;
  if (!interactive && !hasToken()) return false;
  await getToken();
  const id = await findFile();
  let changedCurrent = false;
  if (id) {
    const remote = (await (await api(`/drive/v3/files/${id}?alt=media`)).json()) as unknown;
    if (isBackup(remote)) changedCurrent = applyBackup(remote, interactive);
  }
  await upload(id, makeBackup());
  save('driveLastSync', new Date().toISOString());
  return changedCurrent;
}

export function unlinkDrive() {
  if (token && window.google) window.google.accounts.oauth2.revoke(token.value);
  token = null;
  save('driveLinked', false);
}
