const ENCRYPTION_KEY = 'lendswift-auto-save-v1-strong-key-2026';
const IV_LENGTH = 12;

async function getKey() {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ENCRYPTION_KEY),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('lendswift-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function toBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptDraft(data) {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const payload = new Uint8Array(iv.byteLength + cipher.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(cipher), iv.byteLength);
  return toBase64(payload.buffer);
}

export async function decryptDraft(payload) {
  try {
    const bytes = new Uint8Array(fromBase64(payload));
    const iv = bytes.slice(0, IV_LENGTH);
    const cipherBytes = bytes.slice(IV_LENGTH);
    const key = await getKey();
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
