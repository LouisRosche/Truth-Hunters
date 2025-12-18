/**
 * OFFLINE TOASTS HOOK
 * Connects offline queue notifications to toast system
 */

import { useEffect } from 'react';
import { useToast } from '../components/Toast';
import { OfflineQueue } from '../services/offlineQueue';

/**
 * Hook to connect offline queue to toast notifications
 * Must be used within ToastProvider
 */
export function useOfflineToasts() {
  const { showToast } = useToast();

  useEffect(() => {
    // Register toast callback with offline queue
    OfflineQueue.setToastCallback(showToast);

    return () => {
      // Cleanup: remove callback on unmount
      OfflineQueue.setToastCallback(null);
    };
  }, [showToast]);
}
