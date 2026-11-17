import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboard.api';
import { DashboardAdminSummary } from '../../types';
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
} from 'lucide-react';
import { QrScannerModal } from '../../components/timbangan/QrScannerModal';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardAdminSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchSummary = async () => {
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

    fetchSummary();
  }, []);

  return (
    <div className="pb-24 pt-2 px-4 space-y-4">
      {/* 1. Header Profile & Active Pos Banner */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-forest-50 text-forest-900 border border-forest-200">
            <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse"></span>
            <span>{summary?.pos?.namaUnit || user?.unitBankSampah || 'Unit Flamboyan 50 — RW 08 Sekeloa'}</span>
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

        {/* Card 4: Saldo Kas Pos */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Saldo Kas Pos</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 tracking-tight">
              Rp {summary ? Number(summary.pos.saldoKas).toLocaleString('id-ID') : '0'}
            </p>
            <span className="text-[10px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full inline-block mt-1">
              Siap bayar tunai
            </span>
          </div>
        </div>
      </div>

      {/* 4. Pintasan Operasional (4 Buttons) */}
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
          Pintasan Operasional
        </h4>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setScannerOpen(true)}
            className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex flex-col items-center justify-center space-y-1.5 active:scale-95 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-900 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">
              Scan QR Warga
            </span>
          </button>

          <button
            onClick={() => navigate('/katalog')}
            className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex flex-col items-center justify-center space-y-1.5 active:scale-95 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">
              Katalog Realtime
            </span>
          </button>

          <button
            onClick={() => navigate('/riwayat')}
            className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex flex-col items-center justify-center space-y-1.5 active:scale-95 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">
              Rekap Kas RW
            </span>
          </button>

          <button
            onClick={() => {
              alert('Fitur Pendaftaran Cepat Nasabah: Arahkan warga untuk membuka halaman pendaftaran di aplikasi mereka!');
            }}
            className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex flex-col items-center justify-center space-y-1.5 active:scale-95 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">
              Nasabah Baru
            </span>
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

