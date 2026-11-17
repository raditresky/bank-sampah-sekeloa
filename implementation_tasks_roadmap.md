# Implementation Tasks: Digitalisasi Bank Sampah Sekeloa (PWA)

Dokumen ini berisi urutan pengerjaan terstruktur untuk men-generate dan membangun proyek di **Antigravity IDE**.

---

## Phase 1: Inisialisasi Proyek & Database (MySQL + Prisma)
- [x] **Task 1.1: Setup Monorepo / Workspace**
  - Buat folder `backend/` (Node.js + Express + TypeScript).
  - Konfigurasi `.env` dan `.env.example` di backend (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_INVITE_CODE`, `PORT`).
- [x] **Task 1.2: Konfigurasi Prisma ORM & Skema MySQL**
  - Inisialisasi Prisma dengan provider `mysql`.
  - Salin skema tabel (`User`, `KasPos`, `SampahAnorganik`, `TransaksiSampah`, `DetailTransaksiSampah`) ke `prisma/schema.prisma`.
  - Generate Prisma Client (`npx prisma generate`).
- [x] **Task 1.3: Seeding Data Master Bank Sampah Bersinar (BSB)**
  - Buat `prisma/seed.ts` berisi:
    - Seluruh daftar kode & harga dasar flat dari **PDF Bank Sampah Bersinar** (Kategori `PLASTIK`: P05–P46, `KERTAS`: K01–K10, `LOGAM`: A03, L01, S01, S02, T01, `KACA`: B08–B11, `LAINNYA`: C01–C04, E01).
    - Data awal `KasPos` untuk RW 01 s.d. RW 15 Kelurahan Sekeloa (contoh: RW 08 - Unit Flamboyan 50).
    - 1 akun dummy `ADMIN_RW` dan 1 akun dummy `WARGA` untuk pengujian awal.
  - Script seed siap dieksekusi dengan `npm run prisma:seed` setelah MySQL aktif.

---

## Phase 2: Backend REST API (Express.js Layered Architecture)
- [x] **Task 2.1: Setup Struktur Folder & Core Config (`src/config`, `src/utils`, `src/middleware`)**
  - Buat `src/config/prisma.ts` (singleton PrismaClient) dan `src/config/env.ts`.
  - Buat `src/middleware/auth.middleware.ts` (`authenticate` JWT & `requireRole`).
  - Buat `src/middleware/error.middleware.ts` untuk standardisasi format response JSON error dan `src/middleware/validate.middleware.ts`.
- [x] **Task 2.2: Modul Autentikasi & Mitigasi Kode Pengurus**
  - `src/validations/auth.validation.ts`: Skema Zod untuk login & register.
  - `src/repositories/user.repository.ts`: Query find/create user & generate `kodeNasabah` unik (`BS-SKL-XXXXX`).
  - `src/services/auth.service.ts`: Validasi `ADMIN_INVITE_CODE` jika role adalah `ADMIN_RW` / `PETUGAS_BANK_SAMPAH`, hash password dengan `bcryptjs`, dan terbitkan JWT.
  - `src/controllers/auth.controller.ts`, `src/controllers/user.controller.ts`, `src/routes/auth.routes.ts`, dan `src/routes/user.routes.ts`.
- [x] **Task 2.3: Modul Master Data Katalog Sampah**
  - `src/repositories/sampah.repository.ts`: Query list sampah (filter kategori & search) dan update harga.
  - `src/services/sampah.service.ts` & `src/controllers/sampah.controller.ts`.
  - `src/routes/sampah.routes.ts`: `GET /sampah` (authenticated) dan `PATCH /sampah/:id/harga` (dilindungi `requireRole` Admin/Petugas).
- [x] **Task 2.4: Modul Transaksi Penimbangan & Dashboard Summary**
  - `src/validations/transaksi.validation.ts`: Validasi array `items` minimal 1 item dengan `kuantitas > 0`.
  - `src/repositories/transaksi.repository.ts`: Implementasi `prisma.$transaction` untuk simpan transaksi, cek idempotency `clientOfflineId`, update `saldoTabungan` user (jika `TABUNGAN`), atau potong `saldoKas` RW (jika `TUNAI`).
  - `src/services/transaksi.service.ts`: Hitung subtotal menggunakan harga terbaru dari database (*server-side price snapshot*).
  - `src/controllers/transaksi.controller.ts`, `src/routes/transaksi.routes.ts`, `src/services/dashboard.service.ts`, `src/controllers/dashboard.controller.ts`, & `src/routes/dashboard.routes.ts`.

---

## Phase 3: Frontend PWA Setup & Autentikasi (React + TypeScript)
- [x] **Task 3.1: Konfigurasi PWA, Tailwind & Routing**
  - Install `vite-plugin-pwa`, `react-router-dom`, `axios`, `lucide-react`, `html5-qrcode`, `qrcode.react`, `dexie`.
  - Konfigurasi `manifest.webmanifest` (nama aplikasi, ikon, warna tema hijau `#0B4F27`, mode `standalone`).
  - Buat layout mobile-centered (`max-w-md mx-auto min-h-screen bg-gray-50`) dengan Bottom Navigation Bar dinamis berdasarkan role (`Admin`: Beranda, Timbangan, Katalog, Riwayat | `Warga`: Beranda, Katalog, Riwayat).
- [x] **Task 3.2: Halaman Login & Registrasi (Dual Tab)**
  - Implementasi UI sesuai `register-login-ui.png` dengan tab **Petugas RW** dan **Warga / Nasabah**.
  - Tambahkan toggle mode *Masuk* / *Daftar Baru*. Pada mode *Daftar Baru* tab **Petugas RW**, munculkan input **Kode Akses Pengurus**.

---

## Phase 4: Fitur Utama Admin/Petugas & Warga
- [x] **Task 4.1: Halaman Beranda (Role-Adaptive Dashboard)**
  - **Tampilan Admin** (sesuai `beranda-ui.png`): Header info unit pos RW, tombol utama *Mulai Penimbangan*, 4 kartu KPI (*Setoran Hari Ini*, *Nilai Transaksi*, *Warga Menyetor*, *Saldo Kas Pos*), pintasan operasional (*Scan QR Warga*, *Katalog Realtime*), progress bar target RW, dan list *Setoran Terkini Hari Ini*.
  - **Tampilan Warga**: Kartu saldo tabungan aktif, total kg sampah terkumpul, kartu **QR Code ID Warga** (`qrcode.react`) agar siap di-scan petugas, dan ringkasan setoran terakhir.
- [x] **Task 4.2: Halaman Penimbangan & Scan QR (`Admin/Petugas Only`)**
  - Implementasi modal/halaman kamera scanner QR (`html5-qrcode`) + opsi pencarian manual nama warga.
  - Implementasi **Input Matriks Timbangan** (sesuai `timbangan-ui.png`): Filter tab kategori (`Semua`, `Plastik`, `Kertas`, `Logam`, `Kaca`, `Lainnya`), tombol stepper `-` / `+` / `+5` dan input angka manual berat/pcs, kalkulasi subtotal & total Rupiah *real-time* di bottom bar, serta toggle metode pembayaran (`Tunai Direct` vs `Tabungan Warga`).
- [x] **Task 4.3: Halaman Detail Transaksi / Struk Digital**
  - Implementasi struk digital (sesuai `detail-transaksi-ui.png`) menampilkan nomor transaksi, waktu timbang, identitas nasabah & petugas, rincian item beserta harga snapshot, total berat, total diterima, dan badge status (`Masuk Tabungan` / `Tunai Direct`).
- [x] **Task 4.4: Halaman Katalog Sampah & Riwayat Transaksi**
  - **Katalog**: Pencarian & filter kategori. Untuk Admin/Petugas tersedia tombol/modal *Edit Harga*; untuk Warga hanya *view-only*.
  - **Riwayat**: Filter status pembayaran dan klik item untuk membuka halaman Detail Struk Digital.

---

## Phase 5: Mode Offline PWA & Pengujian Akhir
- [x] **Task 5.1: Implementasi Offline Storage & Auto-Sync (`Dexie.js`)**
  - Cache data katalog sampah dan daftar warga RW ke IndexedDB setiap kali berhasil fetch dari API.
  - Simpan transaksi ke antrean lokal `pending_transactions` saat offline, tampilkan indikator badge *"Menunggu Sinkronisasi"* di Beranda, dan lakukan auto-sync otomatis saat koneksi kembali online.
- [ ] **Task 5.2: Verifikasi End-to-End**
  - Uji alur registrasi Warga vs registrasi Admin (uji penolakan jika kode pengurus salah).
  - Uji alur lengkap: Warga buka QR Code -> Admin scan QR -> Input multi-item sampah -> Simpan Tabungan -> Saldo Warga otomatis bertambah di halaman Warga.
- [ ] **Task 5.2: Verifikasi End-to-End**
  - Uji alur registrasi Warga vs registrasi Admin (uji penolakan jika kode pengurus salah).
  - Uji alur lengkap: Warga buka QR Code -> Admin scan QR -> Input multi-item sampah -> Simpan Tabungan -> Saldo Warga otomatis bertambah di halaman Warga.