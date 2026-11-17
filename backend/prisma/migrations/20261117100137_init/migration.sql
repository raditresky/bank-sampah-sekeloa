-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `kode_nasabah` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(255) NOT NULL,
    `nomor_hp` VARCHAR(20) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `rw` VARCHAR(10) NOT NULL,
    `rt` VARCHAR(10) NULL,
    `unit_bank_sampah` VARCHAR(255) NULL,
    `role` ENUM('WARGA', 'ADMIN_RW', 'PETUGAS_BANK_SAMPAH') NOT NULL DEFAULT 'WARGA',
    `saldo_tabungan` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_kode_nasabah_key`(`kode_nasabah`),
    UNIQUE INDEX `users_nomor_hp_key`(`nomor_hp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kas_pos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rw` VARCHAR(10) NOT NULL,
    `nama_unit` VARCHAR(255) NOT NULL,
    `saldo_kas` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `target_kg` DECIMAL(10, 2) NOT NULL DEFAULT 500,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kas_pos_rw_key`(`rw`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sampah_anorganik` (
    `id` VARCHAR(10) NOT NULL,
    `kategori` ENUM('PLASTIK', 'KERTAS', 'LOGAM', 'KACA', 'LAINNYA') NOT NULL,
    `nama` VARCHAR(255) NOT NULL,
    `satuan` VARCHAR(20) NOT NULL DEFAULT 'Kg',
    `deskripsi` TEXT NULL,
    `gambar` VARCHAR(255) NULL,
    `harga_satuan` DECIMAL(12, 2) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaksi_sampah_anorganik` (
    `id` VARCHAR(191) NOT NULL,
    `nomor_transaksi` VARCHAR(50) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `petugas_id` VARCHAR(191) NOT NULL,
    `rw_pos` VARCHAR(10) NOT NULL,
    `total_berat` DECIMAL(10, 2) NOT NULL,
    `total_harga` DECIMAL(12, 2) NOT NULL,
    `status_pembayaran` ENUM('TUNAI', 'TABUNGAN') NOT NULL DEFAULT 'TABUNGAN',
    `client_offline_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `transaksi_sampah_anorganik_nomor_transaksi_key`(`nomor_transaksi`),
    UNIQUE INDEX `transaksi_sampah_anorganik_client_offline_id_key`(`client_offline_id`),
    INDEX `transaksi_sampah_anorganik_user_id_idx`(`user_id`),
    INDEX `transaksi_sampah_anorganik_rw_pos_created_at_idx`(`rw_pos`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detail_transaksi_sampah_anorganik` (
    `id` VARCHAR(191) NOT NULL,
    `transaksi_id` VARCHAR(191) NOT NULL,
    `sampah_anorganik_id` VARCHAR(10) NOT NULL,
    `kuantitas` DECIMAL(10, 2) NOT NULL,
    `harga_satuan` DECIMAL(12, 2) NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `detail_transaksi_sampah_anorganik_transaksi_id_idx`(`transaksi_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transaksi_sampah_anorganik` ADD CONSTRAINT `transaksi_sampah_anorganik_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi_sampah_anorganik` ADD CONSTRAINT `transaksi_sampah_anorganik_petugas_id_fkey` FOREIGN KEY (`petugas_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_transaksi_sampah_anorganik` ADD CONSTRAINT `detail_transaksi_sampah_anorganik_transaksi_id_fkey` FOREIGN KEY (`transaksi_id`) REFERENCES `transaksi_sampah_anorganik`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_transaksi_sampah_anorganik` ADD CONSTRAINT `detail_transaksi_sampah_anorganik_sampah_anorganik_id_fkey` FOREIGN KEY (`sampah_anorganik_id`) REFERENCES `sampah_anorganik`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
