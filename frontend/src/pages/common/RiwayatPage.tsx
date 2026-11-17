import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { transaksiApi } from '../../api/transaksi.api';
import { Transaksi } from '../../types';
import { db, PendingTransaction } from '../../db/offlineDb';
import {
  ReceiptText,
  Calendar,
  CloudUpload,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const RiwayatPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterMetode, setFilterMetode] = useState<'ALL' | 'TABUNGAN' | 'TUNAI'>('ALL');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const res = await transaksiApi.getRiwayat();
        setTransactions(res.data.items);
      }

      // Load offline pending transactions from Dexie
      const pending = await db.pendingTransactions.toArray();
      setPendingTransactions(pending);
    } catch (err) {
      console.error('Failed to load transaction history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const handleSyncEvent = () => fetchTransactions();
    window.addEventListener('bank-sampah-sync-completed', handleSyncEvent);
    return () => {
      window.removeEventListener('bank-sampah-sync-completed', handleSyncEvent);
    };
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    if (filterMetode === 'ALL') return true;
    return t.statusPembayaran === filterMetode;
  });

  return (
    <div className="pb-24 pt-2 px-4 space-y-3.5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 tracking-tight">Riwayat Setoran</h2>
          <p className="text-xs text-gray-500">
            {isAdmin ? `Seluruh transaksi di ${user?.rw}` : 'Catatan buku tabungan sampah Anda'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1.5 bg-gray-100 p-1 rounded-2xl">
        <button
          onClick={() => setFilterMetode('ALL')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
            filterMetode === 'ALL' ? 'bg-white text-forest-950 shadow-2xs' : 'text-gray-500'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilterMetode('TABUNGAN')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
            filterMetode === 'TABUNGAN'
              ? 'bg-white text-forest-900 shadow-2xs'
              : 'text-gray-500'
          }`}
        >
          Tabungan
        </button>
        <button
          onClick={() => setFilterMetode('TUNAI')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
            filterMetode === 'TUNAI' ? 'bg-white text-amber-900 shadow-2xs' : 'text-gray-500'
          }`}
        >
          Tunai
        </button>
      </div>

      {/* Offline Pending Transactions (If any) */}
      {pendingTransactions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800">
            <CloudUpload className="w-4 h-4 text-amber-600 animate-bounce" />
            <span>Antrean Sinkronisasi Offline ({pendingTransactions.length})</span>
          </div>

          <div className="space-y-2">
            {pendingTransactions.map((trx, index) => (
              <div
                key={trx.id || index}
                className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-amber-950">{trx.wargaNama}</p>
                  <p className="text-[10px] text-amber-700">
                    {trx.totalBerat} Kg • Rp {trx.totalHarga.toLocaleString('id-ID')}
                  </p>
                  <span className="inline-block mt-1 text-[9px] font-semibold bg-amber-200/60 text-amber-900 px-1.5 py-0.2 rounded">
                    Menunggu Internet
                  </span>
                </div>
                <Clock className="w-5 h-5 text-amber-500 animate-spin" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400">
          Memuat riwayat transaksi...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 space-y-2">
          <ReceiptText className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-xs font-bold text-gray-700">Belum ada riwayat transaksi</p>
          <p className="text-[11px] text-gray-400">
            Transaksi yang berhasil ditimbang akan otomatis tercatat di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((trx) => (
            <div
              key={trx.id}
              onClick={() => navigate(`/transaksi/${trx.id}`)}
              className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs hover:border-forest-300 transition cursor-pointer flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-forest-50 text-forest-900 flex items-center justify-center flex-shrink-0 group-hover:bg-forest-100 transition">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <p className="text-xs font-black text-gray-900">
                      {trx.warga?.nama || trx.nomorTransaksi}
                    </p>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                        trx.statusPembayaran === 'TABUNGAN'
                          ? 'bg-forest-50 text-forest-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {trx.statusPembayaran}
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                    {new Date(trx.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    WIB
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    #{trx.nomorTransaksi}
                  </p>
                </div>
              </div>

              <div className="text-right flex items-center space-x-2">
                <div>
                  <p className="text-xs font-black text-forest-900">
                    Rp {Number(trx.totalHarga).toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500">
                    {Number(trx.totalBerat).toFixed(1)} Kg
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-forest-900 transition" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

