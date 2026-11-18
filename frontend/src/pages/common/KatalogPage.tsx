import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sampahApi, CreateSampahPayload, UpdateSampahPayload } from '../../api/sampah.api';
import { SampahItem, KategoriSampah } from '../../types';
import {
  Search,
  Edit3,
  Trash2,
  Plus,
  X,
  Package,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { db } from '../../db/offlineDb';

export const KatalogPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [items, setItems] = useState<SampahItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [kategori, setKategori] = useState<string>('SEMUA');

  // Modal Tambah Sampah State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addForm, setAddForm] = useState<CreateSampahPayload>({
    id: '',
    nama: '',
    kategori: 'PLASTIK',
    satuan: 'Kg',
    hargaSatuan: 0,
    deskripsi: '',
  });
  const [addPassword, setAddPassword] = useState<string>('');
  const [showAddPassword, setShowAddPassword] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState<boolean>(false);

  // Modal Edit Sampah State
  const [editingItem, setEditingItem] = useState<SampahItem | null>(null);
  const [editForm, setEditForm] = useState<UpdateSampahPayload>({
    nama: '',
    kategori: 'PLASTIK',
    satuan: 'Kg',
    hargaSatuan: 0,
    deskripsi: '',
    isActive: true,
  });
  const [editPassword, setEditPassword] = useState<string>('');
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  // Modal Hapus Sampah State
  const [deletingItem, setDeletingItem] = useState<SampahItem | null>(null);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [showDeletePassword, setShowDeletePassword] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Status Notifikasi
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const loadKatalog = async () => {
    try {
      if (navigator.onLine) {
        const res = await sampahApi.getKatalog();
        setItems(res.data);
        await db.cachedSampah.clear();
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      SEMUA: items.length,
      PLASTIK: 0,
      KERTAS: 0,
      LOGAM: 0,
      KACA: 0,
      LAINNYA: 0,
    };
    items.forEach((it) => {
      if (counts[it.kategori] !== undefined) {
        counts[it.kategori] += 1;
      }
    });
    return counts;
  }, [items]);

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

  // Handle Buka Modal Tambah
  const handleOpenAddModal = () => {
    setAddForm({
      id: '',
      nama: '',
      kategori: (kategori !== 'SEMUA' ? kategori : 'PLASTIK') as KategoriSampah,
      satuan: 'Kg',
      hargaSatuan: 0,
      deskripsi: '',
    });
    setAddPassword('');
    setAddError(null);
    setIsAddModalOpen(true);
  };

  // Handle Simpan Sampah Baru
  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.id.trim() || !addForm.nama.trim()) {
      setAddError('Kode sampah dan Nama sampah wajib diisi.');
      return;
    }

    if (Number(addForm.hargaSatuan) <= 0) {
      setAddError('Harga satuan harus lebih besar dari Rp 0.');
      return;
    }

    if (!addPassword) {
      setAddError('Password otorisasi katalog wajib diisi.');
      return;
    }

    if (addPassword !== 'sekeloasampiahjuara123!') {
      setAddError('Password otorisasi katalog salah! Perubahan ditolak.');
      return;
    }

    setAdding(true);
    setAddError(null);

    try {
      const res = await sampahApi.create({
        ...addForm,
        id: addForm.id.trim().toUpperCase(),
        hargaSatuan: Number(addForm.hargaSatuan),
        adminPassword: addPassword,
      });

      await db.cachedSampah.put(res.data);
      setIsAddModalOpen(false);
      setKategori('SEMUA');
      setSearch('');
      await loadKatalog();
      showFeedback(`Berhasil menambahkan jenis sampah '${res.data.nama}' (ID: ${res.data.id})! Ditampilkan di Semua Kategori.`);
    } catch (err: any) {
      console.error(err);
      setAddError(
        err.response?.data?.message || 'Gagal menambahkan jenis sampah ke katalog.'
      );
    } finally {
      setAdding(false);
    }
  };

  // Handle Buka Modal Edit
  const handleEditClick = (item: SampahItem) => {
    setEditingItem(item);
    setEditForm({
      nama: item.nama,
      kategori: item.kategori,
      satuan: item.satuan,
      hargaSatuan: Number(item.hargaSatuan),
      deskripsi: item.deskripsi || '',
      isActive: item.isActive,
    });
    setEditPassword('');
    setEditError(null);
  };

  // Handle Simpan Perubahan Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editForm.nama?.trim()) {
      setEditError('Nama sampah wajib diisi.');
      return;
    }

    if (Number(editForm.hargaSatuan) <= 0) {
      setEditError('Harga satuan harus lebih besar dari 0.');
      return;
    }

    if (!editPassword) {
      setEditError('Password otorisasi katalog wajib diisi.');
      return;
    }

    if (editPassword !== 'sekeloasampiahjuara123!') {
      setEditError('Password otorisasi katalog salah! Perubahan ditolak.');
      return;
    }

    setUpdating(true);
    setEditError(null);

    try {
      const res = await sampahApi.update(editingItem.id, {
        ...editForm,
        hargaSatuan: Number(editForm.hargaSatuan),
        adminPassword: editPassword,
      });

      await db.cachedSampah.put(res.data);
      setEditingItem(null);
      await loadKatalog();
      showFeedback(`Katalog '${res.data.nama}' berhasil diperbarui!`);
    } catch (err: any) {
      console.error(err);
      setEditError(err.response?.data?.message || 'Gagal memperbarui item sampah.');
    } finally {
      setUpdating(false);
    }
  };

  // Handle Buka Modal Hapus
  const handleOpenDeleteModal = (item: SampahItem) => {
    setDeletingItem(item);
    setDeletePassword('');
    setDeleteError(null);
  };

  // Handle Konfirmasi Hapus dengan Password
  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingItem) return;

    if (!deletePassword) {
      setDeleteError('Password otorisasi katalog wajib diisi.');
      return;
    }

    if (deletePassword !== 'sekeloasampiahjuara123!') {
      setDeleteError('Password otorisasi katalog salah! Penghapusan ditolak.');
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await sampahApi.delete(deletingItem.id, deletePassword);
      await db.cachedSampah.delete(deletingItem.id);
      const itemName = deletingItem.nama;
      setDeletingItem(null);
      await loadKatalog();
      showFeedback(`Item '${itemName}' telah dihapus dari katalog.`);
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.response?.data?.message || 'Gagal menghapus item sampah.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-3.5">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto bg-forest-900 text-white p-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-forest-200 flex-shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Title & Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 tracking-tight">
            Katalog Sampah BSB
          </h2>
          <p className="text-xs text-gray-500">Standar resmi Bank Sampah Bersinar ({items.length} jenis)</p>
        </div>
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            onClick={loadKatalog}
            className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-forest-900 hover:bg-forest-50 transition"
            title="Segarkan data katalog"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-forest-900 hover:bg-forest-950 text-white text-xs font-bold shadow-md transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          )}
        </div>
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
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              kategori === kat
                ? 'bg-forest-900 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
            }`}
          >
            <span>{kat === 'SEMUA' ? 'Semua' : kat}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                kategori === kat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {categoryCounts[kat] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Catalog Items Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400">
          Memuat katalog harga...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 space-y-2">
          <Package className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-xs font-bold text-gray-700">Tidak ada jenis sampah yang cocok</p>
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 bg-forest-50 text-forest-900 border border-forest-200 rounded-xl text-xs font-bold hover:bg-forest-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Jenis Sampah Ini</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs hover:border-forest-200 transition space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-800 flex-shrink-0">
                      {item.kategori}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-gray-400">
                      ID: {item.id}
                    </span>
                    {!item.isActive && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-xs text-gray-900 mt-1 break-words">{item.nama}</h4>
                  {item.deskripsi && (
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed break-words">
                      {item.deskripsi}
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-black text-forest-900 block whitespace-nowrap">
                    Rp {Number(item.hargaSatuan).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">per {item.satuan}</span>
                </div>
              </div>

              {/* Admin Actions: Edit & Hapus */}
              {isAdmin && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleOpenDeleteModal(item)}
                    className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold border border-transparent hover:border-red-200 transition"
                    title="Hapus sampah"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>

                  <button
                    onClick={() => handleEditClick(item)}
                    className="flex items-center space-x-1 px-3.5 py-1 bg-gray-50 hover:bg-forest-50 text-gray-700 hover:text-forest-900 rounded-xl text-xs font-bold border border-gray-200 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Katalog</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Tambah Sampah Baru (Admin Only) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">Tambah Jenis Sampah</h3>
                <p className="text-xs text-gray-500">Katalog Bank Sampah RW</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-start space-x-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kode Sampah (BSB)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: P06"
                    value={addForm.id}
                    onChange={(e) =>
                      setAddForm({ ...addForm, id: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-forest-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Satuan</label>
                  <select
                    value={addForm.satuan}
                    onChange={(e) => setAddForm({ ...addForm, satuan: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-forest-900"
                  >
                    <option value="Kg">Kg (Kilogram)</option>
                    <option value="Pcs">Pcs (Satuan)</option>
                    <option value="Liter">Liter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Jenis Sampah
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kardus Arsip Campur"
                  value={addForm.nama}
                  onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-forest-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={addForm.kategori}
                    onChange={(e) =>
                      setAddForm({ ...addForm, kategori: e.target.value as KategoriSampah })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-forest-900"
                  >
                    <option value="PLASTIK">PLASTIK</option>
                    <option value="KERTAS">KERTAS</option>
                    <option value="LOGAM">LOGAM</option>
                    <option value="KACA">KACA</option>
                    <option value="LAINNYA">LAINNYA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <div className="relative rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-forest-900 overflow-hidden bg-gray-50">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-xs text-gray-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="3500"
                      value={addForm.hargaSatuan || ''}
                      onChange={(e) =>
                        setAddForm({ ...addForm, hargaSatuan: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full pl-8 pr-3 py-2 text-xs font-black text-gray-900 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Deskripsi / Syarat Pilah (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Bersih, kering, kardus sudah dipipihkan..."
                  value={addForm.deskripsi || ''}
                  onChange={(e) => setAddForm({ ...addForm, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-900"
                />
              </div>

              {/* Password Otorisasi Tambah Katalog */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-900 flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kata Sandi Otorisasi Admin</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-700">Wajib Otorisasi</span>
                </div>
                <div className="relative rounded-xl border border-amber-300 bg-white focus-within:ring-2 focus-within:ring-amber-500 overflow-hidden">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password otorisasi"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 text-xs font-mono font-bold text-gray-900 focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-700">
                  Password diperlukan untuk mencegah perubahan katalog yang tidak sah.
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 py-2.5 bg-forest-900 hover:bg-forest-950 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {adding ? 'Menyimpan...' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Sampah (Admin Only) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">Edit Data Sampah</h3>
                <p className="text-xs text-gray-500 font-mono">Kode BSB: {editingItem.id}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-start space-x-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Jenis Sampah
                </label>
                <input
                  type="text"
                  required
                  value={editForm.nama || ''}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-forest-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                  <select
                    value={editForm.kategori}
                    onChange={(e) =>
                      setEditForm({ ...editForm, kategori: e.target.value as KategoriSampah })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-forest-900"
                  >
                    <option value="PLASTIK">PLASTIK</option>
                    <option value="KERTAS">KERTAS</option>
                    <option value="LOGAM">LOGAM</option>
                    <option value="KACA">KACA</option>
                    <option value="LAINNYA">LAINNYA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Satuan</label>
                  <select
                    value={editForm.satuan}
                    onChange={(e) => setEditForm({ ...editForm, satuan: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-forest-900"
                  >
                    <option value="Kg">Kg (Kilogram)</option>
                    <option value="Pcs">Pcs (Satuan)</option>
                    <option value="Liter">Liter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Harga Satuan (Rp / {editForm.satuan || 'Kg'})
                </label>
                <div className="relative rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-forest-900 overflow-hidden bg-gray-50">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-gray-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.hargaSatuan || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, hargaSatuan: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-9 pr-4 py-2.5 text-xs font-black text-gray-900 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={editForm.deskripsi || ''}
                  onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-900"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive ?? true}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="rounded text-forest-900 focus:ring-forest-900 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-gray-700">
                    Aktifkan item ini di katalog
                  </span>
                </label>
              </div>

              {/* Password Otorisasi Edit Katalog */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-900 flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kata Sandi Otorisasi Admin</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-700">Wajib Otorisasi</span>
                </div>
                <div className="relative rounded-xl border border-amber-300 bg-white focus-within:ring-2 focus-within:ring-amber-500 overflow-hidden">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password otorisasi"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 text-xs font-mono font-bold text-gray-900 focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-700">
                  Verifikasi kata sandi pengurus diperlukan untuk menyimpan perubahan.
                </p>
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
                  {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Hapus Sampah dengan Verifikasi Password */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">Hapus Item Sampah</h3>
                  <p className="text-xs text-gray-500 font-mono">Kode BSB: {deletingItem.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingItem(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Anda akan menghapus <strong className="text-gray-900 font-bold">{deletingItem.nama}</strong> dari katalog resmi. Masukkan kata sandi otorisasi admin untuk melanjutkan.
            </p>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-start space-x-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmDelete} className="space-y-3">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 space-y-1">
                <label className="text-xs font-extrabold text-amber-900 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kata Sandi Otorisasi Admin</span>
                </label>
                <div className="relative rounded-xl border border-amber-300 bg-white focus-within:ring-2 focus-within:ring-amber-500 overflow-hidden">
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password otorisasi"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 text-xs font-mono font-bold text-gray-900 focus:outline-none bg-transparent"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
