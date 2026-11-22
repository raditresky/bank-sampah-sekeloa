import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboard.api';
import { pencairanApi } from '../../api/pencairan.api';
import { kasPosApi, PetugasKasItem } from '../../api/kaspos.api';
import { userApi } from '../../api/user.api';
import { DashboardAdminSummary, Pencairan } from '../../types';
import {
  Scale,
  Banknote,
  Users,
  Wallet,
  QrCode,
  Package,
  FileSpreadsheet,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Info,
  Radio,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Check,
  Pencil,
  Loader2,
} from 'lucide-react';
import { QrScannerModal } from '../../components/timbangan/QrScannerModal';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardAdminSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  // Pencairan state & modal
  const [pendingPencairan, setPendingPencairan] = useState<Pencairan[]>([]);
  const [loadingPencairan, setLoadingPencairan] = useState<boolean>(false);
  const [isPencairanModalOpen, setIsPencairanModalOpen] = useState<boolean>(false);

  // Edit Saldo Kas Modal
  const [isKasModalOpen, setIsKasModalOpen] = useState<boolean>(false);
  const [nominalKasBaru, setNominalKasBaru] = useState<string>('');
  const [catatanKas, setCatatanKas] = useState<string>('');
  const [submittingKas, setSubmittingKas] = useState<boolean>(false);
  const [kasFeedback, setKasFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal Pendaftaran Nasabah Cepat
  const [isNasabahModalOpen, setIsNasabahModalOpen] = useState<boolean>(false);
  const [namaNasabah, setNamaNasabah] = useState<string>('');
  const [nomorHpNasabah, setNomorHpNasabah] = useState<string>('');
  const [rtNasabah, setRtNasabah] = useState<string>('RT 01');
  const [passwordNasabah, setPasswordNasabah] = useState<string>('123456');
  const [submittingNasabah, setSubmittingNasabah] = useState<boolean>(false);
  const [nasabahFeedback, setNasabahFeedback] = useState<{ type: 'success' | 'error'; message: string; createdUser?: any } | null>(null);

  // Action confirm modal (Approve / Reject single request)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'APPROVE' | 'REJECT';
    item: Pencairan | null;
  }>({
    isOpen: false,
    type: 'APPROVE',
    item: null,
  });
  const [catatanPetugas, setCatatanPetugas] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await dashboardApi.getSummary();
      if (res.data.role === 'ADMIN_OR_PETUGAS') {
        setSummary(res.data as DashboardAdminSummary);
      }
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPencairan = async () => {
    setLoadingPencairan(true);
    try {
      const res = await pencairanApi.getPending();
      setPendingPencairan(res.data || []);
    } catch (err) {
      console.error('Failed to load pending pencairan', err);
    } finally {
      setLoadingPencairan(false);
    }
  };

  const handleOpenKasModal = () => {
    setIsKasModalOpen(true);
    setKasFeedback(null);
    setCatatanKas('');
    setNominalKasBaru(summary?.pos?.saldoKas ? summary.pos.saldoKas.toString() : '0');
  };

  const handleOpenNasabahModal = () => {
    setIsNasabahModalOpen(true);
    setNamaNasabah('');
    setNomorHpNasabah('');
    setRtNasabah('RT 01');
    setPasswordNasabah('123456');
    setNasabahFeedback(null);
  };

  const handleCreateNasabah = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingNasabah(true);
    setNasabahFeedback(null);

    try {
      let cleanHp = nomorHpNasabah.trim().replace(/[\s-]/g, '');
      if (cleanHp.startsWith('+62')) {
        cleanHp = '0' + cleanHp.substring(3);
      } else if (cleanHp.startsWith('62')) {
        cleanHp = '0' + cleanHp.substring(2);
      } else if (!cleanHp.startsWith('0') && cleanHp.length > 0) {
        cleanHp = '0' + cleanHp;
      }

      const res = await userApi.createNasabah({
        nama: namaNasabah.trim(),
        nomorHp: cleanHp,
        password: passwordNasabah || '123456',
        rw: user?.rw || 'RW 08',
        rt: rtNasabah || undefined,
      });

      setNasabahFeedback({
        type: 'success',
        message: `Nasabah ${res.data.nama} berhasil didaftarkan! Kode Nasabah: ${res.data.kodeNasabah}`,
        createdUser: res.data,
      });

      await fetchDashboardData();
    } catch (err: any) {
      console.error(err);
      const validationDetails = Array.isArray(err.response?.data?.error)
        ? err.response.data.error.map((e: any) => e.message).join('. ')
        : null;

      setNasabahFeedback({
        type: 'error',
        message:
          validationDetails ||
          err.response?.data?.message ||
          'Gagal mendaftarkan nasabah baru. Periksa nomor HP atau kelengkapan data.',
      });
    } finally {
      setSubmittingNasabah(false);
    }
  };

  const handleUpdateSaldoKas = async (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = parseFloat(nominalKasBaru.replace(/\./g, '').replace(',', '.'));
    if (isNaN(nominal) || nominal < 0) {
      setKasFeedback({ type: 'error', message: 'Nominal tidak valid. Masukkan angka yang benar.' });
      return;
    }
    setSubmittingKas(true);
    setKasFeedback(null);
    try {
      const res = await kasPosApi.updateSaldoKas({
        saldoKas: nominal,
        catatan: catatanKas.trim() || undefined,
      });
      setKasFeedback({ type: 'success', message: res.message || 'Saldo kas berhasil diperbarui.' });
      await fetchDashboardData();
      setCatatanKas('');
      setTimeout(() => {
        setIsKasModalOpen(false);
        setKasFeedback(null);
      }, 1500);
    } catch (err: any) {
      setKasFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Gagal memperbarui saldo kas.',
      });
    } finally {
      setSubmittingKas(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchPendingPencairan();
  }, []);

  const handleOpenActionModal = (item: Pencairan, type: 'APPROVE' | 'REJECT') => {
    setActionModal({
      isOpen: true,
      type,
      item,
    });
    setCatatanPetugas('');
    setActionFeedback(null);
  };

  const handleProcessAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.item) return;

    setSubmittingAction(true);
    setActionFeedback(null);
    try {
      if (actionModal.type === 'APPROVE') {
        await pencairanApi.approve(actionModal.item.id, catatanPetugas.trim() || undefined);
        setActionFeedback({
          type: 'success',
          message: `Pencairan tabungan senilai Rp ${Number(actionModal.item.jumlahNominal).toLocaleString('id-ID')} berhasil disetujui! Saldo warga telah dipotong.`,
        });
      } else {
        await pencairanApi.reject(actionModal.item.id, catatanPetugas.trim() || undefined);
        setActionFeedback({
          type: 'success',
          message: `Permohonan pencairan berhasil ditolak.`,
        });
      }

      await fetchPendingPencairan();
      await fetchDashboardData();

      setTimeout(() => {
        setActionModal({ isOpen: false, type: 'APPROVE', item: null });
        setActionFeedback(null);
      }, 1400);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Gagal memproses permohonan pencairan.',
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-4">
      {/* 1. Header Profile & Active Pos Banner */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-forest-50 text-forest-900 border border-forest-200">
            <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse"></span>
            <span>{user?.rw ? `Pos Pelayanan ${user.rw}` : 'Pos Pelayanan RW Sekeloa'}</span>
          </span>
          <div className="p-1.5 rounded-full bg-gray-50 text-forest-700">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-gray-900">
              {user?.nama || 'Petugas Bank Sampah'}
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              {user?.role === 'ADMIN_RW' ? 'Admin RW' : 'Petugas Lapangan'}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block text-[11px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-md">
              Pos Aktif
            </span>
            <p className="text-[10px] text-gray-400 mt-0.5">Kel. Sekeloa</p>
          </div>
        </div>
      </div>

      {/* 2. Big Action Banner: Mulai Penimbangan */}
      <div
        onClick={() => navigate('/timbangan')}
        className="bg-gradient-to-r from-forest-950 via-forest-900 to-forest-800 rounded-3xl p-5 text-white shadow-lg shadow-forest-900/20 cursor-pointer active:scale-[0.98] transition group relative overflow-hidden"
      >
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none blur-xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-forest-100">
              + Input Cepat
            </span>
            <h3 className="text-xl font-black tracking-tight flex items-center space-x-2">
              <span>Mulai Penimbangan</span>
            </h3>
            <p className="text-xs text-forest-200/90 font-medium">
              Deteksi QR & catat timbangan multi-item warga
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-white transition shadow-inner flex-shrink-0">
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* 3. Four KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Setoran Hari Ini */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Setoran Hari Ini</span>
            <span className="p-2 rounded-xl bg-forest-50 text-forest-800">
              <Scale className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 tracking-tight">
              {summary ? summary.statistikHariIni.totalKg : '0'} <span className="text-xs font-bold text-gray-500">Kg</span>
            </p>
            <div className="flex items-center space-x-1 mt-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>Target Harian</span>
            </div>
          </div>
        </div>

        {/* Card 2: Nilai Transaksi */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Nilai Transaksi</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Banknote className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 tracking-tight">
              Rp {summary ? Number(summary.statistikHariIni.nilaiTransaksi).toLocaleString('id-ID') : '0'}
            </p>
            <p className="text-[11px] text-gray-400 font-medium mt-1">Perputaran sirkular</p>
          </div>
        </div>

        {/* Card 3: Warga Menyetor */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Warga Menyetor</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 tracking-tight">
              {summary ? summary.statistikHariIni.wargaMenyetor : '0'}
            </p>
            <p className="text-[11px] text-gray-400 font-medium mt-1">Warga / KK aktif</p>
          </div>
        </div>

        {/* Card 4: Saldo Kas Petugas / Pos */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Saldo Kas Petugas</span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleOpenKasModal}
                className="p-1.5 rounded-xl bg-forest-50 text-forest-800 hover:bg-forest-100 active:scale-95 transition"
                title="Kelola / Ubah Saldo Kas"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 tracking-tight">
              Rp {summary ? Number(summary.pos.saldoKas).toLocaleString('id-ID') : '0'}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full inline-block">
                {user?.role === 'ADMIN_RW' ? 'Kas Pegangan Anda' : 'Kas Anda'}
              </span>
              <button
                type="button"
                onClick={handleOpenKasModal}
                className="text-[10px] font-bold text-forest-800 hover:underline flex items-center space-x-0.5"
              >
                <span>Ubah Saldo</span>
                <span>&gt;</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Pintasan Operasional (DENGAN TOMBOL PENCAIRAN TABUNGAN) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
            Pintasan Operasional
          </h4>
          {pendingPencairan.length > 0 && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {pendingPencairan.length} Pencairan Menunggu
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Pintasan 1: Scan QR Warga */}
          <button
            onClick={() => setScannerOpen(true)}
            className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs flex items-center space-x-3 active:scale-95 transition text-left hover:border-forest-200"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-900 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-gray-900 block truncate">Scan QR Warga</span>
              <span className="text-[10px] text-gray-400 block truncate">Input Timbangan</span>
            </div>
          </button>

          {/* Pintasan 2: Permohonan Pencairan Tabungan (Dengan Badge Notifikasi) */}
          <button
            onClick={() => setIsPencairanModalOpen(true)}
            className={`p-3.5 rounded-2xl border shadow-2xs flex items-center space-x-3 active:scale-95 transition text-left relative ${
              pendingPencairan.length > 0
                ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20'
                : 'bg-white border-gray-100 hover:border-forest-200'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 relative">
              <Banknote className="w-5 h-5" />
              {pendingPencairan.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {pendingPencairan.length}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1">
                <span className="text-xs font-black text-gray-900 block truncate">Pencairan Saldo</span>
              </div>
              <span
                className={`text-[10px] block truncate ${
                  pendingPencairan.length > 0 ? 'text-amber-800 font-bold' : 'text-gray-400'
                }`}
              >
                {pendingPencairan.length > 0
                  ? `${pendingPencairan.length} Pengajuan Baru`
                  : 'Validasi Tabungan'}
              </span>
            </div>
          </button>

          {/* Pintasan 3: Katalog Realtime */}
          <button
            onClick={() => navigate('/katalog')}
            className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs flex items-center space-x-3 active:scale-95 transition text-left hover:border-forest-200"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-gray-900 block truncate">Katalog Realtime</span>
              <span className="text-[10px] text-gray-400 block truncate">Master & Harga</span>
            </div>
          </button>

          {/* Pintasan 4: Rekap & Struk */}
          <button
            onClick={() => navigate('/riwayat')}
            className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs flex items-center space-x-3 active:scale-95 transition text-left hover:border-forest-200"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-gray-900 block truncate">Rekap & Struk</span>
              <span className="text-[10px] text-gray-400 block truncate">Riwayat Transaksi</span>
            </div>
          </button>

          {/* Pintasan 5: Nasabah Baru */}
          <button
            onClick={handleOpenNasabahModal}
            className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs flex items-center space-x-3 active:scale-95 transition text-left hover:border-forest-200 col-span-2 sm:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black text-gray-900 block truncate">Nasabah Baru</span>
              <span className="text-[10px] text-gray-400 block truncate">Pendaftaran RW</span>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Target Setoran RW Hari Ini */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-gray-800">
            Target Setoran {user?.rw || 'RW 08'} Hari Ini
          </span>
          <span className="font-extrabold text-forest-900">
            {summary ? summary.statistikHariIni.totalKg : 0} / {summary ? summary.pos.targetKg : 500} Kg
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-forest-800 h-full rounded-full transition-all duration-500"
            style={{ width: `${summary ? summary.pos.progressPersen : 0}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
          <span>Pencapaian: {summary ? summary.pos.progressPersen : 0}%</span>
          <span className="text-forest-700 font-semibold">
            Tersisa{' '}
            {summary
              ? Math.max(0, summary.pos.targetKg - summary.statistikHariIni.totalKg).toFixed(1)
              : 500}{' '}
            Kg lagi
          </span>
        </div>
      </div>

      {/* 6. Setoran Terkini Hari Ini */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-gray-900">Setoran Terkini</h4>
          <button
            onClick={() => navigate('/riwayat')}
            className="text-xs font-bold text-forest-700 hover:text-forest-900 transition"
          >
            Lihat Semua &gt;
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-6 text-center text-xs text-gray-400">
            Memuat transaksi terkini...
          </div>
        ) : !summary || summary.transaksiTerkini.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-gray-700">Belum ada transaksi hari ini</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Klik &quot;Mulai Penimbangan&quot; untuk input setoran pertama.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {summary.transaksiTerkini.map((trx) => {
              const initials = trx.warga?.nama
                ? trx.warga.nama
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'NB';

              return (
                <div
                  key={trx.id}
                  onClick={() => navigate(`/transaksi/${trx.id}`)}
                  className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-2xs hover:border-forest-300 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-forest-100 text-forest-900 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-gray-900">
                        {trx.warga?.nama || 'Nasabah RW'}
                        <span className="text-[10px] font-normal text-gray-500 ml-1">
                          ({trx.warga?.rt || 'RT 01'})
                        </span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {new Date(trx.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-gray-900">
                      {Number(trx.totalBerat).toFixed(1)} Kg
                    </p>
                    <p className="text-[11px] font-semibold text-gray-600">
                      Rp {Number(trx.totalHarga).toLocaleString('id-ID')}
                    </p>
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                        trx.statusPembayaran === 'TABUNGAN'
                          ? 'bg-forest-50 text-forest-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {trx.statusPembayaran}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Penyaluran Info Banner */}
      <div className="bg-forest-50/70 border border-forest-100 rounded-3xl p-4 flex items-start space-x-3">
        <Info className="w-5 h-5 text-forest-800 flex-shrink-0 mt-0.5" />
        <div>
          <h5 className="text-xs font-bold text-forest-950">Penyaluran Hasil Pilah RW 08</h5>
          <p className="text-[11px] text-forest-800 leading-relaxed mt-0.5">
            Truk pengepul DLH Kota Bandung dijadwalkan tiba pukul 16:30 WIB. Pastikan timbangan
            terverifikasi sebelum penjemputan.
          </p>
        </div>
      </div>

      {/* MODAL DAFTAR PERMOHONAN PENCAIRAN TABUNGAN (DIBUKA DARI PINTASAN OPERASIONAL) */}
      {isPencairanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Permohonan Pencairan Tabungan
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {pendingPencairan.length} permohonan menunggu persetujuan admin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPencairanModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body List */}
            <div className="overflow-y-auto space-y-3 flex-1 pr-0.5">
              {loadingPencairan ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  Memuat data permohonan...
                </div>
              ) : pendingPencairan.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-gray-800">
                    Tidak ada antrean pencairan tabungan
                  </p>
                  <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                    Semua permohonan penarikan saldo warga RW {user?.rw} sudah terselesaikan.
                  </p>
                </div>
              ) : (
                pendingPencairan.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border-2 border-amber-300 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-black text-xs text-gray-900">
                          {item.warga?.nama || 'Nasabah RW'}
                        </h5>
                        <p className="text-[10px] text-gray-500">
                          {item.warga?.rw} {item.warga?.rt ? `/ ${item.warga.rt}` : ''} •{' '}
                          {item.warga?.nomorHp || '-'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          ID: {item.warga?.kodeNasabah}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800">
                          Menunggu
                        </span>
                        <p className="text-base font-black text-forest-900 mt-1">
                          Rp {Number(item.jumlahNominal).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    {/* Detail Info */}
                    <div className="bg-gray-50 rounded-xl p-2.5 text-[11px] space-y-1 border border-gray-100">
                      <div className="flex justify-between text-gray-600">
                        <span>Metode:</span>
                        <strong className="text-gray-900 font-bold">
                          {item.metode === 'TUNAI' ? 'Tunai di Pos RW' : 'Transfer / E-Wallet'}
                        </strong>
                      </div>
                      {item.infoRekening && (
                        <div className="flex justify-between text-gray-600">
                          <span>Akun Tujuan:</span>
                          <strong className="text-gray-900 font-bold">{item.infoRekening}</strong>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>Saldo Warga Saat Ini:</span>
                        <span className="font-bold text-emerald-700">
                          Rp {Number(item.warga?.saldoTabungan || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {item.catatan && (
                        <div className="pt-1 border-t border-gray-200 text-gray-500 italic">
                          &quot;{item.catatan}&quot;
                        </div>
                      )}
                      <div className="text-[10px] text-gray-400 pt-0.5 font-mono">
                        #{item.nomorPencairan} •{' '}
                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleOpenActionModal(item, 'APPROVE')}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui (Cairkan)</span>
                      </button>

                      <button
                        onClick={() => handleOpenActionModal(item, 'REJECT')}
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 active:scale-95 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center border-t border-gray-100 pt-3 flex-shrink-0">
              <button
                onClick={fetchPendingPencairan}
                className="text-xs font-bold text-forest-800 hover:text-forest-950"
              >
                Segarkan Antrean
              </button>
              <button
                onClick={() => setIsPencairanModalOpen(false)}
                className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Approval / Rejection Modal */}
      {actionModal.isOpen && actionModal.item && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    actionModal.type === 'APPROVE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {actionModal.type === 'APPROVE' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    {actionModal.type === 'APPROVE' ? 'Setujui Pencairan' : 'Tolak Permohonan'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {actionModal.type === 'APPROVE'
                      ? 'Validasi & cairkan saldo warga'
                      : 'Berikan alasan penolakan'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionModal({ isOpen: false, type: 'APPROVE', item: null })}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Box */}
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Nasabah:</span>
                <span className="font-bold text-gray-900">{actionModal.item.warga?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah Pencairan:</span>
                <span className="font-black text-forest-900">
                  Rp {Number(actionModal.item.jumlahNominal).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Metode:</span>
                <span className="font-bold text-gray-900">
                  {actionModal.item.metode} {actionModal.item.infoRekening ? `(${actionModal.item.infoRekening})` : ''}
                </span>
              </div>
            </div>

            {actionFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-center space-x-2 ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {actionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{actionFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleProcessAction} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {actionModal.type === 'APPROVE'
                    ? 'Catatan Petugas (Opsional)'
                    : 'Alasan Penolakan (Wajib/Opsional)'}
                </label>
                <input
                  type="text"
                  value={catatanPetugas}
                  onChange={(e) => setCatatanPetugas(e.target.value)}
                  placeholder={
                    actionModal.type === 'APPROVE'
                      ? 'Contoh: Uang tunai diserahkan di pos'
                      : 'Contoh: Saldo tidak mencukupi / Nomor rekening salah'
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, type: 'APPROVE', item: null })}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition disabled:opacity-50 ${
                    actionModal.type === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submittingAction
                    ? 'Memproses...'
                    : actionModal.type === 'APPROVE'
                    ? 'Ya, Cairkan'
                    : 'Tolak Permohonan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pendaftaran Nasabah Cepat */}
      {isNasabahModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Pendaftaran Nasabah Baru</h3>
                  <p className="text-[11px] text-gray-500">Daftarkan warga ke {user?.rw || 'RW setempat'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsNasabahModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-4 pr-1">
              {nasabahFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs flex flex-col space-y-2 ${
                    nasabahFeedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {nasabahFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                    )}
                    <span className="font-semibold">{nasabahFeedback.message}</span>
                  </div>

                  {nasabahFeedback.createdUser && (
                    <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold">
                        {nasabahFeedback.createdUser.kodeNasabah}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNasabahModalOpen(false);
                          navigate(`/timbangan?wargaId=${nasabahFeedback.createdUser.id}`);
                        }}
                        className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-800 transition"
                      >
                        Langsung Timbang &gt;
                      </button>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleCreateNasabah} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap Warga</label>
                  <input
                    type="text"
                    required
                    value={namaNasabah}
                    onChange={(e) => setNamaNasabah(e.target.value)}
                    placeholder="Contoh: Ibu Siti Aminah"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="tel"
                    required
                    value={nomorHpNasabah}
                    onChange={(e) => setNomorHpNasabah(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Wilayah RW</label>
                    <input
                      type="text"
                      disabled
                      value={user?.rw || 'RW 08'}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">RT (Opsional)</label>
                    <input
                      type="text"
                      value={rtNasabah}
                      onChange={(e) => setRtNasabah(e.target.value)}
                      placeholder="RT 01"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Petugas / Admin Pendaftar
                  </label>
                  <div className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-between">
                    <span>{user?.nama || 'Petugas RW'} ({user?.rw || 'RW 08'})</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                      Tercatat di Sistem
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Nama Anda otomatis tercatat di database sebagai petugas yang mendaftarkan nasabah ini.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    PIN / Password Awal Nasabah
                  </label>
                  <input
                    type="text"
                    value={passwordNasabah}
                    onChange={(e) => setPasswordNasabah(e.target.value)}
                    placeholder="Default: 123456"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-700 font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Nasabah dapat mengganti kata sandi setelah masuk ke aplikasi mereka.
                  </p>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNasabahModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={submittingNasabah}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                  >
                    {submittingNasabah ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mendaftarkan...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Daftarkan Warga</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UBAH SALDO KAS SAYA */}
      {isKasModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Ubah Saldo Kas Saya
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    RW {user?.rw || '08'} • Kas operasional pribadi pegangan Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKasModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {kasFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs flex items-center space-x-2 ${
                    kasFeedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {kasFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{kasFeedback.message}</span>
                </div>
              )}

              {/* Info Kas Saat Ini */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Kas Terdaftar Saat Ini
                  </span>
                  <h4 className="text-sm font-extrabold text-gray-900 mt-0.5">{user?.nama}</h4>
                  <p className="text-[11px] text-gray-500">Admin RW {user?.rw} • {user?.nomorHp}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Saldo Kas</span>
                  <p className="text-base font-black text-forest-900">
                    Rp {summary ? Number(summary.pos.saldoKas).toLocaleString('id-ID') : '0'}
                  </p>
                </div>
              </div>

              {/* Form Input Saldo Baru */}
              <form onSubmit={handleUpdateSaldoKas} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Nominal Saldo Kas Baru (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-extrabold text-gray-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={nominalKasBaru}
                      onChange={(e) => setNominalKasBaru(e.target.value)}
                      placeholder="Contoh: 1500000"
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-800"
                      required
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-medium">Pilihan Nominal Cepat:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[500000, 1000000, 2000000, 3000000].map((nominal) => (
                      <button
                        key={nominal}
                        type="button"
                        onClick={() => setNominalKasBaru(nominal.toString())}
                        className="py-1 px-1.5 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-700 bg-gray-50 hover:bg-forest-50 hover:border-forest-300 hover:text-forest-800 active:scale-95 transition truncate"
                      >
                        {(nominal / 1000).toLocaleString('id-ID')} rb
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Catatan / Alasan Perubahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={catatanKas}
                    onChange={(e) => setCatatanKas(e.target.value)}
                    placeholder="Contoh: Tambahan modal awal / Penyesuaian fisik kas"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsKasModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingKas}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-forest-900 hover:bg-forest-800 shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                  >
                    {submittingKas ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan Saldo</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        defaultRw={user?.rw}
        onSelectWarga={(warga) => {
          navigate(`/timbangan?wargaId=${warga.id}`);
        }}
      />
    </div>
  );
};
