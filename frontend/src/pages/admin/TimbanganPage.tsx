import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sampahApi } from '../../api/sampah.api';
import { userApi } from '../../api/user.api';
import { transaksiApi } from '../../api/transaksi.api';
import { SampahItem, User, KategoriSampah, StatusPembayaran } from '../../types';
import { db } from '../../db/offlineDb';
import {
  QrCode,
  Search,
  Scale,
  Minus,
  Plus,
  Leaf,
  CheckCircle2,
  Wallet,
  PiggyBank,
  Check,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
import { QrScannerModal } from '../../components/timbangan/QrScannerModal';

interface ItemWeightState {
  [sampahId: string]: number; // kuantitas dalam Kg atau Pcs
}

export const TimbanganPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Nasabah Terpilih
  const [warga, setWarga] = useState<User | null>(null);
  const [loadingWarga, setLoadingWarga] = useState<boolean>(false);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  // Master Sampah
  const [katalog, setKatalog] = useState<SampahItem[]>([]);
  const [loadingKatalog, setLoadingKatalog] = useState<boolean>(true);
  const [selectedKategori, setSelectedKategori] = useState<string>('SEMUA');

  // Matriks Timbangan
  const [weights, setWeights] = useState<ItemWeightState>({});
  const [metodePembayaran, setMetodePembayaran] = useState<StatusPembayaran>('TABUNGAN');

  // Submit State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Cek apakah ada query param wargaId
  useEffect(() => {
    const wargaId = searchParams.get('wargaId');
    if (wargaId) {
      loadWargaById(wargaId);
    }
  }, [searchParams]);

  // Load Katalog Sampah (Online with offline IndexedDB fallback & cache)
  useEffect(() => {
    const loadKatalog = async () => {
      try {
        if (navigator.onLine) {
          const res = await sampahApi.getKatalog();
          setKatalog(res.data);
          // Cache to IndexedDB for offline usage
          await db.cachedSampah.bulkPut(res.data);
        } else {
          // Read from IndexedDB offline cache
          const cached = await db.cachedSampah.toArray();
          setKatalog(cached);
        }
      } catch {
        // Fallback to cache on error
        const cached = await db.cachedSampah.toArray();
        if (cached.length > 0) {
          setKatalog(cached);
        }
      } finally {
        setLoadingKatalog(false);
      }
    };

    loadKatalog();
  }, []);

  const loadWargaById = async (id: string) => {
    setLoadingWarga(true);
    try {
      const res = await userApi.searchNasabah(undefined, user?.rw);
      const found = res.data.find((w) => w.id === id);
      if (found) {
        setWarga(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWarga(false);
    }
  };

  // Kategori counts
  const kategoriList = useMemo(() => {
    const map: Record<string, number> = {
      SEMUA: katalog.length,
      KERTAS: 0,
      LOGAM: 0,
      PLASTIK: 0,
      KACA: 0,
      LAINNYA: 0,
    };

    katalog.forEach((item) => {
      if (map[item.kategori] !== undefined) {
        map[item.kategori]++;
      }
    });

    return [
      { id: 'SEMUA', label: 'Semua', count: map.SEMUA },
      { id: 'KERTAS', label: 'Kertas', count: map.KERTAS },
      { id: 'LOGAM', label: 'Logam', count: map.LOGAM },
      { id: 'PLASTIK', label: 'Plastik', count: map.PLASTIK },
      { id: 'KACA', label: 'Kaca', count: map.KACA },
      { id: 'LAINNYA', label: 'Lainnya', count: map.LAINNYA },
    ];
  }, [katalog]);

  // Filtered Items
  const filteredKatalog = useMemo(() => {
    if (selectedKategori === 'SEMUA') return katalog;
    return katalog.filter((item) => item.kategori === selectedKategori);
  }, [katalog, selectedKategori]);

  // Handle Stepper
  const handleWeightChange = (sampahId: string, delta: number) => {
    setWeights((prev) => {
      const current = prev[sampahId] || 0;
      const next = Math.max(0, Math.round((current + delta) * 10) / 10);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[sampahId];
        return copy;
      }
      return { ...prev, [sampahId]: next };
    });
  };

  const handleManualInput = (sampahId: string, val: string) => {
    const parsed = parseFloat(val);
    setWeights((prev) => {
      if (isNaN(parsed) || parsed <= 0) {
        const copy = { ...prev };
        delete copy[sampahId];
        return copy;
      }
      return { ...prev, [sampahId]: parsed };
    });
  };

  // Total Summary
  const { totalBerat, totalHarga, activeItemsCount, activeItemsList } = useMemo(() => {
    let berat = 0;
    let harga = 0;
    let count = 0;
    const list: {
      sampah: SampahItem;
      kuantitas: number;
      subtotal: number;
    }[] = [];

    katalog.forEach((item) => {
      const qty = weights[item.id] || 0;
      if (qty > 0) {
        const sub = Math.round(qty * Number(item.hargaSatuan));
        berat += qty;
        harga += sub;
        count++;
        list.push({
          sampah: item,
          kuantitas: qty,
          subtotal: sub,
        });
      }
    });

    return {
      totalBerat: Math.round(berat * 10) / 10,
      totalHarga: harga,
      activeItemsCount: count,
      activeItemsList: list,
    };
  }, [katalog, weights]);

  // Handle Submit Transaksi
  const handleSubmitTransaksi = async () => {
    setSubmitError(null);

    if (!warga) {
      setSubmitError('Pilih nasabah terlebih dahulu sebelum menyimpan transaksi.');
      setScannerOpen(true);
      return;
    }

    if (activeItemsCount === 0) {
      setSubmitError('Pilih dan masukkan bobot minimal satu item sampah.');
      return;
    }

    setSubmitting(true);
    const clientOfflineId = crypto.randomUUID();

    try {
      if (navigator.onLine) {
        // Online submit via REST API
        const res = await transaksiApi.create({
          userId: warga.id,
          statusPembayaran: metodePembayaran,
          clientOfflineId,
          items: activeItemsList.map((it) => ({
            sampahAnorganikId: it.sampah.id,
            kuantitas: it.kuantitas,
          })),
        });

        // Navigate to Struk Digital page
        navigate(`/transaksi/${res.data.id}`);
      } else {
        // Offline submit: Simpan antrean ke IndexedDB
        await db.pendingTransactions.add({
          clientOfflineId,
          userId: warga.id,
          wargaNama: warga.nama,
          wargaKodeNasabah: warga.kodeNasabah,
          statusPembayaran: metodePembayaran,
          totalBerat,
          totalHarga,
          items: activeItemsList.map((it) => ({
            sampahAnorganikId: it.sampah.id,
            namaSampah: it.sampah.nama,
            kuantitas: it.kuantitas,
            hargaSatuan: Number(it.sampah.hargaSatuan),
            subtotal: it.subtotal,
          })),
          createdAt: new Date().toISOString(),
          syncStatus: 'PENDING',
        });

        alert(
          'Perangkat sedang offline. Transaksi berhasil disimpan di memori lokal (IndexedDB) dan akan otomatis disinkronisasi ke server saat koneksi internet aktif kembali.'
        );
        navigate('/riwayat');
      }
    } catch (err: any) {
      console.error('Error create transaksi:', err);
      setSubmitError(
        err.response?.data?.message || 'Gagal menyimpan transaksi. Periksa koneksi atau saldo kas.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-36 pt-2 px-4 space-y-4">
      {/* 1. Header Card Nasabah Terpilih (Matching timbangan-ui.png) */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs">
        {warga ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-900 font-black text-sm flex items-center justify-center">
                    {warga.nama
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-forest-600 text-white flex items-center justify-center border-2 border-white">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 leading-tight">
                    {warga.nama}
                  </h3>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                      {warga.rw} {warga.rt ? `/ ${warga.rt}` : ''}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      ID: {warga.kodeNasabah}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setScannerOpen(true)}
                className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-forest-100 text-gray-600 hover:text-forest-900 flex items-center justify-center transition active:scale-95"
                title="Ganti Nasabah"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-bar Saldo Tabungan */}
            <div className="bg-forest-50/70 rounded-2xl p-3 flex items-center justify-between border border-forest-100">
              <div>
                <p className="text-[10px] font-extrabold text-forest-800 tracking-wider uppercase">
                  Saldo Tabungan Saat Ini
                </p>
                <p className="text-base font-black text-forest-950 mt-0.5">
                  Rp {Number(warga.saldoTabungan || 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center text-[10px] font-bold text-forest-700 bg-white px-2 py-1 rounded-full shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-500 mr-1 animate-pulse"></span>
                  Siap Input
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setScannerOpen(true)}
            className="p-5 border-2 border-dashed border-forest-300 rounded-2xl bg-forest-50/50 hover:bg-forest-50 transition cursor-pointer flex flex-col items-center justify-center text-center space-y-2"
          >
            <div className="w-12 h-12 rounded-full bg-forest-900 text-white flex items-center justify-center shadow-md">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900">Pilih Nasabah untuk Menimbang</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Scan QR Code kartu nasabah atau cari berdasarkan nama
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Matriks Timbangan Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Scale className="w-4 h-4 text-forest-900" />
          <h3 className="font-extrabold text-sm text-gray-900">Input Matriks Timbangan</h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          ⚡ Step 0.1 kg
        </span>
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
        {kategoriList.map((kat) => (
          <button
            key={kat.id}
            onClick={() => setSelectedKategori(kat.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              selectedKategori === kat.id
                ? 'bg-forest-900 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
            }`}
          >
            <span>{kat.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedKategori === kat.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {kat.count}
            </span>
          </button>
        ))}
      </div>

      {/* 4. List of Waste Items with Steppers */}
      {loadingKatalog ? (
        <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400">
          Memuat katalog sampah...
        </div>
      ) : (
        <div className="space-y-3">
          {filteredKatalog.map((item) => {
            const currentQty = weights[item.id] || 0;
            const subtotal = Math.round(currentQty * Number(item.hargaSatuan));

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-4 border transition-all ${
                  currentQty > 0
                    ? 'border-forest-500 ring-2 ring-forest-500/10 shadow-xs'
                    : 'border-gray-100 shadow-2xs'
                }`}
              >
                {/* Header item: category tag + ID + Subtotal */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                      {item.kategori}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-gray-400">
                      ID: {item.id}
                    </span>
                  </div>

                  <span className="text-xs font-black text-forest-900">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Title & unit price */}
                <div className="mb-3">
                  <h4 className="font-extrabold text-xs text-gray-900">{item.nama}</h4>
                  <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                    Rp {Number(item.hargaSatuan).toLocaleString('id-ID')} / {item.satuan}
                  </p>
                </div>

                {/* Stepper control bar */}
                <div className="bg-gray-50 rounded-2xl p-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-gray-500 pl-1">
                    <Scale className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">Bobot Netto</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Stepper Minus */}
                    <button
                      type="button"
                      onClick={() => handleWeightChange(item.id, -0.5)}
                      disabled={currentQty <= 0}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold active:scale-90 transition disabled:opacity-30"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    {/* Manual Input */}
                    <div className="flex items-center bg-white px-2 py-1 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-forest-900 transition">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={currentQty > 0 ? currentQty : ''}
                        placeholder="0"
                        onChange={(e) => handleManualInput(item.id, e.target.value)}
                        className="w-12 text-center text-xs font-black text-gray-900 focus:outline-none bg-transparent"
                      />
                      <span className="text-[10px] font-bold text-gray-400 ml-0.5">
                        {item.satuan}
                      </span>
                    </div>

                    {/* Stepper Plus */}
                    <button
                      type="button"
                      onClick={() => handleWeightChange(item.id, 0.5)}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold active:scale-90 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Preset +5 */}
                    <button
                      type="button"
                      onClick={() => handleWeightChange(item.id, 5)}
                      className="px-2 py-1.5 rounded-xl bg-forest-100 text-forest-900 text-[10px] font-black active:scale-90 transition"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Eco Impact Banner */}
      <div className="bg-forest-50/70 border border-forest-100 rounded-3xl p-3.5 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-forest-200 text-forest-900 flex items-center justify-center flex-shrink-0">
          <Leaf className="w-4 h-4" />
        </div>
        <p className="text-[11px] text-forest-800 leading-snug">
          <strong className="font-extrabold">Tersimpan dalam Sirkular Sekeloa.</strong> Setoran ini
          mengurangi emisi karbon lokal sebesar ~{(totalBerat * 0.9).toFixed(1)} kg CO2e.
        </p>
      </div>

      {/* Error alert if any */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start space-x-2 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* 6. Fixed Bottom Summary & Payment Bar (Matching timbangan-ui.png) */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 shadow-lg">
        <div className="max-w-md mx-auto space-y-2.5">
          {/* Top Line: Total Berat & Total Rupiah */}
          <div className="flex items-center justify-between px-1">
            <div>
              <span className="text-[11px] text-gray-500 font-medium">Total: </span>
              <span className="text-base font-black text-gray-900">{totalBerat} Kg</span>
              <span className="text-[11px] text-gray-400 font-medium ml-1">
                ({activeItemsCount} item)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 font-medium block">Total Diterima</span>
              <span className="text-lg font-black text-forest-900 tracking-tight leading-tight">
                Rp {totalHarga.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Payment Method Selector Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-gray-100/90 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setMetodePembayaran('TUNAI')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                metodePembayaran === 'TUNAI'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-amber-600" />
              <span>Tunai Direct</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodePembayaran('TABUNGAN')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                metodePembayaran === 'TABUNGAN'
                  ? 'bg-white text-forest-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5 text-forest-700" />
              <span>Tabungan Warga</span>
              <span className="w-1.5 h-1.5 rounded-full bg-forest-600"></span>
            </button>
          </div>

          {/* Submit Action Button */}
          <button
            type="button"
            onClick={handleSubmitTransaksi}
            disabled={submitting}
            className="w-full py-3.5 bg-forest-900 hover:bg-forest-950 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50 active:scale-[0.98]"
          >
            {submitting ? (
              <span>Memproses Transaksi...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan & Cetak Struk Digital</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        defaultRw={user?.rw}
        onSelectWarga={(w) => setWarga(w)}
      />
    </div>
  );
};

