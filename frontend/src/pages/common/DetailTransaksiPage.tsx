import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transaksiApi } from '../../api/transaksi.api';
import { Transaksi } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  CheckCircle2,
  Share2,
  Printer,
  FileCheck,
  User,
  ShieldCheck,
} from 'lucide-react';

export const DetailTransaksiPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [transaksi, setTransaksi] = useState<Transaksi | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const res = await transaksiApi.getDetail(id);
        setTransaksi(res.data);
      } catch (err: any) {
        console.error('Failed to load transaction receipt', err);
        setError(err.response?.data?.message || 'Transaksi tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-forest-200 border-t-forest-900 rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-semibold">Memuat struk digital...</p>
        </div>
      </div>
    );
  }

  if (error || !transaksi) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-gray-50 p-6 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
          <FileCheck className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-gray-900 text-sm">Gagal Menampilkan Struk</h3>
        <p className="text-xs text-gray-500">{error || 'Data transaksi tidak ditemukan'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-forest-900 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const formattedDate = new Date(transaksi.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Handle WhatsApp Share
  const handleShareWhatsApp = () => {
    const phone = transaksi.warga?.nomorHp ? transaksi.warga.nomorHp.replace(/^0/, '62') : '';
    const itemsText = transaksi.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.sampah?.nama || 'Sampah'}: ${it.kuantitas} kg x Rp ${Number(
            it.hargaSatuan
          ).toLocaleString('id-ID')} = Rp ${Number(it.subtotal).toLocaleString('id-ID')}`
      )
      .join('%0A');

    const message = `*BUKTI SETORAN SAMPIAH*%0A` +
      `*Sampah jadi Rupiah - Pos ${transaksi.rwPos}*%0A` +
      `No: ${transaksi.nomorTransaksi}%0A` +
      `Nasabah: ${transaksi.warga?.nama || '-'} (${transaksi.warga?.kodeNasabah || '-'})%0A` +
      `Waktu: ${formattedDate} WIB%0A` +
      `------------------------------------%0A` +
      itemsText +
      `%0A------------------------------------%0A` +
      `*Total Berat:* ${Number(transaksi.totalBerat)} Kg%0A` +
      `*Total Diterima:* Rp ${Number(transaksi.totalHarga).toLocaleString('id-ID')}%0A` +
      `*Metode:* ${transaksi.statusPembayaran === 'TABUNGAN' ? 'Masuk Tabungan' : 'Tunai Langsung'}%0A%0A` +
      `Terima kasih telah berkontribusi memilah sampah untuk lingkungan Sekeloa yang lebih bersih!`;

    const waUrl = phone
      ? `https://wa.me/${phone}?text=${message}`
      : `https://api.whatsapp.com/send?text=${message}`;

    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20 pt-2 px-4 space-y-3">
      {/* Top Bar */}
      <div className="flex items-center justify-between py-2">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition shadow-2xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
            Detail Transaksi
          </h2>
          <p className="text-[10px] text-gray-500 font-medium">Bank Sampah RW 08 Sekeloa</p>
        </div>
        <div className="w-9 h-9"></div>
      </div>

      {/* Success Ribbon Pill */}
      <div className="bg-emerald-100/80 border border-emerald-300 text-emerald-900 rounded-full py-1.5 px-4 text-center flex items-center justify-center space-x-1.5 shadow-2xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
        <span className="text-xs font-extrabold uppercase tracking-wide">
          Transaksi Berhasil Ditimbang
        </span>
      </div>

      {/* Struk Paper Card (Matching detail-transaksi-ui.png) */}
      <div id="receipt-print-area" className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-md relative overflow-hidden space-y-4">
        {/* Header Unit */}
        <div className="text-center pt-2">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-2 shadow-xs overflow-hidden border border-gray-100">
            <img src="/logo.png" alt="Logo Sampiah" className="w-full h-full object-contain" />
          </div>
          <h3 className="font-black text-forest-950 text-base tracking-tight leading-snug">
            SAMPIAH {transaksi.rwPos ? `POS ${transaksi.rwPos}` : 'POS RW'}
          </h3>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
            Sampah jadi Rupiah • Coblong, Kota Bandung
          </p>
          <div className="mt-2 inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-[10px] font-extrabold">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-600"></span>
            <span>BUKTI SETORAN RESMI</span>
          </div>
        </div>

        {/* Metadata Transaksi */}
        <div className="bg-gray-50/70 rounded-2xl p-3 border border-gray-100 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">No. Transaksi</span>
            <span className="font-mono font-bold text-gray-900">#{transaksi.nomorTransaksi}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Waktu Timbang</span>
            <span className="font-bold text-gray-900">{formattedDate} WIB</span>
          </div>
        </div>

        {/* Dual Card: Nasabah & Petugas */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
            <span className="text-[10px] text-gray-400 font-semibold flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>Nama Nasabah</span>
            </span>
            <p className="font-extrabold text-gray-900 text-xs mt-1 truncate">
              {transaksi.warga?.nama || 'Nasabah RW'}
            </p>
            <p className="text-[10px] font-mono text-gray-500 mt-0.5 truncate">
              {transaksi.warga?.kodeNasabah} / {transaksi.warga?.rt || 'RT 01'}
            </p>
          </div>

          <div className="bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
            <span className="text-[10px] text-gray-400 font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Petugas & Lokasi</span>
            </span>
            <p className="font-extrabold text-gray-900 text-xs mt-1 truncate">
              {transaksi.petugas?.nama || 'Petugas RW'}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">Balai {transaksi.rwPos}</p>
          </div>
        </div>

        {/* Perforated separator */}
        <div className="border-t border-dashed border-gray-300 -mx-5 my-2"></div>

        {/* Rincian Item Sampah */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span className="uppercase tracking-wider">Rincian Sampah Anorganik</span>
            <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px] text-gray-700 font-semibold">
              {transaksi.items.length} Item
            </span>
          </div>

          <div className="space-y-2">
            {transaksi.items.map((it, idx) => (
              <div
                key={it.id || idx}
                className="bg-gray-50/80 rounded-2xl p-2.5 flex items-center justify-between text-xs border border-gray-100"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-900 font-black text-[11px] flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900 text-xs leading-tight">
                      {it.sampah?.nama || 'Item Sampah'}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {Number(it.kuantitas)} {it.sampah?.satuan || 'Kg'} x Rp{' '}
                      {Number(it.hargaSatuan).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <span className="font-black text-gray-900 text-xs">
                  Rp {Number(it.subtotal).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Perforated separator */}
        <div className="border-t border-dashed border-gray-300 -mx-5 my-2"></div>

        {/* Akumulasi Berat */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-500">Akumulasi Berat Ditimbang</span>
          <span className="text-lg font-black text-gray-900">
            {Number(transaksi.totalBerat).toFixed(2)} Kg
          </span>
        </div>

        {/* Big Total Box (Matching mockup green box) */}
        <div className="bg-forest-900 text-white rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-forest-200 text-[11px] font-bold uppercase tracking-wider">
              Total Diterima Nasabah
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-forest-800 text-forest-100 border border-forest-700">
              {transaksi.statusPembayaran === 'TABUNGAN' ? 'Masuk Tabungan' : 'Tunai Direct'}
            </span>
          </div>

          <p className="text-2xl font-black tracking-tight text-white">
            Rp {Number(transaksi.totalHarga).toLocaleString('id-ID')}
          </p>

          {transaksi.warga?.saldoTabungan !== undefined && (
            <p className="text-[11px] text-forest-200/90 font-medium pt-1">
              Saldo Baru Rekening: Rp{' '}
              {Number(transaksi.warga.saldoTabungan).toLocaleString('id-ID')}
            </p>
          )}
        </div>

        {/* Digital Signature Card with QR Code */}
        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200/70 flex items-center space-x-3">
          <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-2xs flex-shrink-0">
            <QRCodeSVG value={`BS-TRX:${transaksi.nomorTransaksi}:${transaksi.totalHarga}`} size={56} />
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-500 font-semibold uppercase">
              Tanda Tangan Digital Sampiah
            </p>
            <p className="text-[9px] font-mono text-gray-400 mt-0.5 truncate max-w-[200px]">
              ID:{transaksi.id}
            </p>
            <div className="flex items-center space-x-1 mt-1 text-[10px] font-bold text-forest-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
              <span>Tervalidasi di Buku Besar RW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={handleShareWhatsApp}
          className="w-full py-3.5 bg-forest-900 hover:bg-forest-950 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center space-x-2 transition active:scale-[0.98]"
        >
          <Share2 className="w-4 h-4" />
          <span>Kirim Bukti WhatsApp ke Warga</span>
        </button>

        <button
          onClick={handlePrint}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 transition active:scale-[0.98]"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Struk Mini Bluetooth / PDF</span>
        </button>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/timbangan')}
            className="text-xs font-extrabold text-forest-800 hover:text-forest-950 py-1"
          >
            Selesai &amp; Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
};

