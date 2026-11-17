# Architectural & System Design Document: Digitalisasi Bank Sampah Sekeloa (PWA Edition)

## 1. Executive Summary & Core Objective
Aplikasi **Digitalisasi Bank Sampah Sekeloa** adalah Progressive Web App (PWA) yang dirancang untuk mendigitalisasi operasional penimbangan, pencatatan transaksi setoran sampah anorganik, katalog harga, dan buku tabungan nasabah di tingkat RW se-Kelurahan Sekeloa.

Migrasi dari aplikasi mobile native ke arsitektur **Web PWA (React + TypeScript)** dan **REST API (Express.js + Prisma + MySQL)** dilakukan untuk mempermudah distribusi tanpa instalasi toko aplikasi, mempermudah pemeliharaan kode, serta tetap mendukung akses kamera (pemindaian QR Code) dan penyimpanan offline (Service Worker + IndexedDB) saat kondisi sinyal di pos RW tidak stabil.

---

## 2. Tech Stack & System Architecture

### 2.1 Frontend (Progressive Web App)
* **Framework**: React 18+ dengan TypeScript (Vite sebagai build tool).
* **Styling & UI**: Tailwind CSS (mengadopsi desain mobile-first hijau-putih sesuai mockup UI).
* **PWA & Offline Engine**: `vite-plugin-pwa` (Workbox Service Worker untuk asset caching) + `Dexie.js` (IndexedDB wrapper untuk antrean transaksi offline saat pos RW kehilangan koneksi internet).
* **State & Data Fetching**: TanStack Query (React Query) / Zustand.
* **QR Code Scanner & Generator**:
  * `html5-qrcode` (akses kamera browser untuk memindai QR Code ID Warga).
  * `qrcode.react` (menampilkan kartu QR Code ID unik pada halaman akun Warga).

### 2.2 Backend (Layered REST API)
* **Runtime & Framework**: Node.js + Express.js dengan TypeScript.
* **ORM & Database**: Prisma ORM + MySQL 8.0+.
* **Authentication & Security**: `jsonwebtoken` (JWT Bearer Token), `bcryptjs` (password hashing), `cors`, `helmet`.
* **Request Validation**: `zod` untuk validasi payload body, params, dan query.

### 2.3 Struktur Direktori Backend (`backend/src`)
```text
backend/
├── prisma/
│   ├── schema.prisma        # Definisi model MySQL & relasi
│   └── seed.ts              # Seeder master data harga BSB & kas pos RW
└── src/
    ├── config/              # Konfigurasi env, Prisma client, logger
    ├── controllers/         # Handler HTTP request & response
    ├── middleware/          # Auth JWT verifier, Role Guard (RBAC), Error handler
    ├── repositories/        # Query database via Prisma ORM
    ├── routes/              # Definisi routing Express (/api/v1/...)
    ├── services/            # Business logic (kalkulasi, snapshot harga, update kas/saldo)
    ├── utils/               # Helper format mata uang, generator nomor transaksi, JWT
    ├── validations/         # Skema validasi Zod
    └── app.ts               # Entry point aplikasi Express
```

---

## 3. Role-Based Access Control (RBAC) & Mitigasi Registrasi

### 3.1 Pembagian Hak Akses (Admin/Petugas vs Warga)
Sistem memiliki 3 role pada tabel `users`: `ADMIN_RW`, `PETUGAS_BANK_SAMPAH`, dan `WARGA`.

| Fitur / Modul | Admin RW & Petugas (`ADMIN_RW` / `PETUGAS_BANK_SAMPAH`) | Warga / Nasabah (`WARGA`) |
| :--- | :--- | :--- |
| **Registrasi Mandiri** | Bisa daftar mandiri **wajib** memasukkan `kode_akses_pengurus` yang valid. | Bisa daftar mandiri tanpa kode akses khusus. |
| **Beranda (Dashboard)** | Melihat statistik pos RW hari ini (Total Kg, Nilai Transaksi, Warga Menyetor, Saldo Kas Pos, Target RW, & Setoran Terkini RW). | Melihat ringkasan pribadi (Total Saldo Tabungan, Total Kg Sampah disetor, & Kartu QR Code ID Warga). |
| **Penimbangan (Input Setoran)** | **Akses Penuh**: Scan QR Warga / cari nama, input matriks berat sampah multi-item, pilih Tunai/Tabungan, simpan transaksi. | **Dihilangkan** (Menu/tab tidak ditampilkan & endpoint diblokir middleware). |
| **Katalog Harga Sampah** | **Read & Update**: Melihat daftar harga & mengubah harga per kg saat terjadi fluktuasi bulanan. | **Read-Only**: Hanya melihat katalog jenis sampah & harga per kg berlaku. |
| **Riwayat & Detail Struk** | Melihat seluruh riwayat transaksi di pos RW tersebut & mencetak/melihat struk digital. | Hanya melihat riwayat transaksi & struk digital milik dirinya sendiri. |

### 3.2 Mitigasi Keamanan Pendaftaran Admin
Untuk mencegah warga menyamar mendaftar sebagai `ADMIN_RW` atau `PETUGAS_BANK_SAMPAH`:
1. Pada form registrasi tab **Petugas RW**, frontend menampilkan input **Kode Akses Pengurus**.
2. Backend menyimpan `ADMIN_INVITE_CODE` di environment variable (`.env`) dan memvalidasinya di `auth.service.ts`.
3. Jika role yang diajukan bukan `WARGA` dan kode tidak cocok, server langsung mengembalikan status `403 Forbidden`.

---

## 4. Database Schema (Prisma Schema untuk MySQL)

Perbaikan dari skema lama:
* Menghapus penyimpanan `password` plain text dan menggantinya dengan `password_hash`.
* Menambahkan kolom `saldo_tabungan` pada `users` agar saldo warga dapat diakses cepat tanpa agregasi berulang.
* Menambahkan tabel `kas_pos` untuk melacak kas tunai tiap pos RW (sesuai card *Saldo Kas Pos* di UI Beranda).
* Menambahkan `nomor_transaksi` (contoh: `TRX-20250520-0842`) dan `status_pembayaran` (`TUNAI` / `TABUNGAN`) pada `transaksi_sampah_anorganik`.
* Menambahkan kolom `kode_sampah` (contoh: `P05`, `K01`, `L01`, `B08`, `C01`) sesuai katalog resmi **Bank Sampah Bersinar (BSB)**.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  WARGA
  ADMIN_RW
  PETUGAS_BANK_SAMPAH
}

enum KategoriSampah {
  PLASTIK
  KERTAS
  LOGAM
  KACA
  LAINNYA
}

enum StatusPembayaran {
  TUNAI
  TABUNGAN
}

model User {
  id               String   @id @default(uuid())
  kodeNasabah      String   @unique @map("kode_nasabah") // e.g. BS-SKL-08034 (Payload QR Code)
  nama             String   @db.VarChar(255)
  nomorHp          String   @unique @map("nomor_hp") @db.VarChar(20)
  passwordHash     String   @map("password_hash") @db.VarChar(255)
  rw               String   @db.VarChar(10) // e.g. "RW 08"
  rt               String?  @db.VarChar(10) // e.g. "RT 03"
  unitBankSampah   String?  @map("unit_bank_sampah") @db.VarChar(255)
  role             UserRole @default(WARGA)
  saldoTabungan    Decimal  @default(0) @map("saldo_tabungan") @db.Decimal(12, 2)
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  transaksiWarga   TransaksiSampah[] @relation("WargaTransaksi")
  transaksiPetugas TransaksiSampah[] @relation("PetugasTransaksi")

  @@map("users")
}

model KasPos {
  id         Int      @id @default(autoincrement())
  rw         String   @unique @db.VarChar(10) // e.g. "RW 08"
  namaUnit   String   @map("nama_unit") @db.VarChar(255) // e.g. "Unit Flamboyan 50"
  saldoKas   Decimal  @default(0) @map("saldo_kas") @db.Decimal(12, 2)
  targetKg   Decimal  @default(500) @map("target_kg") @db.Decimal(10, 2)
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("kas_pos")
}

model SampahAnorganik {
  id          String         @id @db.VarChar(10) // Kode BSB: "P05", "K01", "A03", "B08", "C01"
  kategori    KategoriSampah
  nama        String         @db.VarChar(255)
  satuan      String         @default("Kg") @db.VarChar(20) // "Kg" atau "Pcs"
  deskripsi   String?        @db.Text
  gambar      String?        @db.VarChar(255)
  hargaSatuan Decimal        @map("harga_satuan") @db.Decimal(12, 2) // Harga flat dasar
  isActive    Boolean        @default(true) @map("is_active")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  detailTransaksi DetailTransaksiSampah[]

  @@map("sampah_anorganik")
}

model TransaksiSampah {
  id               String           @id @default(uuid())
  nomorTransaksi   String           @unique @map("nomor_transaksi") @db.VarChar(50) // e.g. TRX-20261117-0001
  userId           String           @map("user_id")
  petugasId        String           @map("petugas_id")
  rwPos            String           @map("rw_pos") @db.VarChar(10)
  totalBerat       Decimal          @map("total_berat") @db.Decimal(10, 2)
  totalHarga       Decimal          @map("total_harga") @db.Decimal(12, 2)
  statusPembayaran StatusPembayaran @default(TABUNGAN) @map("status_pembayaran")
  clientOfflineId  String?          @unique @map("client_offline_id") // Idempotency key saat sync offline PWA
  createdAt        DateTime         @default(now()) @map("created_at")
  updatedAt        DateTime         @updatedAt @map("updated_at")

  warga            User                    @relation("WargaTransaksi", fields: [userId], references: [id], onDelete: Restrict)
  petugas          User                    @relation("PetugasTransaksi", fields: [petugasId], references: [id], onDelete: Restrict)
  items            DetailTransaksiSampah[]

  @@index([userId])
  @@index([rwPos, createdAt])
  @@map("transaksi_sampah_anorganik")
}

model DetailTransaksiSampah {
  id                String   @id @default(uuid())
  transaksiId       String   @map("transaksi_id")
  sampahAnorganikId String   @map("sampah_anorganik_id") @db.VarChar(10)
  kuantitas         Decimal  @db.Decimal(10, 2) // Berat (Kg) atau Jumlah (Pcs)
  hargaSatuan       Decimal  @map("harga_satuan") @db.Decimal(12, 2) // Price snapshot saat transaksi
  subtotal          Decimal  @db.Decimal(12, 2)
  createdAt         DateTime @default(now()) @map("created_at")

  transaksi         TransaksiSampah @relation(fields: [transaksiId], references: [id], onDelete: Cascade)
  sampah            SampahAnorganik @relation(fields: [sampahAnorganikId], references: [id], onDelete: Restrict)

  @@index([transaksiId])
  @@map("detail_transaksi_sampah_anorganik")
}
```

---

## 5. Spesifikasi REST API Endpoints (`/api/v1`)

### 5.1 Auth & Users
* `POST /api/v1/auth/register` — Registrasi Warga (bebas) atau Petugas/Admin (wajib `kodeAksesPengurus`).
* `POST /api/v1/auth/login` — Login menggunakan `nomorHp` & `password`, mengembalikan `token` JWT + profil user.
* `GET /api/v1/auth/me` — Mengambil profil user aktif beserta `saldoTabungan` & `kodeNasabah` (untuk QR).
* `GET /api/v1/users/nasabah?q=...&rw=...` *(Admin/Petugas Only)* — Mencari warga berdasarkan nama, nomor HP, atau RW.
* `GET /api/v1/users/qr/:kodeNasabah` *(Admin/Petugas Only)* — Lookup instan profil nasabah setelah kamera PWA memindai QR Code.

### 5.2 Master Data Sampah (Katalog BSB)
* `GET /api/v1/sampah?kategori=PLASTIK&search=...` *(All Authenticated)* — Mengambil daftar katalog sampah anorganik.
* `PATCH /api/v1/sampah/:id/harga` *(Admin/Petugas Only)* — Memperbarui `hargaSatuan` per kg/pcs.

### 5.3 Transaksi & Dashboard
* `GET /api/v1/dashboard/summary` *(All Authenticated)*:
  * Jika **Admin/Petugas**: Mengembalikan total berat setoran hari ini di RW-nya, nilai transaksi hari ini, jumlah warga menyetor, `saldoKas` pos RW, progress target harian, dan 5 transaksi terkini.
  * Jika **Warga**: Mengembalikan `saldoTabungan` pribadi, total berat sampah yang pernah disetor, jumlah transaksi, dan transaksi terakhir.
* `POST /api/v1/transaksi` *(Admin/Petugas Only)*:
  * Menerima `{ userId, statusPembayaran, clientOfflineId?, items: [{ sampahAnorganikId, kuantitas }] }`.
  * Menggunakan `prisma.$transaction`: menyimpan header & detail (dengan *snapshot* harga dari DB), lalu jika `TABUNGAN` menambah `saldoTabungan` warga; jika `TUNAI` mengurangi `saldoKas` pos RW.
* `GET /api/v1/transaksi` *(All Authenticated)* — Admin melihat semua transaksi RW; Warga hanya melihat `where: { userId: req.user.id }`.
* `GET /api/v1/transaksi/:id` *(All Authenticated)* — Mengambil detail lengkap struk digital transaksi (dengan validasi kepemilikan jika role `WARGA`).

---

## 6. Arsitektur Offline-First PWA
1. **Cache Master Data**: Saat online, katalog `sampah_anorganik` dan daftar nasabah RW di-cache ke IndexedDB (`Dexie.js`) agar petugas tetap bisa membuka form penimbangan dan memindai QR tanpa koneksi internet.
2. **Offline Transaction Queue**: Jika `navigator.onLine === false` saat tombol *Simpan & Cetak Struk Digital* ditekan, transaksi disimpan ke tabel lokal `pending_transactions` di IndexedDB lengkap dengan `clientOfflineId` (UUID).
3. **Auto-Sync**: Listener `window.addEventListener('online', ...)` otomatis mengirimkan antrean transaksi ke `POST /api/v1/transaksi`. Backend mengecek `clientOfflineId` agar tidak terjadi duplikasi data.