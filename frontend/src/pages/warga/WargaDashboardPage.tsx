import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboard.api';
import { pencairanApi } from '../../api/pencairan.api';
import { DashboardWargaSummary, Pencairan, MetodePencairan } from '../../types';
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
  Banknote,
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Building2,
} from 'lucide-react';

export const WargaDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [summary, setSummary] = useState<DashboardWargaSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingPencairan, setPendingPencairan] = useState<Pencairan[]>([]);

  // Modal Pencairan State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawMetode, setWithdrawMetode] = useState<MetodePencairan>('TUNAI');
  const [withdrawProvider, setWithdrawProvider] = useState<string>('DANA');
  const [withdrawNoRekening, setWithdrawNoRekening] = useState<string>('');
  const [withdrawAtasNama, setWithdrawAtasNama] = useState<string>(user?.nama || '');
  const [withdrawCatatan, setWithdrawCatatan] = useState<string>('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const fetchDashboardData = async () => {
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

    try {
      const pencairanRes = await pencairanApi.getAll({ status: 'MENUNGGU' });
      setPendingPencairan(pencairanRes.data || []);
    } catch (err) {
      console.error('Failed to load pending pencairan', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const saldo = summary ? summary.nasabah.saldoTabungan : Number(user?.saldoTabungan || 0);

  const handleOpenModal = () => {
    setWithdrawAmount('');
    setWithdrawMetode('TUNAI');
    setWithdrawProvider('DANA');
    setWithdrawNoRekening(user?.nomorHp || '');
    setWithdrawAtasNama(user?.nama || '');
    setWithdrawCatatan('');
    setWithdrawError(null);
    setWithdrawSuccess(null);
    setIsWithdrawModalOpen(true);
  };

  const handlePresetAmount = (presetVal: number) => {
    const val = Math.min(presetVal, saldo);
    setWithdrawAmount(val.toString());
  };

  const handleSubmitPencairan = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    const nominalNum = Number(withdrawAmount);
    if (isNaN(nominalNum) || nominalNum <= 0) {
      setWithdrawError('Masukkan nominal pencairan yang valid.');
      return;
    }

    if (nominalNum < 5000) {
      setWithdrawError('Minimal penarikan saldo adalah Rp 5.000.');
      return;
    }

    if (nominalNum > saldo) {
      setWithdrawError(`Saldo tabungan Anda tidak mencukupi (Rp ${saldo.toLocaleString('id-ID')}).`);
      return;
    }

    let infoRekening = '';
    if (withdrawMetode === 'TRANSFER') {
      if (!withdrawNoRekening.trim() || !withdrawAtasNama.trim()) {
        setWithdrawError('Nomor akun / rekening dan nama pemilik wajib diisi untuk transfer.');
        return;
      }
      infoRekening = `${withdrawProvider}: ${withdrawNoRekening.trim()} a.n. ${withdrawAtasNama.trim()}`;
    }

    setSubmittingWithdraw(true);
    try {
      await pencairanApi.create({
        jumlahNominal: nominalNum,
        metode: withdrawMetode,
        infoRekening: infoRekening || undefined,
        catatan: withdrawCatatan.trim() || undefined,
      });

      setWithdrawSuccess('Permohonan pencairan berhasil diajukan! Menunggu persetujuan Admin Pos RW.');
      await refreshUser();
      await fetchDashboardData();

      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawSuccess(null);
      }, 1500);
    } catch (err: any) {
      setWithdrawError(err.response?.data?.message || err.message || 'Gagal mengajukan pencairan.');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

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
          <div className="flex items-baseline justify-between mt-1">
            <h2 className="text-3xl font-black tracking-tight">
              Rp {Number(saldo).toLocaleString('id-ID')}
            </h2>
          </div>
        </div>

        {/* Tombol Cairkan Saldo */}
        <div className="mt-4">
          <button
            onClick={handleOpenModal}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition"
          >
            <Banknote className="w-4 h-4" />
            <span>Cairkan / Tarik Saldo Tabungan</span>
          </button>
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

      {/* Banner Menunggu Pencairan (Jika ada pengajuan aktif) */}
      {pendingPencairan.length > 0 && (
        <div className="space-y-2">
          {pendingPencairan.map((p) => (
            <div
              key={p.id}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start space-x-3 text-amber-900"
            >
              <Clock className="w-5 h-5 text-amber-600 animate-pulse flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black">Pengajuan Pencairan Diproses</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-900">
                    Menunggu Admin
                  </span>
                </div>
                <p className="mt-1 font-extrabold text-sm text-amber-950">
                  Rp {Number(p.jumlahNominal).toLocaleString('id-ID')}
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Metode: <strong className="font-bold">{p.metode}</strong>{' '}
                  {p.infoRekening ? `(${p.infoRekening})` : '(Ambil di Pos RW 08)'}
                </p>
                <p className="text-[10px] text-amber-700 font-mono mt-1">
                  #{p.nomorPencairan} • Diajukan {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <p className="text-[10px] text-gray-500">Struk & pencairan</p>
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

      {/* Modal Pencairan Tabungan */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">Pencairan Saldo Tabungan</h3>
                  <p className="text-[11px] text-gray-500">Tarik saldo hasil setoran sampah Anda</p>
                </div>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Saldo Tersedia Card */}
            <div className="bg-gradient-to-r from-forest-900 to-forest-800 rounded-2xl p-3.5 text-white flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] text-forest-200 uppercase font-bold tracking-wider">
                  Saldo Tersedia
                </p>
                <p className="text-xl font-black mt-0.5">
                  Rp {Number(saldo).toLocaleString('id-ID')}
                </p>
              </div>
              <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded-full font-bold">
                {user?.rw}
              </span>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPencairan} className="space-y-3.5">
              {/* Input Nominal */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nominal Pencairan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="5000"
                    max={saldo}
                    step="1000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full pl-11 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-forest-800 text-gray-900"
                    required
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[20000, 50000, 100000].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      disabled={saldo < preset}
                      onClick={() => handlePresetAmount(preset)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition ${
                        Number(withdrawAmount) === preset
                          ? 'bg-forest-900 text-white border-forest-900'
                          : saldo >= preset
                          ? 'bg-gray-50 border-gray-200 text-gray-700 hover:border-forest-400'
                          : 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                      }`}
                    >
                      Rp {preset.toLocaleString('id-ID')}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={saldo <= 0}
                    onClick={() => handlePresetAmount(saldo)}
                    className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-forest-50 border border-forest-200 text-forest-800 hover:bg-forest-100 transition disabled:opacity-40"
                  >
                    Semua Saldo
                  </button>
                </div>
              </div>

              {/* Pilihan Metode */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Metode Penerimaan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawMetode('TUNAI')}
                    className={`p-3 rounded-2xl border text-left flex items-start space-x-2 transition ${
                      withdrawMetode === 'TUNAI'
                        ? 'border-forest-800 bg-forest-50/60 ring-2 ring-forest-800/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-forest-800 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-black text-gray-900">Tunai di Pos</p>
                      <p className="text-[10px] text-gray-500">Ambil di Pos RW 08</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithdrawMetode('TRANSFER')}
                    className={`p-3 rounded-2xl border text-left flex items-start space-x-2 transition ${
                      withdrawMetode === 'TRANSFER'
                        ? 'border-forest-800 bg-forest-50/60 ring-2 ring-forest-800/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-forest-800 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-black text-gray-900">Transfer / E-Wallet</p>
                      <p className="text-[10px] text-gray-500">DANA, GoPay, Bank</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Form Tambahan jika Metode TRANSFER */}
              {withdrawMetode === 'TRANSFER' && (
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Pilihan Bank / Dompet Digital
                    </label>
                    <select
                      value={withdrawProvider}
                      onChange={(e) => setWithdrawProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    >
                      <option value="DANA">DANA</option>
                      <option value="GOPAY">GoPay</option>
                      <option value="OVO">OVO</option>
                      <option value="SHOPEEPAY">ShopeePay</option>
                      <option value="BCA">Bank BCA</option>
                      <option value="BRI">Bank BRI</option>
                      <option value="MANDIRI">Bank Mandiri</option>
                      <option value="BNI">Bank BNI</option>
                      <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Nomor HP / Nomor Rekening
                    </label>
                    <input
                      type="text"
                      value={withdrawNoRekening}
                      onChange={(e) => setWithdrawNoRekening(e.target.value)}
                      placeholder="Contoh: 08123456789 atau 1234567890"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-800"
                      required={withdrawMetode === 'TRANSFER'}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Nama Pemilik Rekening / Akun
                    </label>
                    <input
                      type="text"
                      value={withdrawAtasNama}
                      onChange={(e) => setWithdrawAtasNama(e.target.value)}
                      placeholder="Sesuai nama terdaftar di bank/e-wallet"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-800"
                      required={withdrawMetode === 'TRANSFER'}
                    />
                  </div>
                </div>
              )}

              {/* Catatan Opsional */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={withdrawCatatan}
                  onChange={(e) => setWithdrawCatatan(e.target.value)}
                  placeholder="Misal: Ambil sabtu pagi di Pos"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingWithdraw || saldo < 5000}
                  className="w-full py-3 bg-forest-900 hover:bg-forest-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {submittingWithdraw ? (
                    <span>Mengirimkan Permohonan...</span>
                  ) : (
                    <>
                      <ArrowDownToLine className="w-4 h-4" />
                      <span>Kirim Permohonan Pencairan</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-2">
                  Setelah diajukan, Admin Pos RW akan memvalidasi & mencairkan dana.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
