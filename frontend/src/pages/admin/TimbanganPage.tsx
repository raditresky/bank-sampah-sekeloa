import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sampahApi } from '../../api/sampah.api';
import { userApi } from '../../api/user.api';
import { transaksiApi } from '../../api/transaksi.api';
import { SampahItem, User, StatusPembayaran } from '../../types';
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
  RefreshCw,
  UserCheck,
  Package,
} from 'lucide-react';
import { QrScannerModal } from '../../components/timbangan/QrScannerModal';

export const TimbanganPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Nasabah Terpilih
  const [warga, setWarga] = useState<User | null>(null);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [scannerInitialTab, setScannerInitialTab] = useState<'scan' | 'manual'>('scan');

  // Daftar Nasabah Cepat (untuk pemilihan instan saat belum scan)
  const [recentWargaList, setRecentWargaList] = useState<User[]>([]);
  const [loadingRecentWarga, setLoadingRecentWarga] = useState<boolean>(false);

  // Master Sampah
  const [katalog, setKatalog] = useState<SampahItem[]>([]);
  const [loadingKatalog, setLoadingKatalog] = useState<boolean>(true);
  const [selectedKategori, setSelectedKategori] = useState<string>('SEMUA');
  const [katalogSearch, setKatalogSearch] = useState<string>('');

  // Input Bobot per Sampah (disimpan sebagai string agar input desimal "0.", "1.25" lancar diketik)
  const [rawWeights, setRawWeights] = useState<Record<string, string>>({});
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

  // Load Daftar Nasabah Cepat saat awal jika belum ada warga terpilih
  useEffect(() => {
    const fetchRecentNasabah = async () => {
      setLoadingRecentWarga(true);
      try {
        const res = await userApi.searchNasabah(undefined, user?.rw);
        setRecentWargaList(res.data);
      } catch (err) {
        console.error('Failed to load recent nasabah', err);
      } finally {
        setLoadingRecentWarga(false);
      }
    };

    fetchRecentNasabah();
  }, [user?.rw]);

  // Load Katalog Sampah
  useEffect(() => {
    const loadKatalog = async () => {
      try {
        if (navigator.onLine) {
          const res = await sampahApi.getKatalog();
          setKatalog(res.data);
          await db.cachedSampah.clear();
          await db.cachedSampah.bulkPut(res.data);
        } else {
          const cached = await db.cachedSampah.toArray();
          setKatalog(cached);
        }
      } catch {
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
    try {
      const res = await userApi.getById(id);
      if (res.data) {
        setWarga(res.data);
      }
    } catch {
      // Fallback search
      try {
        const searchRes = await userApi.searchNasabah(undefined, user?.rw);
        const found = searchRes.data.find((w) => w.id === id);
        if (found) setWarga(found);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Kategori counts
  const kategoriList = useMemo(() => {
    const map: Record<string, number> = {
      SEMUA: katalog.length,
      PLASTIK: 0,
      KERTAS: 0,
      LOGAM: 0,
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
      { id: 'PLASTIK', label: 'Plastik', count: map.PLASTIK },
      { id: 'KERTAS', label: 'Kertas', count: map.KERTAS },
      { id: 'LOGAM', label: 'Logam', count: map.LOGAM },
      { id: 'KACA', label: 'Kaca', count: map.KACA },
      { id: 'LAINNYA', label: 'Lainnya', count: map.LAINNYA },
    ];
  }, [katalog]);

  // Filtered Items
  const filteredKatalog = useMemo(() => {
    return katalog.filter((item) => {
      const matchesKategori =
        selectedKategori === 'SEMUA' || item.kategori === selectedKategori;
      const matchesSearch =
        item.nama.toLowerCase().includes(katalogSearch.toLowerCase()) ||
        item.id.toLowerCase().includes(katalogSearch.toLowerCase()) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(katalogSearch.toLowerCase()));
      return matchesKategori && matchesSearch;
    });
  }, [katalog, selectedKategori, katalogSearch]);

  // Handle Stepper (+ / -) dengan presisi desimal
  const handleWeightDelta = (sampahId: string, delta: number) => {
    setRawWeights((prev) => {
      const current = parseFloat(prev[sampahId] || '0') || 0;
      const next = Math.max(0, Math.round((current + delta) * 100) / 100);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[sampahId];
        return copy;
      }
      return { ...prev, [sampahId]: String(next) };
    });
  };

  // Handle Input Manual String (memungkinkan ketik "0.", "1.25", dll)
  const handleManualWeightInput = (sampahId: string, val: string) => {
    // Hanya izinkan angka dan titik desimal tunggal
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setRawWeights((prev) => {
        if (val === '') {
          const copy = { ...prev };
          delete copy[sampahId];
          return copy;
        }
        return { ...prev, [sampahId]: val };
      });
    }
  };

  // Kalkulasi Total Berat & Nilai Rupiah Secara Real-Time
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
      const rawVal = rawWeights[item.id];
      const qty = parseFloat(rawVal || '0') || 0;
      if (qty > 0) {
        const sub = Math.round(qty * Number(item.hargaSatuan));
        berat += qty;
        harga += sub;
        count++;
        list.push({
          sampah: item,
          kuantitas: Math.round(qty * 100) / 100,
          subtotal: sub,
        });
      }
    });

    return {
      totalBerat: Math.round(berat * 100) / 100,
      totalHarga: harga,
      activeItemsCount: count,
      activeItemsList: list,
    };
  }, [katalog, rawWeights]);

  // Handle Reset / Ganti Nasabah
  const handleGantiNasabah = () => {
    setWarga(null);
    setRawWeights({});
    setSubmitError(null);
  };

  // Handle Submit Transaksi Penimbangan
  const handleSubmitTransaksi = async () => {
    setSubmitError(null);

    if (!warga) {
      setSubmitError('Pilih atau scan QR nasabah terlebih dahulu.');
      return;
    }

    if (activeItemsCount === 0 || totalBerat <= 0) {
      setSubmitError('Masukkan bobot timbangan minimal pada salah satu jenis sampah.');
      return;
    }

    setSubmitting(true);
    const clientOfflineId = crypto.randomUUID();

    try {
      if (navigator.onLine) {
        const res = await transaksiApi.create({
          userId: warga.id,
          statusPembayaran: metodePembayaran,
          clientOfflineId,
          items: activeItemsList.map((it) => ({
            sampahAnorganikId: it.sampah.id,
            kuantitas: it.kuantitas,
          })),
        });

        // Arahkan langsung ke halaman struk digital
        navigate(`/transaksi/${res.data.id}`);
      } else {
        // Simpan transaksi offline ke IndexedDB
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
          'Koneksi internet tidak tersedia. Transaksi berhasil disimpan di IndexedDB lokal dan akan otomatis tersinkronisasi saat online!'
        );
        navigate('/riwayat');
      }
    } catch (err: any) {
      console.error('Gagal create transaksi:', err);
      setSubmitError(
        err.response?.data?.message || 'Gagal menyimpan transaksi. Periksa kembali isian timbangan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`pt-2 px-4 space-y-4 ${warga && totalBerat > 0 ? 'pb-56' : 'pb-20'}`}>
      {/* ======================================================== */}
      {/* TAHAP 1: KETIKA WARGA BELUM DIPILIH / DI-SCAN           */}
      {/* ======================================================== */}
      {!warga ? (
        <div className="space-y-4">
          {/* Hero Scan Banner */}
          <div className="bg-gradient-to-br from-forest-950 via-forest-900 to-forest-800 rounded-3xl p-6 text-white text-center shadow-lg shadow-forest-900/20 space-y-4 relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto text-forest-200 border border-white/20 shadow-inner">
              <QrCode className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-white">
                Mulai Sesi Penimbangan
              </h2>
              <p className="text-xs text-forest-200/90 leading-relaxed max-w-xs mx-auto">
                Scan QR Code kartu nasabah warga atau pilih secara manual untuk memunculkan katalog sampah.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => {
                  setScannerInitialTab('scan');
                  setScannerOpen(true);
                }}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-forest-950 font-black text-xs rounded-2xl shadow-md flex items-center justify-center space-x-2 transition"
              >
                <QrCode className="w-4 h-4" />
                <span>Pindai Kamera QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScannerInitialTab('manual');
                  setScannerOpen(true);
                }}
                className="w-full py-3 px-4 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs rounded-2xl border border-white/20 backdrop-blur-md flex items-center justify-center space-x-2 transition"
              >
                <Search className="w-4 h-4" />
                <span>Cari Manual</span>
              </button>
            </div>
          </div>

          {/* Quick Citizen List from Current RW */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-forest-900" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                  Pilih Cepat Nasabah {user?.rw || 'RW 08'}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-gray-400">
                {recentWargaList.length} terdaftar
              </span>
            </div>

            {loadingRecentWarga ? (
              <div className="bg-white rounded-2xl p-6 text-center text-xs text-gray-400">
                Memuat daftar nasabah...
              </div>
            ) : recentWargaList.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 text-center border border-gray-100">
                <p className="text-xs font-bold text-gray-600">
                  Belum ada nasabah terdaftar di {user?.rw || 'RW ini'}.
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Arahkan warga untuk mendaftar akun warga baru di aplikasi.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentWargaList.map((nasabah) => (
                  <button
                    key={nasabah.id}
                    type="button"
                    onClick={() => setWarga(nasabah)}
                    className="w-full bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs hover:border-forest-300 hover:bg-forest-50/50 flex items-center justify-between transition group active:scale-[0.99] text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-900 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                        {nasabah.nama.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 group-hover:text-forest-900">
                          {nasabah.nama}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {nasabah.rw} {nasabah.rt ? `/ ${nasabah.rt}` : ''} • ID: {nasabah.kodeNasabah}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-forest-900">
                        Rp {Number(nasabah.saldoTabungan || 0).toLocaleString('id-ID')}
                      </p>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        Pilih &gt;
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* TAHAP 2: SETELAH SCAN WARGA -> MUNCUL KATALOG & BOBOT     */
        /* ======================================================== */
        <div className="space-y-4">
          {/* Card Nasabah Terpilih */}
          <div className="bg-white rounded-3xl p-4 border border-forest-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-forest-900 text-forest-100 font-black text-sm flex items-center justify-center shadow-sm">
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
                      {warga.kodeNasabah}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGantiNasabah}
                className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-forest-100 text-gray-600 hover:text-forest-900 flex items-center space-x-1 text-xs font-bold transition active:scale-95"
                title="Ganti Nasabah"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ganti</span>
              </button>
            </div>

            {/* Saldo Nasabah Bar */}
            <div className="bg-forest-50/80 rounded-2xl p-3 flex items-center justify-between border border-forest-100">
              <div>
                <p className="text-[10px] font-extrabold text-forest-800 tracking-wider uppercase">
                  Saldo Rekening Saat Ini
                </p>
                <p className="text-base font-black text-forest-950 mt-0.5">
                  Rp {Number(warga.saldoTabungan || 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center text-[10px] font-bold text-forest-800 bg-white px-2.5 py-1 rounded-full shadow-2xs border border-forest-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-500 mr-1.5 animate-pulse"></span>
                  Siap Input Timbangan
                </span>
              </div>
            </div>
          </div>

          {/* Section Header: Katalog Sampah & Input Bobot */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Scale className="w-4 h-4 text-forest-900" />
              <h3 className="font-extrabold text-sm text-gray-900">Katalog &amp; Input Bobot</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Desimal Otomatis ke Rp
            </span>
          </div>

          {/* Quick Search Katalog */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari jenis sampah (misal: botol, kardus, kaleng)..."
              value={katalogSearch}
              onChange={(e) => setKatalogSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-900 transition shadow-2xs"
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
            {kategoriList.map((kat) => (
              <button
                key={kat.id}
                type="button"
                onClick={() => setSelectedKategori(kat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  selectedKategori === kat.id
                    ? 'bg-forest-900 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                <span>{kat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedKategori === kat.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {kat.count}
                </span>
              </button>
            ))}
          </div>

          {/* List of Trash Items with Steppers & Real-Time Rupiah Conversion */}
          {loadingKatalog ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400">
              Memuat katalog sampah...
            </div>
          ) : filteredKatalog.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 space-y-1">
              <Package className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-700">Tidak ada item sampah yang cocok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredKatalog.map((item) => {
                const rawVal = rawWeights[item.id] || '';
                const currentQty = parseFloat(rawVal) || 0;
                const subtotal = Math.round(currentQty * Number(item.hargaSatuan));

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-3xl p-4 border transition-all ${
                      currentQty > 0
                        ? 'border-forest-600 ring-2 ring-forest-500/15 shadow-sm'
                        : 'border-gray-100 shadow-2xs'
                    }`}
                  >
                    {/* Header item: category tag + ID + Live Rupiah Subtotal */}
                    <div className="flex items-start justify-between mb-1.5 gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-800 flex-shrink-0">
                            {item.kategori}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-gray-400">
                            ID: {item.id}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs text-gray-900 mt-1 truncate">{item.nama}</h4>
                        <p className="text-[11px] text-gray-500 font-semibold">
                          Rp {Number(item.hargaSatuan).toLocaleString('id-ID')} / {item.satuan}
                        </p>
                      </div>

                      {/* Rupiah Conversion Box */}
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`text-sm font-black block transition-colors ${
                            currentQty > 0 ? 'text-forest-900' : 'text-gray-300'
                          }`}
                        >
                          Rp {subtotal.toLocaleString('id-ID')}
                        </span>
                        {currentQty > 0 && (
                          <span className="text-[10px] text-forest-700 font-semibold block mt-0.5">
                            {currentQty} {item.satuan} × Rp {Number(item.hargaSatuan).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stepper control bar with smooth decimal input (Responsive, Never Offside) */}
                    <div className="bg-gray-50 rounded-2xl p-2.5 mt-2 space-y-2 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-gray-700 pl-0.5">
                          <Scale className="w-3.5 h-3.5 text-forest-800" />
                          <span className="text-xs font-bold">Bobot:</span>
                        </div>

                        {/* Core Stepper: [-] [ Input ] [+] */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleWeightDelta(item.id, -0.5)}
                            disabled={currentQty <= 0}
                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs shadow-2xs active:scale-90 transition disabled:opacity-30 hover:bg-gray-100"
                            title="- 0.5 kg"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center bg-white px-2 py-1 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-forest-900 transition shadow-2xs">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={rawVal}
                              placeholder="0"
                              onChange={(e) => handleManualWeightInput(item.id, e.target.value)}
                              className="w-16 text-center text-xs font-black text-gray-900 focus:outline-none bg-transparent"
                            />
                            <span className="text-[10px] font-bold text-gray-400 ml-1">
                              {item.satuan}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleWeightDelta(item.id, 0.5)}
                            className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs shadow-2xs active:scale-90 transition hover:bg-gray-100"
                            title="+ 0.5 kg"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Quick Chips Row (Responsive wrap, never offside) */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-gray-200/60">
                        <span className="text-[10px] font-semibold text-gray-400 mr-0.5">Cepat:</span>
                        {[
                          { label: '+0.1', delta: 0.1 },
                          { label: '+0.5', delta: 0.5 },
                          { label: '+1', delta: 1 },
                          { label: '+5', delta: 5 },
                          { label: '+10', delta: 10 },
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={() => handleWeightDelta(item.id, btn.delta)}
                            className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-forest-400 hover:text-forest-900 text-[10px] font-bold shadow-2xs active:scale-95 transition"
                          >
                            {btn.label}
                          </button>
                        ))}
                        {currentQty > 0 && (
                          <button
                            type="button"
                            onClick={() => handleManualWeightInput(item.id, '')}
                            className="ml-auto text-[10px] font-bold text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded transition"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Eco Impact Banner */}
          <div className="bg-forest-50/70 border border-forest-100 rounded-3xl p-3.5 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-forest-200 text-forest-900 flex items-center justify-center flex-shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <p className="text-[11px] text-forest-800 leading-snug">
              <strong className="font-extrabold">Sirkular Sekeloa Aktif.</strong> Setoran sampah ini
              berkontribusi mengurangi emisi karbon lokal sebesar ~{(totalBerat * 0.9).toFixed(2)} kg CO2e.
            </p>
          </div>

          {/* Error alert if any */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start space-x-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Info Hint Saat Belum Ada Bobot (Menggantikan bar yang menghalangi) */}
          {totalBerat === 0 && (
            <div className="bg-forest-50/70 border border-forest-100 rounded-2xl p-3 text-center text-xs text-forest-800">
              <p className="font-semibold">
                👆 Masukkan bobot pada salah satu jenis sampah di atas untuk memunculkan tombol simpan dan ringkasan konversi Rupiah.
              </p>
            </div>
          )}

          {/* Fixed Bottom Summary & Payment Bar (Hanya Muncul Saat Ada Bobot > 0 Agar Tidak Menghalangi) */}
          {totalBerat > 0 && (
            <div className="fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 shadow-xl animate-in slide-in-from-bottom duration-200">
              <div className="max-w-md mx-auto space-y-2.5">
                {/* Top Line: Total Berat (Kg) & Total Rupiah */}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">Total Bobot: </span>
                    <span className="text-base font-black text-gray-900">{totalBerat} Kg</span>
                    <span className="text-[11px] text-gray-400 font-medium ml-1">
                      ({activeItemsCount} jenis sampah)
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
                    <span>Menyimpan &amp; Memproses...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan &amp; Cetak Struk Digital</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={scannerOpen}
        initialTab={scannerInitialTab}
        onClose={() => setScannerOpen(false)}
        defaultRw={user?.rw}
        onSelectWarga={(w) => {
          setWarga(w);
          setRawWeights({});
        }}
      />
    </div>
  );
};
