import { decryptJson, encryptJson } from "./crypto.js";

const STORAGE_KEY = "lendswift.encryptedDraft";
const TTL_MS = 72 * 60 * 60 * 1000;

export async function saveDraft(formData, currentStep) {
  const payload = {
    savedAt: Date.now(),
    currentStep,
    formData,
  };

  localStorage.setItem(STORAGE_KEY, await encryptJson(payload));
  return payload.savedAt;
}

export async function loadDraft() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    const payload = await decryptJson(saved);
    if (!payload.savedAt || Date.now() - payload.savedAt > TTL_MS) {
      clearDraft();
      return null;
    }
    return payload;
  } catch (error) {
    clearDraft();
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatSaveTime(timestamp) {
  if (!timestamp) return "Auto-save ready";
  return `Saved ${new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
