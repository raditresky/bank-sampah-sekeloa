import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sampahApi } from '../../api/sampah.api';
import { SampahItem, KategoriSampah } from '../../types';
import { Search, Edit3, Check, X, Package, AlertCircle } from 'lucide-react';
import { db } from '../../db/offlineDb';

export const KatalogPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [items, setItems] = useState<SampahItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [kategori, setKategori] = useState<string>('SEMUA');

  // Edit Modal State (Admin Only)
  const [editingItem, setEditingItem] = useState<SampahItem | null>(null);
  const [newHarga, setNewHarga] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const loadKatalog = async () => {
    try {
      if (navigator.onLine) {
        const res = await sampahApi.getKatalog();
        setItems(res.data);
        await db.cachedSampah.bulkPut(res.data);
      } else {
        const cached = await db.cachedSampah.toArray();
        setItems(cached);
      }
    } catch {
      const cached = await db.cachedSampah.toArray();
      if (cached.length > 0) setItems(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKatalog();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesKategori = kategori === 'SEMUA' || item.kategori === kategori;
      const matchesSearch =
        item.nama.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(search.toLowerCase()));
      return matchesKategori && matchesSearch;
    });
  }, [items, kategori, search]);

  const handleEditClick = (item: SampahItem) => {
    setEditingItem(item);
    setNewHarga(String(item.hargaSatuan));
    setUpdateError(null);
  };

  const handleSaveHarga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const harga = parseFloat(newHarga);
    if (isNaN(harga) || harga <= 0) {
      setUpdateError('Harga satuan harus lebih besar dari 0');
      return;
    }

    setUpdating(true);
    setUpdateError(null);

    try {
      await sampahApi.updateHarga(editingItem.id, harga);
      setEditingItem(null);
      await loadKatalog();
    } catch (err: any) {
      console.error(err);
      setUpdateError(err.response?.data?.message || 'Gagal memperbarui harga.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-3.5">
      {/* Title & Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 tracking-tight">
            Katalog Sampah BSB
          </h2>
          <p className="text-xs text-gray-500">Standar resmi Bank Sampah Bersinar</p>
        </div>
        {isAdmin && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-forest-200">
            Admin Edit Mode
          </span>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari jenis sampah, kode (P05, K01, A03)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-900 transition shadow-2xs"
        />
      </div>

      {/* Category Pills */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
        {['SEMUA', 'PLASTIK', 'KERTAS', 'LOGAM', 'KACA', 'LAINNYA'].map((kat) => (
          <button
            key={kat}
            onClick={() => setKategori(kat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              kategori === kat
                ? 'bg-forest-900 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
            }`}
          >
            {kat === 'SEMUA' ? 'Semua' : kat}
          </button>
        ))}
      </div>

      {/* Catalog Items Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400">
          Memuat katalog harga...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-700">Tidak ada jenis sampah yang cocok</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs hover:border-forest-200 transition space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                      {item.kategori}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-gray-400">
                      {item.id}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-gray-900 mt-1">{item.nama}</h4>
                  {item.deskripsi && (
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      {item.deskripsi}
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0 ml-3">
                  <span className="text-xs font-black text-forest-900 block">
                    Rp {Number(item.hargaSatuan).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">per {item.satuan}</span>
                </div>
              </div>

              {/* Admin Edit Button */}
              {isAdmin && (
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-50 hover:bg-forest-50 text-gray-700 hover:text-forest-900 rounded-xl text-[11px] font-bold border border-gray-200 transition"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Ubah Harga</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Harga Modal (Admin Only) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">Ubah Harga Sampah</h3>
                <p className="text-xs text-gray-500 font-mono">Kode BSB: {editingItem.id}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-900">{editingItem.nama}</p>
              <p className="text-[11px] text-gray-500">Satuan: {editingItem.satuan}</p>
            </div>

            {updateError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-start space-x-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{updateError}</span>
              </div>
            )}

            <form onSubmit={handleSaveHarga} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Harga Satuan Baru (Rp / {editingItem.satuan})
                </label>
                <div className="relative rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-forest-900 overflow-hidden">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-gray-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newHarga}
                    onChange={(e) => setNewHarga(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs font-black text-gray-900 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Harga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

