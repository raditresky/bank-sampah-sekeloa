import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Search, Camera, AlertCircle, CheckCircle2, UserCheck, ArrowRight } from 'lucide-react';
import { userApi } from '../../api/user.api';
import { User } from '../../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWarga: (warga: User) => void;
  defaultRw?: string;
  initialTab?: 'scan' | 'manual';
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectWarga,
  defaultRw,
  initialTab = 'scan',
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScannerRunningRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setCameraError(null);
      return;
    }

    if (activeTab === 'scan') {
      // Delay camera start slightly to ensure DOM element #reader-camera is painted
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
      fetchNasabahList(searchQuery);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const el = document.getElementById('reader-camera');
      if (!el) {
        return;
      }

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setCameraError('Kamera tidak terdeteksi pada perangkat ini. Beralih ke pencarian manual.');
        setActiveTab('manual');
        return;
      }

      const qrCodeElementId = 'reader-camera';
      const html5QrCode = new Html5Qrcode(qrCodeElementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        async (decodedText) => {
          setScannedResult(decodedText);
          await handleQrCodeFound(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
      isScannerRunningRef.current = true;
    } catch (err: any) {
      console.warn('Camera start note:', err);
      setCameraError('Kamera tidak dapat diakses (izin kamera belum diberikan atau sedang digunakan aplikasi lain). Silakan gunakan pencarian nasabah manual.');
      setActiveTab('manual');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScannerRunningRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // ignore
      }
      isScannerRunningRef.current = false;
      scannerRef.current = null;
    }
  };

  const handleQrCodeFound = async (rawCode: string) => {
    const code = rawCode.trim();
    await stopCamera();
    setLoading(true);
    try {
      const res = await userApi.getByKodeNasabah(code);
      if (res.data) {
        onSelectWarga(res.data);
        onClose();
      } else {
        setCameraError(`Nasabah dengan QR / Kode '${code}' tidak ditemukan.`);
        setActiveTab('manual');
      }
    } catch {
      setCameraError(`Gagal menemukan data nasabah untuk kode: ${code}`);
      setActiveTab('manual');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleQrCodeFound(manualCode);
  };

  const fetchNasabahList = async (query = '') => {
    setLoading(true);
    try {
      const res = await userApi.searchNasabah(query, defaultRw);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchNasabahList(val);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">Pilih Nasabah Setoran</h3>
            <p className="text-xs text-gray-500">Scan QR Code atau cari secara manual</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-100 p-2 bg-gray-50/70">
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'scan'
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Kamera QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'manual'
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Cari Manual</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'scan' ? (
            <div className="flex flex-col items-center">
              <div
                id="reader-camera"
                className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-950 relative border-2 border-dashed border-forest-500 flex items-center justify-center"
              >
                {cameraError && (
                  <div className="p-4 text-center text-white">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-300 leading-relaxed">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="mt-3 px-3 py-1.5 bg-white text-gray-900 rounded-xl text-xs font-bold shadow"
                    >
                      Buka Pencarian Manual
                    </button>
                  </div>
                )}
              </div>

              {scannedResult && (
                <div className="mt-3 flex items-center space-x-2 text-forest-700 bg-forest-50 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terdeteksi: {scannedResult}</span>
                </div>
              )}

              <p className="text-[11px] text-gray-400 text-center mt-3">
                Arahkan kamera ke Kartu QR Code nasabah untuk mendeteksi ID secara instan
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Quick Input Kode Nasabah */}
              <form onSubmit={handleManualCodeSubmit} className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">
                  Ketik Langsung Kode / ID / No HP:
                </label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    placeholder="Misal: BS-SKL-08034"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-forest-900 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!manualCode.trim() || loading}
                    className="px-3.5 py-2 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-bold transition disabled:opacity-40"
                  >
                    Pilih
                  </button>
                </div>
              </form>

              <div className="border-t border-gray-100 pt-2">
                {/* Search Box */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter nama, no HP, atau RT..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-900 focus:bg-white transition"
                  />
                </div>

                {/* List Nasabah */}
                {loading ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    Mencari data nasabah...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs font-semibold text-gray-400">
                      Tidak ada nasabah terdaftar di {defaultRw || 'sistem'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {searchResults.map((nasabah) => (
                      <button
                        key={nasabah.id}
                        type="button"
                        onClick={() => {
                          onSelectWarga(nasabah);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-2xl border border-gray-100 hover:border-forest-300 hover:bg-forest-50/60 flex items-center justify-between transition group active:scale-[0.99]"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-900 font-extrabold text-[11px] flex items-center justify-center flex-shrink-0">
                            {nasabah.nama.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 group-hover:text-forest-900">
                              {nasabah.nama}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {nasabah.rw} {nasabah.rt ? `/ ${nasabah.rt}` : ''} • {nasabah.nomorHp}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 block">
                            {nasabah.kodeNasabah}
                          </span>
                          <span className="text-[9px] text-forest-700 font-bold mt-0.5 block">
                            Pilih &gt;
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
