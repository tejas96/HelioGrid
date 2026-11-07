import type { TranslatedText } from '@heliogrid/contracts';
import { useEffect, useRef } from 'react';
import type { ToastQueue } from './ToastHost.types';

/**
 * The `saved` moment: once a save that was out lands without a failure, one success toast with the
 * moment plays. A save still out, or one that failed, raises nothing — the failure says itself
 * where the person acted.
 */
export function useSavedMoment(
  push: ToastQueue['push'],
  saving: boolean,
  failed: boolean,
  title: TranslatedText,
): void {
  const wasSaving = useRef(saving);
  useEffect(() => {
    if (wasSaving.current && !saving && !failed) {
      push({ tone: 'success', title, moment: 'saved' });
    }
    wasSaving.current = saving;
  }, [saving, failed, title, push]);
}
