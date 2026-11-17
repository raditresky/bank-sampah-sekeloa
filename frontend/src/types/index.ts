export type UserRole = 'WARGA' | 'ADMIN_RW' | 'PETUGAS_BANK_SAMPAH';

export type KategoriSampah = 'PLASTIK' | 'KERTAS' | 'LOGAM' | 'KACA' | 'LAINNYA';

export type StatusPembayaran = 'TUNAI' | 'TABUNGAN';

export interface User {
  id: string;
  kodeNasabah: string;
  nama: string;
  nomorHp: string;
  rw: string;
  rt?: string | null;
  unitBankSampah?: string | null;
  role: UserRole;
  saldoTabungan: number | string;
  createdAt?: string;
}

export interface SampahItem {
  id: string;
  kategori: KategoriSampah;
  nama: string;
  satuan: string;
  deskripsi?: string | null;
  gambar?: string | null;
  hargaSatuan: number | string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DetailTransaksiItem {
  id: string;
  transaksiId: string;
  sampahAnorganikId: string;
  kuantitas: number | string;
  hargaSatuan: number | string;
  subtotal: number | string;
  createdAt?: string;
  sampah?: SampahItem;
}

export interface Transaksi {
  id: string;
  nomorTransaksi: string;
  userId: string;
  petugasId: string;
  rwPos: string;
  totalBerat: number | string;
  totalHarga: number | string;
  statusPembayaran: StatusPembayaran;
  clientOfflineId?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: DetailTransaksiItem[];
  warga?: {
    id: string;
    nama: string;
    kodeNasabah: string;
    nomorHp: string;
    rw: string;
    rt?: string | null;
    saldoTabungan?: number | string;
  };
  petugas?: {
    id: string;
    nama: string;
    role: UserRole;
  };
}

export interface DashboardAdminSummary {
  role: 'ADMIN_OR_PETUGAS';
  pos: {
    rw: string;
    namaUnit: string;
    saldoKas: number;
    targetKg: number;
    progressPersen: number;
  };
  statistikHariIni: {
    totalKg: number;
    nilaiTransaksi: number;
    wargaMenyetor: number;
  };
  transaksiTerkini: Transaksi[];
}

export interface DashboardWargaSummary {
  role: 'WARGA';
  nasabah: {
    id: string;
    nama: string;
    kodeNasabah: string;
    nomorHp: string;
    rw: string;
    rt?: string | null;
    saldoTabungan: number;
  };
  statistik: {
    totalBeratDisetor: number;
    totalNilaiDisetor: number;
    totalFrekuensiSetoran: number;
  };
  transaksiTerakhir?: Transaksi | null;
}

