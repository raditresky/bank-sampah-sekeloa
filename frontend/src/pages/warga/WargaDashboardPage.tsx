import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboard.api';
import { DashboardWargaSummary } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  Wallet,
  Scale,
  Package,
  ReceiptText,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const WargaDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardWargaSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await dashboardApi.getSummary();
        if (res.data.role === 'WARGA') {
          setSummary(res.data as DashboardWargaSummary);
        }
      } catch (err) {
        console.error('Failed to load warga dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const saldo = summary ? summary.nasabah.saldoTabungan : Number(user?.saldoTabungan || 0);

  return (
    <div className="pb-24 pt-2 px-4 space-y-4">
      {/* 1. Header Card Saldo Tabungan */}
      <div className="bg-gradient-to-br from-forest-950 via-forest-900 to-forest-800 rounded-3xl p-5 text-white shadow-lg shadow-forest-900/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-forest-200" />
            <span>Tabungan Lingkungan RW</span>
          </div>
          <span className="text-[11px] font-mono text-forest-200 font-semibold">
            {user?.rw} {user?.rt ? `/ ${user.rt}` : ''}
          </span>
        </div>

        <div>
          <p className="text-xs font-medium text-forest-200/90">Total Saldo Tabungan Anda</p>
          <h2 className="text-3xl font-black tracking-tight mt-1">
            Rp {Number(saldo).toLocaleString('id-ID')}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
          <div>
            <p className="text-[10px] text-forest-200">Total Sampah Disetor</p>
            <p className="font-extrabold text-sm mt-0.5">
              {summary ? summary.statistik.totalBeratDisetor.toFixed(1) : 0} Kg
            </p>
          </div>
          <div>
            <p className="text-[10px] text-forest-200">Frekuensi Setoran</p>
            <p className="font-extrabold text-sm mt-0.5">
              {summary ? summary.statistik.totalFrekuensiSetoran : 0} Kali
            </p>
          </div>
        </div>
      </div>

      {/* 2. Kartu QR Code ID Warga (Ready to Scan at Pos RW) */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm text-center space-y-3">
        <div>
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-[10px] font-bold">
            <ShieldCheck className="w-3 h-3 text-forest-600" />
            <span>KARTU NASABAH RESMI</span>
          </span>
          <h3 className="font-extrabold text-base text-gray-900 mt-1">QR Code Identitas Nasabah</h3>
          <p className="text-xs text-gray-500">
            Tunjukkan kartu ini kepada Petugas saat menimbang sampah di Pos RW
          </p>
        </div>

        {/* QR Code Container */}
        <div className="inline-block p-4 bg-gray-50 rounded-2xl border-2 border-forest-500/30 shadow-inner">
          <QRCodeSVG
            value={user?.kodeNasabah || 'BS-SKL-08034'}
            size={180}
            level="H"
            includeMargin={true}
          />
        </div>

        <div>
          <p className="font-mono text-sm font-black text-gray-900 tracking-wider">
            {user?.kodeNasabah || 'BS-SKL-08034'}
          </p>
          <p className="text-xs font-bold text-gray-700 mt-0.5">{user?.nama}</p>
          <p className="text-[11px] text-gray-400">
            {user?.nomorHp} • {user?.rw}
          </p>
        </div>
      </div>

      {/* 3. Pintasan Menu Warga */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/katalog')}
          className="bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs hover:border-forest-300 transition text-left flex items-center justify-between group"
        >
          <div className="space-y-1">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <p className="text-xs font-extrabold text-gray-900">Katalog Harga</p>
            <p className="text-[10px] text-gray-500">Cek harga per kg</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-forest-900 group-hover:translate-x-0.5 transition" />
        </button>

        <button
          onClick={() => navigate('/riwayat')}
          className="bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs hover:border-forest-300 transition text-left flex items-center justify-between group"
        >
          <div className="space-y-1">
            <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-900 flex items-center justify-center">
              <ReceiptText className="w-4 h-4" />
            </div>
            <p className="text-xs font-extrabold text-gray-900">Riwayat Setoran</p>
            <p className="text-[10px] text-gray-500">Struk digital Anda</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-forest-900 group-hover:translate-x-0.5 transition" />
        </button>
      </div>

      {/* 4. Transaksi Terakhir */}
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
          Setoran Terakhir
        </h4>
        {loading ? (
          <div className="bg-white rounded-2xl p-6 text-center text-xs text-gray-400">
            Memuat riwayat...
          </div>
        ) : summary?.transaksiTerakhir ? (
          <div
            onClick={() => navigate(`/transaksi/${summary.transaksiTerakhir?.id}`)}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs hover:border-forest-300 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-900 flex items-center justify-center">
                <ReceiptText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {summary.transaksiTerakhir.nomorTransaksi}
                </p>
                <p className="text-[10px] text-gray-400">
                  {new Date(summary.transaksiTerakhir.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-black text-forest-900">
                Rp {Number(summary.transaksiTerakhir.totalHarga).toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] font-semibold text-gray-500">
                {Number(summary.transaksiTerakhir.totalBerat)} Kg
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-gray-700">Belum ada setoran sampah</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Bawa sampah anorganik Anda ke pos RW 08 untuk mulai menabung!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

