const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function deriveKey(salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode("lendswift-device-draft-key-v1"),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 120000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJson(payload) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(salt);
  const bytes = encoder.encode(JSON.stringify(payload));
  const cipherText = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);

  return JSON.stringify({
    version: 1,
    iv: toBase64(iv),
    salt: toBase64(salt),
    cipherText: toBase64(cipherText),
  });
}

export async function decryptJson(envelope) {
  const parsed = JSON.parse(envelope);
  const iv = fromBase64(parsed.iv);
  const salt = fromBase64(parsed.salt);
  const cipherText = fromBase64(parsed.cipherText);
  const key = await deriveKey(salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherText);
  return JSON.parse(decoder.decode(plain));
}
