import { db, PendingTransaction } from './offlineDb';
import { transaksiApi } from '../api/transaksi.api';

let isSyncing = false;

export const syncPendingTransactions = async (): Promise<{
  successCount: number;
  failedCount: number;
}> => {
  if (isSyncing || !navigator.onLine) {
    return { successCount: 0, failedCount: 0 };
  }

  isSyncing = true;
  let successCount = 0;
  let failedCount = 0;

  try {
    const pendingList = await db.pendingTransactions
      .where('syncStatus')
      .equals('PENDING')
      .toArray();

    for (const trx of pendingList) {
      try {
        await transaksiApi.create({
          userId: trx.userId,
          statusPembayaran: trx.statusPembayaran,
          clientOfflineId: trx.clientOfflineId,
          items: trx.items.map((it) => ({
            sampahAnorganikId: it.sampahAnorganikId,
            kuantitas: it.kuantitas,
          })),
        });

        // Hapus atau tandai sebagai SYNCED
        if (trx.id) {
          await db.pendingTransactions.delete(trx.id);
        }
        successCount++;
      } catch (err: any) {
        console.error(`Gagal sinkronisasi transaksi offline ${trx.clientOfflineId}:`, err);
        failedCount++;
        if (trx.id) {
          await db.pendingTransactions.update(trx.id, {
            syncStatus: 'FAILED',
            errorMessage: err.response?.data?.message || err.message,
          });
        }
      }
    }

    if (successCount > 0) {
      window.dispatchEvent(new CustomEvent('bank-sampah-sync-completed', { detail: { successCount } }));
    }
  } finally {
    isSyncing = false;
  }

  return { successCount, failedCount };
};

export const initOfflineSyncListener = () => {
  window.addEventListener('online', () => {
    console.log('Koneksi internet kembali aktif. Memulai sinkronisasi antrean transaksi...');
    syncPendingTransactions();
  });
};

