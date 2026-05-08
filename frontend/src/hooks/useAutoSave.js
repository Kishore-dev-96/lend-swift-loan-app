import { useEffect, useRef } from 'react';
import { decryptDraft, encryptDraft } from '../utils/crypto.js';

export function useAutoSave({ form, storageKey, onDraftFound }) {
  const { reset, watch } = form;
  const intervalRef = useRef(null);

  useEffect(() => {
    async function checkDraft() {
      try {
        const saved = localStorage.getItem(storageKey);
        if (!saved) return;
        const draft = await decryptDraft(saved);
        if (draft) {
          onDraftFound(draft);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    checkDraft();
  }, [storageKey, onDraftFound]);

  useEffect(() => {
    intervalRef.current = window.setInterval(async () => {
      const data = watch();
      const payload = { ...data, updatedAt: new Date().toISOString() };
      const encrypted = await encryptDraft(payload);
      localStorage.setItem(storageKey, encrypted);
    }, 30000);

    return () => {
      window.clearInterval(intervalRef.current);
    };
  }, [storageKey, watch]);

  useEffect(() => {
    const subscription = watch(async () => {
      const data = watch();
      const encrypted = await encryptDraft({ ...data, updatedAt: new Date().toISOString() });
      localStorage.setItem(storageKey, encrypted);
    });
    return () => subscription.unsubscribe();
  }, [watch, storageKey]);
}
