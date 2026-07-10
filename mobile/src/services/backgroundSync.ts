/**
 * Background Sync Service — I-HealthConnect
 * Uploads unsynced offline records to the backend when connectivity is restored.
 * Uses expo-background-fetch + expo-task-manager.
 */
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { getUnsyncedRecords, markSynced } from '../db/database';

const TASK_NAME = 'IHC_BACKGROUND_SYNC';
const API_URL = 'https://api.ihealthconnect.rw/api/sync/records';
const MIN_INTERVAL_SECONDS = 15 * 60; // 15 minutes

// ── Define the background task ────────────────────────────────────────────────
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const records = await getUnsyncedRecords();

    if (!records || records.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: load JWT token from SecureStore in production
        'Authorization': 'Bearer local-sync-token',
      },
      body: JSON.stringify({ records }),
    });

    if (!response.ok) {
      console.warn('[Sync] Server returned', response.status);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    const data = await response.json();
    const syncedIds = records.map((r: any) => r.id as number);
    await markSynced(syncedIds);

    console.log(`[Sync] Uploaded ${data.inserted} records, skipped ${data.skipped}`);
    return BackgroundFetch.BackgroundFetchResult.NewData;

  } catch (error) {
    // Silent fail — never crash the app over sync issues
    console.warn('[Sync] Background sync failed silently:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ── Register ──────────────────────────────────────────────────────────────────
export const registerBackgroundSync = async (): Promise<void> => {
  try {
    const status = await BackgroundFetch.getStatusAsync();

    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
        status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      console.warn('[Sync] Background fetch is restricted or denied');
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (isRegistered) return;

    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: MIN_INTERVAL_SECONDS,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[Sync] Background sync registered');
  } catch (e) {
    console.warn('[Sync] Could not register background sync:', e);
  }
};

// ── Unregister ────────────────────────────────────────────────────────────────
export const unregisterBackgroundSync = async (): Promise<void> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
      console.log('[Sync] Background sync unregistered');
    }
  } catch (e) {
    console.warn('[Sync] Could not unregister background sync:', e);
  }
};

// ── Manual trigger (for testing) ─────────────────────────────────────────────
export const triggerManualSync = async (): Promise<{ inserted: number; failed: number }> => {
  try {
    const records = await getUnsyncedRecords();
    if (!records || records.length === 0) return { inserted: 0, failed: 0 };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });

    if (!response.ok) return { inserted: 0, failed: records.length };

    const data = await response.json();
    const ids = records.map((r: any) => r.id as number);
    await markSynced(ids);
    return { inserted: data.inserted ?? records.length, failed: 0 };
  } catch {
    return { inserted: 0, failed: 0 };
  }
};
