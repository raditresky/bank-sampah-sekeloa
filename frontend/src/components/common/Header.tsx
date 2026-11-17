import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Wifi, WifiOff, LogOut, RefreshCw, User as UserIcon } from 'lucide-react';
import { db } from '../../db/offlineDb';
import { syncPendingTransactions } from '../../db/syncManager';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  const checkPending = async () => {
    try {
      const count = await db.pendingTransactions.where('syncStatus').equals('PENDING').count();
      setPendingCount(count);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkPending();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const syncListener = () => checkPending();
    window.addEventListener('bank-sampah-sync-completed', syncListener);

    checkPending();
    const interval = setInterval(checkPending, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('bank-sampah-sync-completed', syncListener);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    await syncPendingTransactions();
    await checkPending();
    setIsSyncing(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 safe-top">
      <div className="flex items-center justify-between">
        {/* Left: Logo & Unit Badge */}
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-full bg-forest-900 flex items-center justify-center text-white font-bold text-lg shadow-sm border-2 border-forest-100 flex-shrink-0">
            <span className="text-forest-200">♻</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-gray-900 text-sm tracking-tight leading-tight">
                Bank Sampah Sekeloa
              </h1>
            </div>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-forest-50 text-forest-800 border border-forest-200">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 mr-1 animate-pulse"></span>
                {user?.unitBankSampah || `${user?.rw || 'RW 08'} Kel. Sekeloa`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Online Pill & User Avatar */}
        <div className="flex items-center space-x-2">
          {/* Offline / Pending Sync Indicator */}
          {pendingCount > 0 ? (
            <button
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                isOnline
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
              title="Antrean Transaksi Offline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{pendingCount} Sync</span>
            </button>
          ) : !isOnline ? (
            <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="text-[11px]">Offline</span>
            </span>
          ) : (
            <span className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
              <Bell className="w-5 h-5" />
            </span>
          )}

          {/* User Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-forest-900 text-white font-semibold flex items-center justify-center text-xs shadow-sm hover:ring-2 hover:ring-forest-600 transition"
            >
              {user?.nama ? user.nama.substring(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">Masuk sebagai</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.nama}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {user?.role === 'ADMIN_RW'
                      ? 'Admin RW'
                      : user?.role === 'PETUGAS_BANK_SAMPAH'
                      ? 'Petugas Bank Sampah'
                      : 'Warga / Nasabah'}
                  </span>
                </div>
                <div className="px-2 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

