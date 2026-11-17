import { PrismaClient, UserRole, KategoriSampah } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Memulai Seeding Database Bank Sampah Sekeloa ---');

  // 1. Seed Master Sampah Anorganik Bank Sampah Bersinar (BSB)
  const masterSampah = [
    // Kategori: PLASTIK (P05 - P46)
    {
      id: 'P05',
      kategori: KategoriSampah.PLASTIK,
      nama: 'PET Bening / Botol Air Mineral Bersih',
      satuan: 'Kg',
      deskripsi: 'Botol plastik PET transparan/bening tanpa tutup dan label',
      hargaSatuan: 3500,
    },
    {
      id: 'P06',
      kategori: KategoriSampah.PLASTIK,
      nama: 'PET Warna / Biru Muda',
      satuan: 'Kg',
      deskripsi: 'Botol PET berwarna (biru muda, hijau transparan)',
      hargaSatuan: 2500,
    },
    {
      id: 'P07',
      kategori: KategoriSampah.PLASTIK,
      nama: 'PET Kotor / Campur',
      satuan: 'Kg',
      deskripsi: 'Botol PET kondisi kotor atau belum dipilah',
      hargaSatuan: 1800,
    },
    {
      id: 'P08',
      kategori: KategoriSampah.PLASTIK,
      nama: 'Tutup Botol Plastik (HDPE)',
      satuan: 'Kg',
      deskripsi: 'Tutup botol air mineral / minuman aneka warna',
      hargaSatuan: 3000,
    },
    {
      id: 'P10',
      kategori: KategoriSampah.PLASTIK,
      nama: 'HDPE Blow / Botol Shampo & Sabun',
      satuan: 'Kg',
      deskripsi: 'Botol HDPE tebal seperti botol deterjen, jerigen, shampo',
      hargaSatuan: 4000,
    },
    {
      id: 'P11',
      kategori: KategoriSampah.PLASTIK,
      nama: 'HDPE Ember / Baskom Warna',
      satuan: 'Kg',
      deskripsi: 'Ember, baskom, gayung plastik keras warna-warni',
      hargaSatuan: 3000,
    },
    {
      id: 'P15',
      kategori: KategoriSampah.PLASTIK,
      nama: 'PP Gelas Bening Bersih (Aqua Gelas)',
      satuan: 'Kg',
      deskripsi: 'Gelas plastik PP tanpa sablon dan bibir gelas telah dipotong',
      hargaSatuan: 4500,
    },
    {
      id: 'P16',
      kategori: KategoriSampah.PLASTIK,
      nama: 'PP Gelas Sablon / Warna',
      satuan: 'Kg',
      deskripsi: 'Gelas plastik PP bercorak, sablon, atau campur',
      hargaSatuan: 2800,
    },
    {
      id: 'P20',
      kategori: KategoriSampah.PLASTIK,
      nama: 'PP Bening / Plastik Kresek Bening',
      satuan: 'Kg',
      deskripsi: 'Kantong plastik PP bening kering dan bersih',
      hargaSatuan: 1500,
    },
    {
      id: 'P25',
      kategori: KategoriSampah.PLASTIK,
      nama: 'Plastik Campur / Kresek Berwarna',
      satuan: 'Kg',
      deskripsi: 'Kresek warna-warni campur bersih',
      hargaSatuan: 800,
    },
    {
      id: 'P30',
      kategori: KategoriSampah.PLASTIK,
      nama: 'LDPE Film / Plastik Bening Tebal',
      satuan: 'Kg',
      deskripsi: 'Plastik pembungkus barang / bubble wrap bersih',
      hargaSatuan: 2000,
    },
    {
      id: 'P40',
      kategori: KategoriSampah.PLASTIK,
      nama: 'PVC / Pipa Paralon',
      satuan: 'Kg',
      deskripsi: 'Potongan pipa paralon putih/abu',
      hargaSatuan: 1200,
    },
    {
      id: 'P46',
      kategori: KategoriSampah.PLASTIK,
      nama: 'Plastik Keras / Mainan Rusak',
      satuan: 'Kg',
      deskripsi: 'Mainan plastik keras tanpa komponen baterai/elektronik',
      hargaSatuan: 1500,
    },

    // Kategori: KERTAS (K01 - K10)
    {
      id: 'K01',
      kategori: KategoriSampah.KERTAS,
      nama: 'Kardus Bagus / Corrugated Box',
      satuan: 'Kg',
      deskripsi: 'Kardus coklat tebal berlapis gelombang dalam kondisi kering',
      hargaSatuan: 1800,
    },
    {
      id: 'K02',
      kategori: KategoriSampah.KERTAS,
      nama: 'Kardus Campur / Sedang',
      satuan: 'Kg',
      deskripsi: 'Kardus tipis atau bercampur lakban',
      hargaSatuan: 1400,
    },
    {
      id: 'K03',
      kategori: KategoriSampah.KERTAS,
      nama: 'Kertas Putih HVS / SWL / Dokumen',
      satuan: 'Kg',
      deskripsi: 'Kertas dokumen HVS putih tanpa staples dan lem',
      hargaSatuan: 2200,
    },
    {
      id: 'K04',
      kategori: KategoriSampah.KERTAS,
      nama: 'Kertas Buram / Koran Bekas',
      satuan: 'Kg',
      deskripsi: 'Koran bekas rapi dan kertas buram kering',
      hargaSatuan: 1200,
    },
    {
      id: 'K05',
      kategori: KategoriSampah.KERTAS,
      nama: 'Kertas Majalah / Glossy',
      satuan: 'Kg',
      deskripsi: 'Majalah, brosur, pamflet dengan permukaan mengkilap',
      hargaSatuan: 900,
    },
    {
      id: 'K06',
      kategori: KategoriSampah.KERTAS,
      nama: 'Buku Tulis / Kertas Campur',
      satuan: 'Kg',
      deskripsi: 'Buku tulis sekolah bekas tanpa cover plastik tebal',
      hargaSatuan: 1300,
    },
    {
      id: 'K07',
      kategori: KategoriSampah.KERTAS,
      nama: 'Kertas Duplek / Kotak Makanan',
      satuan: 'Kg',
      deskripsi: 'Karton kotak kemasan obat, pasta gigi, atau kue',
      hargaSatuan: 600,
    },
    {
      id: 'K08',
      kategori: KategoriSampah.KERTAS,
      nama: 'Kertas Semen / Kraft',
      satuan: 'Kg',
      deskripsi: 'Kantung kertas semen coklat bersih tanpa sisa semen keras',
      hargaSatuan: 1000,
    },
    {
      id: 'K09',
      kategori: KategoriSampah.KERTAS,
      nama: 'Kertas Tetra Pak / Kemasan Minuman',
      satuan: 'Kg',
      deskripsi: 'Kotak susu/jus aseptik yang sudah dibilas dan dipipihkan',
      hargaSatuan: 500,
    },
    {
      id: 'K10',
      kategori: KategoriSampah.KERTAS,
      nama: 'Paper Cup / Kertas Laminasi',
      satuan: 'Kg',
      deskripsi: 'Gelas kertas kopi/minuman bersih kering',
      hargaSatuan: 400,
    },

    // Kategori: LOGAM (A03, L01, S01, S02, T01)
    {
      id: 'A03',
      kategori: KategoriSampah.LOGAM,
      nama: 'Aluminium Kaleng Minuman',
      satuan: 'Kg',
      deskripsi: 'Kaleng soft drink aluminium dalam keadaan pipih',
      hargaSatuan: 13000,
    },
    {
      id: 'L01',
      kategori: KategoriSampah.LOGAM,
      nama: 'Besi Tebal / Besi Super',
      satuan: 'Kg',
      deskripsi: 'Besi padat, rel, potongan baja ketebalan > 3 mm',
      hargaSatuan: 4500,
    },
    {
      id: 'S01',
      kategori: KategoriSampah.LOGAM,
      nama: 'Besi Tipis / Seng / Kaleng Susu',
      satuan: 'Kg',
      deskripsi: 'Seng bangunan, kaleng biskuit, kaleng susu kental manis',
      hargaSatuan: 2500,
    },
    {
      id: 'S02',
      kategori: KategoriSampah.LOGAM,
      nama: 'Tembaga Super',
      satuan: 'Kg',
      deskripsi: 'Kabel tembaga kupas diameter tebal bersih tanpa isolator',
      hargaSatuan: 85000,
    },
    {
      id: 'T01',
      kategori: KategoriSampah.LOGAM,
      nama: 'Kuningan',
      satuan: 'Kg',
      deskripsi: 'Kran air kuningan, gembok, atau aksesoris logam kuningan',
      hargaSatuan: 45000,
    },

    // Kategori: KACA (B08 - B11)
    {
      id: 'B08',
      kategori: KategoriSampah.KACA,
      nama: 'Botol Kaca Sirup Marjan / Bening',
      satuan: 'Pcs',
      deskripsi: 'Botol kaca utuh tanpa retak ukuran 600ml bening',
      hargaSatuan: 800,
    },
    {
      id: 'B09',
      kategori: KategoriSampah.KACA,
      nama: 'Botol Kaca Kecap / Coklat',
      satuan: 'Pcs',
      deskripsi: 'Botol kaca utuh warna coklat gelap ukuran besar',
      hargaSatuan: 600,
    },
    {
      id: 'B10',
      kategori: KategoriSampah.KACA,
      nama: 'Botol Kaca Campur / Kecil',
      satuan: 'Pcs',
      deskripsi: 'Botol beling utuh aneka ukuran kecil/sedang',
      hargaSatuan: 300,
    },
    {
      id: 'B11',
      kategori: KategoriSampah.KACA,
      nama: 'Pecahan Kaca / Beling Campur',
      satuan: 'Kg',
      deskripsi: 'Pecahan kaca jendela atau botol pecah',
      hargaSatuan: 200,
    },

    // Kategori: LAINNYA (C01 - C04, E01)
    {
      id: 'C01',
      kategori: KategoriSampah.LAINNYA,
      nama: 'Minyak Jelantah (UCO)',
      satuan: 'Kg',
      deskripsi: 'Minyak goreng bekas pakai yang telah disaring kotorannya',
      hargaSatuan: 6000,
    },
    {
      id: 'C02',
      kategori: KategoriSampah.LAINNYA,
      nama: 'Aki Bekas Kendaraan',
      satuan: 'Kg',
      deskripsi: 'Aki basah/kering motor atau mobil bekas',
      hargaSatuan: 11000,
    },
    {
      id: 'C03',
      kategori: KategoriSampah.LAINNYA,
      nama: 'Elektronik Rusak / PCB Board',
      satuan: 'Kg',
      deskripsi: 'Papan sirkuit elektronik komputer/TV rusak',
      hargaSatuan: 15000,
    },
    {
      id: 'C04',
      kategori: KategoriSampah.LAINNYA,
      nama: 'Ban Bekas Sepeda Motor',
      satuan: 'Pcs',
      deskripsi: 'Ban luar motor bekas utuh tanpa velg',
      hargaSatuan: 2000,
    },
    {
      id: 'E01',
      kategori: KategoriSampah.LAINNYA,
      nama: 'Kabel Bekas dengan Pembungkus',
      satuan: 'Kg',
      deskripsi: 'Kabel listrik campur dengan lapisan isolasi karet/PVC',
      hargaSatuan: 8000,
    },
  ];

  for (const item of masterSampah) {
    await prisma.sampahAnorganik.upsert({
      where: { id: item.id },
      update: {
        nama: item.nama,
        kategori: item.kategori,
        satuan: item.satuan,
        deskripsi: item.deskripsi,
        hargaSatuan: item.hargaSatuan,
        isActive: true,
      },
      create: {
        id: item.id,
        nama: item.nama,
        kategori: item.kategori,
        satuan: item.satuan,
        deskripsi: item.deskripsi,
        hargaSatuan: item.hargaSatuan,
        isActive: true,
      },
    });
  }
  console.log(`✓ Berhasil seed ${masterSampah.length} data master sampah BSB.`);

  // 2. Seed Data Pos RW (RW 01 s.d. RW 15 Kelurahan Sekeloa)
  const posRwData = [
    { rw: 'RW 01', namaUnit: 'Unit Anggrek 01', saldoKas: 500000, targetKg: 500 },
    { rw: 'RW 02', namaUnit: 'Unit Melati 02', saldoKas: 650000, targetKg: 500 },
    { rw: 'RW 03', namaUnit: 'Unit Dahlia 03', saldoKas: 400000, targetKg: 400 },
    { rw: 'RW 04', namaUnit: 'Unit Mawar 04', saldoKas: 750000, targetKg: 500 },
    { rw: 'RW 05', namaUnit: 'Unit Cempaka 05', saldoKas: 550000, targetKg: 500 },
    { rw: 'RW 06', namaUnit: 'Unit Kenanga 06', saldoKas: 300000, targetKg: 400 },
    { rw: 'RW 07', namaUnit: 'Unit Bougenville 07', saldoKas: 800000, targetKg: 600 },
    { rw: 'RW 08', namaUnit: 'Unit Flamboyan 50', saldoKas: 2450000, targetKg: 500 },
    { rw: 'RW 09', namaUnit: 'Unit Teratai 09', saldoKas: 450000, targetKg: 400 },
    { rw: 'RW 10', namaUnit: 'Unit Kamboja 10', saldoKas: 520000, targetKg: 500 },
    { rw: 'RW 11', namaUnit: 'Unit Tulip 11', saldoKas: 350000, targetKg: 400 },
    { rw: 'RW 12', namaUnit: 'Unit Sakura 12', saldoKas: 600000, targetKg: 500 },
    { rw: 'RW 13', namaUnit: 'Unit Asoka 13', saldoKas: 480000, targetKg: 450 },
    { rw: 'RW 14', namaUnit: 'Unit Edelweiss 14', saldoKas: 700000, targetKg: 500 },
    { rw: 'RW 15', namaUnit: 'Unit Cendana 15', saldoKas: 620000, targetKg: 500 },
  ];

  for (const pos of posRwData) {
    await prisma.kasPos.upsert({
      where: { rw: pos.rw },
      update: {
        namaUnit: pos.namaUnit,
        saldoKas: pos.saldoKas,
        targetKg: pos.targetKg,
      },
      create: {
        rw: pos.rw,
        namaUnit: pos.namaUnit,
        saldoKas: pos.saldoKas,
        targetKg: pos.targetKg,
      },
    });
  }
  console.log(`✓ Berhasil seed ${posRwData.length} Pos RW Kelurahan Sekeloa.`);

  // 3. Seed Dummy Users (1 Admin RW dan 1 Warga)
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // Admin RW 08
  const adminUser = await prisma.user.upsert({
    where: { nomorHp: '081234567890' },
    update: {
      nama: 'Bambang Supriyanto',
      rw: 'RW 08',
      rt: 'RT 01',
      unitBankSampah: 'Unit Flamboyan 50',
      role: UserRole.ADMIN_RW,
      passwordHash: defaultPasswordHash,
    },
    create: {
      kodeNasabah: 'BS-SKL-08001',
      nama: 'Bambang Supriyanto',
      nomorHp: '081234567890',
      passwordHash: defaultPasswordHash,
      rw: 'RW 08',
      rt: 'RT 01',
      unitBankSampah: 'Unit Flamboyan 50',
      role: UserRole.ADMIN_RW,
      saldoTabungan: 0,
    },
  });

  // Warga Nasabah RW 08
  const wargaUser = await prisma.user.upsert({
    where: { nomorHp: '089876543210' },
    update: {
      nama: 'Siti Aminah',
      rw: 'RW 08',
      rt: 'RT 03',
      unitBankSampah: 'Unit Flamboyan 50',
      role: UserRole.WARGA,
      saldoTabungan: 85000,
      passwordHash: defaultPasswordHash,
    },
    create: {
      kodeNasabah: 'BS-SKL-08034',
      nama: 'Siti Aminah',
      nomorHp: '089876543210',
      passwordHash: defaultPasswordHash,
      rw: 'RW 08',
      rt: 'RT 03',
      unitBankSampah: 'Unit Flamboyan 50',
      role: UserRole.WARGA,
      saldoTabungan: 85000,
    },
  });

  console.log(`✓ Berhasil seed akun Admin RW: ${adminUser.nama} (${adminUser.nomorHp})`);
  console.log(`✓ Berhasil seed akun Warga: ${wargaUser.nama} (${wargaUser.nomorHp}) - Kode QR: ${wargaUser.kodeNasabah}`);
  console.log('--- Seeding Selesai Sukses ---');
}

main()
  .catch((e) => {
    console.error('Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

