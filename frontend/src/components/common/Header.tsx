import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  Wifi,
  WifiOff,
  LogOut,
  RefreshCw,
  User as UserIcon,
  X,
  Banknote,
  CheckCircle2,
  Clock,
  Info,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { db } from '../../db/offlineDb';
import { syncPendingTransactions } from '../../db/syncManager';
import { pencairanApi } from '../../api/pencairan.api';
import { Pencairan } from '../../types';
import { AppLogo } from './AppLogo';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'PENCAIRAN' | 'INFO' | 'SUCCESS' | 'ALERT';
  actionUrl?: string;
  isRead: boolean;
}

export const Header: React.FC = () => {
  const { user, isAdmin, isWarga, logout } = useAuth();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  // Notification state
  const [showNotifModal, setShowNotifModal] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [browserNotifPermission, setBrowserNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const checkPendingSync = async () => {
    try {
      const count = await db.pendingTransactions.where('syncStatus').equals('PENDING').count();
      setPendingSyncCount(count);
    } catch {
      // ignore
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    const notifs: NotificationItem[] = [];

    try {
      if (isAdmin) {
        const pRes = await pencairanApi.getPending();
        const pendingList: Pencairan[] = pRes.data || [];

        if (pendingList.length > 0) {
          pendingList.forEach((item) => {
            notifs.push({
              id: `wdr-${item.id}`,
              title: 'Permohonan Pencairan Tabungan',
              message: `${item.warga?.nama || 'Warga'} mengajukan pencairan Rp ${Number(
                item.jumlahNominal
              ).toLocaleString('id-ID')} (${item.metode}).`,
              time: new Date(item.createdAt).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              type: 'PENCAIRAN',
              actionUrl: '/admin',
              isRead: false,
            });
          });
        }

        notifs.push({
          id: 'info-dlh',
          title: 'Jadwal Truk Pengangkut DLH',
          message: 'Truk pengepul DLH Kota Bandung tiba pukul 16:30 WIB di Pos RW 08 Sekeloa.',
          time: 'Hari ini',
          type: 'INFO',
          isRead: true,
        });
      } else if (isWarga) {
        const pRes = await pencairanApi.getAll();
        const myPencairan: Pencairan[] = pRes.data || [];

        myPencairan.slice(0, 3).forEach((item) => {
          if (item.status === 'MENUNGGU') {
            notifs.push({
              id: `my-wdr-${item.id}`,
              title: 'Pengajuan Pencairan Diproses',
              message: `Pencairan Rp ${Number(item.jumlahNominal).toLocaleString(
                'id-ID'
              )} sedang diverifikasi pengurus RW 08.`,
              time: new Date(item.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              }),
              type: 'PENCAIRAN',
              actionUrl: '/riwayat',
              isRead: false,
            });
          } else if (item.status === 'DISETUJUI') {
            notifs.push({
              id: `my-wdr-${item.id}`,
              title: 'Pencairan Tabungan Berhasil!',
              message: `Dana Rp ${Number(item.jumlahNominal).toLocaleString(
                'id-ID'
              )} telah disetujui & dicairkan.`,
              time: item.updatedAt
                ? new Date(item.updatedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'Selesai',
              type: 'SUCCESS',
              actionUrl: '/riwayat',
              isRead: true,
            });
          } else if (item.status === 'DITOLAK') {
            notifs.push({
              id: `my-wdr-${item.id}`,
              title: 'Permohonan Pencairan Ditolak',
              message: `Pencairan Rp ${Number(item.jumlahNominal).toLocaleString(
                'id-ID'
              )} ditolak: ${item.catatanPetugas || 'Hubungi pengurus pos RW'}.`,
              time: 'Ditolak',
              type: 'ALERT',
              actionUrl: '/riwayat',
              isRead: true,
            });
          }
        });

        notifs.push({
          id: 'warga-tip',
          title: 'Tips Pilah Sampah Sekeloa',
          message: 'Pastikan botol plastik PET bersih & kering untuk nilai setoran maksimal!',
          time: 'Info',
          type: 'INFO',
          actionUrl: '/katalog',
          isRead: true,
        });
      }

      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkPendingSync();
      fetchNotifications();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const syncListener = () => checkPendingSync();
    window.addEventListener('bank-sampah-sync-completed', syncListener);

    checkPendingSync();
    fetchNotifications();

    const interval = setInterval(() => {
      checkPendingSync();
      fetchNotifications();
    }, 8000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('bank-sampah-sync-completed', syncListener);
      clearInterval(interval);
    };
  }, [user]);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    await syncPendingTransactions();
    await checkPendingSync();
    setIsSyncing(false);
  };

  const handleRequestBrowserNotification = async () => {
    if (typeof Notification === 'undefined') {
      alert('Peramban Anda tidak mendukung Web Notifications.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserNotifPermission(permission);
      if (permission === 'granted') {
        new Notification('Sampiah', {
          body: 'Notifikasi berhasil diaktifkan! Anda akan menerima update transaksi dan pencairan.',
          icon: '/logo.png',
        });
      }
    } catch (err) {
      console.error('Failed to request notification permission', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 safe-top">
      <div className="flex items-center justify-between">
        {/* Left: Logo & Unit Badge */}
        <div className="flex items-center space-x-2.5">
          <AppLogo size="md" />
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-gray-900 text-sm tracking-tight leading-tight">
                Sampiah
              </h1>
            </div>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-[10px] text-gray-500 font-medium">Sampah jadi Rupiah</span>
              <span className="text-gray-300">•</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-semibold bg-forest-50 text-forest-800 border border-forest-200">
                {user?.rw || 'RW 08'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Online Pill, Bell Notification & User Avatar */}
        <div className="flex items-center space-x-2">
          {/* Offline / Pending Sync Indicator */}
          {pendingSyncCount > 0 ? (
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
              <span>{pendingSyncCount} Sync</span>
            </button>
          ) : !isOnline ? (
            <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="text-[11px]">Offline</span>
            </span>
          ) : null}

          {/* ACTIVE NOTIFICATION BELL BUTTON */}
          <button
            onClick={() => setShowNotifModal(true)}
            className="p-2 rounded-full text-gray-600 hover:text-forest-900 hover:bg-forest-50 transition relative"
            title="Buka Notifikasi"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

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

      {/* MODAL / DRAWER NOTIFIKASI AKTIF */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 pt-12 sm:pt-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-3.5 shadow-2xl max-h-[85vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-forest-50 text-forest-800 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">Notifikasi & Aktivitas</h3>
                  <p className="text-[11px] text-gray-500">
                    {unreadCount > 0 ? `${unreadCount} pemberitahuan baru` : 'Semua sudah dibaca'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotifModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Browser Push Notification Permission Banner */}
            {browserNotifPermission !== 'granted' && typeof Notification !== 'undefined' && (
              <div className="bg-forest-50/80 border border-forest-200 rounded-2xl p-3 flex items-center justify-between text-xs flex-shrink-0">
                <div className="space-y-0.5 pr-2">
                  <p className="font-bold text-forest-950">Aktifkan Notifikasi Web</p>
                  <p className="text-[10px] text-forest-800">
                    Terima info pencairan saldo & penimbangan seketika di ponsel Anda.
                  </p>
                </div>
                <button
                  onClick={handleRequestBrowserNotification}
                  className="px-2.5 py-1 bg-forest-900 hover:bg-forest-800 text-white text-[11px] font-bold rounded-xl flex-shrink-0 transition"
                >
                  Izinkan
                </button>
              </div>
            )}

            {/* Notif List */}
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-0.5">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400 space-y-1">
                  <Bell className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-xs font-semibold">Belum ada notifikasi baru</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.actionUrl) {
                        setShowNotifModal(false);
                        navigate(notif.actionUrl);
                      }
                    }}
                    className={`p-3 rounded-2xl border transition text-xs flex items-start space-x-2.5 ${
                      !notif.isRead
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    } ${notif.actionUrl ? 'cursor-pointer' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        notif.type === 'PENCAIRAN'
                          ? 'bg-amber-100 text-amber-800'
                          : notif.type === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : notif.type === 'ALERT'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {notif.type === 'PENCAIRAN' ? (
                        <Banknote className="w-4 h-4" />
                      ) : notif.type === 'SUCCESS' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : notif.type === 'ALERT' ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-xs text-gray-900">{notif.title}</h4>
                        <span className="text-[10px] text-gray-400 font-medium">{notif.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">{notif.message}</p>
                      {notif.actionUrl && (
                        <p className="text-[10px] font-bold text-forest-800 pt-1 flex items-center space-x-1">
                          <span>Lihat selengkapnya</span>
                          <ChevronRight className="w-3 h-3" />
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-2 flex-shrink-0 text-xs">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="font-bold text-forest-800 hover:text-forest-950 text-[11px]"
                >
                  Tandai Dibaca
                </button>
              )}
              <button
                onClick={() => setShowNotifModal(false)}
                className="ml-auto px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-[11px] transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
