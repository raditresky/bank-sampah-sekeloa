import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { transaksiApi } from '../../api/transaksi.api';
import { pencairanApi } from '../../api/pencairan.api';
import { Transaksi, Pencairan } from '../../types';
import { db, PendingTransaction } from '../../db/offlineDb';
import {
  ReceiptText,
  Calendar,
  CloudUpload,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Banknote,
  ArrowDownLeft,
  XCircle,
  X,
  CreditCard,
  Building2,
  UserCheck,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

type HistoryFilter = 'ALL' | 'SETORAN' | 'PENCAIRAN';
type TimeFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

type MergedItem =
  | { kind: 'TRANSAKSI'; data: Transaksi; date: Date }
  | { kind: 'PENCAIRAN'; data: Pencairan; date: Date };

export const RiwayatPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [pencairanList, setPencairanList] = useState<Pencairan[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<HistoryFilter>('ALL');

  // Filter Waktu / Rentang Tanggal
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Selected pencairan detail modal
  const [selectedPencairan, setSelectedPencairan] = useState<Pencairan | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const [trxRes, pencairanRes] = await Promise.allSettled([
          transaksiApi.getRiwayat(),
          pencairanApi.getAll(),
        ]);

        if (trxRes.status === 'fulfilled') {
          setTransactions(trxRes.value.data.items || []);
        }
        if (pencairanRes.status === 'fulfilled') {
          setPencairanList(pencairanRes.value.data || []);
        }
      }

      // Load offline pending transactions from Dexie
      const pending = await db.pendingTransactions.toArray();
      setPendingTransactions(pending);
    } catch (err) {
      console.error('Failed to load transaction history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const handleSyncEvent = () => fetchHistory();
    window.addEventListener('bank-sampah-sync-completed', handleSyncEvent);
    return () => {
      window.removeEventListener('bank-sampah-sync-completed', handleSyncEvent);
    };
  }, []);

  // Merge and sort
  const mergedItems: MergedItem[] = [
    ...transactions.map((t) => ({
      kind: 'TRANSAKSI' as const,
      data: t,
      date: new Date(t.createdAt),
    })),
    ...pencairanList.map((p) => ({
      kind: 'PENCAIRAN' as const,
      data: p,
      date: new Date(p.createdAt),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredItems = mergedItems.filter((item) => {
    // 1. Filter Tipe
    if (filterType === 'SETORAN' && item.kind !== 'TRANSAKSI') return false;
    if (filterType === 'PENCAIRAN' && item.kind !== 'PENCAIRAN') return false;

    // 2. Filter Waktu
    const itemDate = new Date(item.date);
    const now = new Date();

    if (timeFilter === 'TODAY') {
      const isToday =
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate();
      if (!isToday) return false;
    } else if (timeFilter === 'WEEK') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0);
      if (itemDate < oneWeekAgo) return false;
    } else if (timeFilter === 'MONTH') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(now.getDate() - 30);
      oneMonthAgo.setHours(0, 0, 0, 0);
      if (itemDate < oneMonthAgo) return false;
    } else if (timeFilter === 'CUSTOM') {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
    }

    return true;
  });

  // Ekspor Data Terfilter ke File Spreadsheet Excel XML yang Rapi & Berwarna
  const handleExportSpreadsheet = () => {
    if (filteredItems.length === 0) {
      alert('Tidak ada data riwayat pada periode ini untuk diekspor.');
      return;
    }

    const timeLabel =
      timeFilter === 'TODAY'
        ? 'Hari Ini'
        : timeFilter === 'WEEK'
        ? '1 Minggu Terakhir'
        : timeFilter === 'MONTH'
        ? '1 Bulan Terakhir'
        : timeFilter === 'CUSTOM'
        ? `Periode ${startDate || 'Awal'} s/d ${endDate || 'Akhir'}`
        : 'Semua Waktu';

    const fileDateSlug =
      timeFilter === 'TODAY'
        ? 'hari_ini'
        : timeFilter === 'WEEK'
        ? '1_minggu'
        : timeFilter === 'MONTH'
        ? '1_bulan'
        : timeFilter === 'CUSTOM'
        ? `${startDate || 'awal'}_sd_${endDate || 'akhir'}`
        : 'semua_waktu';

    // Hitung ringkasan akumulasi
    let totalKgSetoran = 0;
    let totalNominalSetoran = 0;
    let totalNominalPencairan = 0;

    filteredItems.forEach((item) => {
      if (item.kind === 'TRANSAKSI') {
        totalKgSetoran += parseFloat(String(item.data.totalBerat)) || 0;
        totalNominalSetoran += parseFloat(String(item.data.totalHarga)) || 0;
      } else {
        totalNominalPencairan += parseFloat(String(item.data.jumlahNominal)) || 0;
      }
    });

    const escapeXml = (str: any) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Format Excel Spreadsheet XML 2003 (Membuka langsung di Excel dengan styling warna, border, dan formula angka)
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <!-- Judul Utama -->
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#1B4D3E"/>
  </Style>
  <!-- Sub Judul -->
  <Style ss:ID="Subtitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#555555"/>
  </Style>
  <!-- Summary Box Labels -->
  <Style ss:ID="SummaryLabel">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#333333"/>
   <Interior ss:Color="#EAEAEA" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
   </Borders>
  </Style>
  <Style ss:ID="SummaryValue">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#1B4D3E"/>
   <Interior ss:Color="#F4F9F6" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
   </Borders>
  </Style>
  <!-- Table Header -->
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#113329"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#113329"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1B4D3E"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1B4D3E"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1B4D3E" ss:Pattern="Solid"/>
  </Style>
  <!-- Data Styles -->
  <Style ss:ID="DataCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
  </Style>
  <Style ss:ID="DataLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
  </Style>
  <Style ss:ID="DataSetoran">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#047857"/>
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
  </Style>
  <Style ss:ID="DataPencairan">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#B45309"/>
   <Interior ss:Color="#FFFBEB" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
  </Style>
  <Style ss:ID="DataNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCurrency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
  </Style>
  <!-- Total Row -->
  <Style ss:ID="TotalLabel">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#000000"/>
   <Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#113329"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#113329"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalValue">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#1B4D3E"/>
   <NumberFormat ss:Format="&quot;Rp &quot;#,##0"/>
   <Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#113329"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#113329"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalKg">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#1B4D3E"/>
   <NumberFormat ss:Format="#,##0.00&quot; Kg&quot;"/>
   <Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#113329"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#113329"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Rekap Aktivitas">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="35"/>  <!-- No -->
   <Column ss:Width="110"/> <!-- Tanggal & Waktu -->
   <Column ss:Width="105"/> <!-- Jenis Aktivitas -->
   <Column ss:Width="130"/> <!-- No Referensi -->
   <Column ss:Width="130"/> <!-- Nama Warga -->
   <Column ss:Width="95"/>  <!-- Kode Nasabah -->
   <Column ss:Width="60"/>  <!-- RW -->
   <Column ss:Width="80"/>  <!-- Total Bobot -->
   <Column ss:Width="110"/> <!-- Total Nominal -->
   <Column ss:Width="115"/> <!-- Status / Metode -->
   <Column ss:Width="125"/> <!-- Admin / Petugas -->
   <Column ss:Width="250"/> <!-- Rincian Sampah / Catatan -->

   <!-- Header Title & Branding -->
   <Row ss:Height="26">
    <Cell ss:MergeAcross="11" ss:StyleID="Title"><Data ss:Type="String">SAMPIAH - LAPORAN REKAPITULASI AKTIVITAS</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="11" ss:StyleID="Subtitle"><Data ss:Type="String">Unit Bank Sampah ${escapeXml(user?.rw || 'Kelurahan Sekeloa')} • Periode: ${escapeXml(timeLabel)} • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Data></Cell>
   </Row>
   <Row ss:Height="10"></Row>

   <!-- Summary Box Mini -->
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="SummaryLabel"><Data ss:Type="String">Total Volume Setoran</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="String">${totalKgSetoran.toLocaleString('id-ID')} Kg</Data></Cell>
    <Cell ss:Index="5" ss:MergeAcross="1" ss:StyleID="SummaryLabel"><Data ss:Type="String">Total Nilai Sampah Warga</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="String">Rp ${totalNominalSetoran.toLocaleString('id-ID')}</Data></Cell>
    <Cell ss:Index="9" ss:MergeAcross="1" ss:StyleID="SummaryLabel"><Data ss:Type="String">Total Pencairan Tabungan</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="String">Rp ${totalNominalPencairan.toLocaleString('id-ID')}</Data></Cell>
   </Row>
   <Row ss:Height="12"></Row>

   <!-- Main Table Column Headers -->
   <Row ss:Height="28">
    <Cell ss:StyleID="Header"><Data ss:Type="String">No</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tanggal &amp; Waktu</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Jenis Aktivitas</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">No Referensi</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nama Nasabah</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Kode Nasabah</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Pos RW</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Bobot (Kg)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Nilai (Rp)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Metode / Status</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Admin / Petugas</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Rincian Sampah / Catatan</Data></Cell>
   </Row>
`;

    // Data Baris
    filteredItems.forEach((item, idx) => {
      const dateStr = item.date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      if (item.kind === 'TRANSAKSI') {
        const trx = item.data;
        const rincian = (trx.items || [])
          .map(
            (it) =>
              `${it.sampah?.nama || 'Sampah'} (${it.kuantitas} Kg × Rp ${Number(it.hargaSatuan).toLocaleString('id-ID')} = Rp ${Number(it.subtotal).toLocaleString('id-ID')})`
          )
          .join('; ');

        xml += `   <Row ss:Height="22">
    <Cell ss:StyleID="DataCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(dateStr)}</Data></Cell>
    <Cell ss:StyleID="DataSetoran"><Data ss:Type="String">Setoran Sampah</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(trx.nomorTransaksi)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(trx.warga?.nama || '-')}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(trx.warga?.kodeNasabah || '-')}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(trx.rwPos)}</Data></Cell>
    <Cell ss:StyleID="DataNumber"><Data ss:Type="Number">${parseFloat(String(trx.totalBerat)) || 0}</Data></Cell>
    <Cell ss:StyleID="DataCurrency"><Data ss:Type="Number">${parseFloat(String(trx.totalHarga)) || 0}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(trx.statusPembayaran)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(trx.petugas?.nama || 'Petugas RW')}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(rincian || '-')}</Data></Cell>
   </Row>\n`;
      } else {
        const pnc = item.data;
        const namaAdminPencair = pnc.petugas?.nama || (pnc.status === 'DISETUJUI' ? 'Admin RW' : '-');

        xml += `   <Row ss:Height="22">
    <Cell ss:StyleID="DataCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(dateStr)}</Data></Cell>
    <Cell ss:StyleID="DataPencairan"><Data ss:Type="String">Pencairan Saldo</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(pnc.nomorPencairan)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(pnc.warga?.nama || '-')}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(pnc.warga?.kodeNasabah || '-')}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(pnc.rwPos)}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">-</Data></Cell>
    <Cell ss:StyleID="DataCurrency"><Data ss:Type="Number">${parseFloat(String(pnc.jumlahNominal)) || 0}</Data></Cell>
    <Cell ss:StyleID="DataCenter"><Data ss:Type="String">${escapeXml(`${pnc.metode} (${pnc.status})`)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(namaAdminPencair)}</Data></Cell>
    <Cell ss:StyleID="DataLeft"><Data ss:Type="String">${escapeXml(pnc.catatan || pnc.infoRekening || '-')}</Data></Cell>
   </Row>\n`;
      }
    });

    // Baris Total di paling bawah
    xml += `   <Row ss:Height="24">
    <Cell ss:MergeAcross="6" ss:StyleID="TotalLabel"><Data ss:Type="String">TOTAL KESELURUHAN:</Data></Cell>
    <Cell ss:StyleID="TotalKg"><Data ss:Type="Number">${totalKgSetoran}</Data></Cell>
    <Cell ss:StyleID="TotalValue"><Data ss:Type="Number">${totalNominalSetoran}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="TotalLabel"><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <Selected/>
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>7</SplitHorizontal>
   <TopRowBottomPane>7</TopRowBottomPane>
   <ActivePane>2</ActivePane>
   <Panes>
    <Pane>
     <Number>3</Number>
    </Pane>
    <Pane>
     <Number>2</Number>
     <ActiveRow>7</ActiveRow>
    </Pane>
   </Panes>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap_riwayat_sampiah_${fileDateSlug}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-3.5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 tracking-tight">Riwayat Aktivitas</h2>
          <p className="text-xs text-gray-500">
            {isAdmin ? `Seluruh setoran & pencairan di ${user?.rw}` : 'Catatan setoran sampah & pencairan saldo'}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={handleExportSpreadsheet}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Spreadsheet</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1.5 bg-gray-100 p-1 rounded-2xl">
        <button
          onClick={() => setFilterType('ALL')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
            filterType === 'ALL' ? 'bg-white text-forest-950 shadow-2xs' : 'text-gray-500'
          }`}
        >
          Semua ({mergedItems.length})
        </button>
        <button
          onClick={() => setFilterType('SETORAN')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
            filterType === 'SETORAN'
              ? 'bg-white text-forest-900 shadow-2xs'
              : 'text-gray-500'
          }`}
        >
          Setoran ({transactions.length})
        </button>
        <button
          onClick={() => setFilterType('PENCAIRAN')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
            filterType === 'PENCAIRAN' ? 'bg-white text-amber-900 shadow-2xs' : 'text-gray-500'
          }`}
        >
          Pencairan ({pencairanList.length})
        </button>
      </div>

      {/* Filter Waktu & Rentang Tanggal */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-forest-700" />
            <span>Periode Waktu:</span>
          </span>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-800"
          >
            <option value="ALL">Semua Waktu</option>
            <option value="TODAY">Hari Ini</option>
            <option value="WEEK">1 Minggu Terakhir</option>
            <option value="MONTH">1 Bulan Terakhir</option>
            <option value="CUSTOM">Pilih Tanggal Tertentu...</option>
          </select>
        </div>

        {/* Input Rentang Tanggal (Muncul jika pilih 'Pilih Tanggal Tertentu') */}
        {timeFilter === 'CUSTOM' && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 animate-in fade-in">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-forest-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-forest-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* Offline Pending Transactions (If any) */}
      {pendingTransactions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800">
            <CloudUpload className="w-4 h-4 text-amber-600 animate-bounce" />
            <span>Antrean Sinkronisasi Offline ({pendingTransactions.length})</span>
          </div>

          <div className="space-y-2">
            {pendingTransactions.map((trx, index) => (
              <div
                key={trx.id || index}
                className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-amber-950">{trx.wargaNama}</p>
                  <p className="text-[10px] text-amber-700">
                    {trx.totalBerat} Kg • Rp {trx.totalHarga.toLocaleString('id-ID')}
                  </p>
                  <span className="inline-block mt-1 text-[9px] font-semibold bg-amber-200/60 text-amber-900 px-1.5 py-0.2 rounded">
                    Menunggu Internet
                  </span>
                </div>
                <Clock className="w-5 h-5 text-amber-500 animate-spin" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400 border border-gray-100">
          Memuat riwayat transaksi...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 space-y-2">
          <ReceiptText className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-xs font-bold text-gray-700">Belum ada riwayat aktivitas</p>
          <p className="text-[11px] text-gray-400">
            Aktivitas setoran dan pencairan tabungan akan otomatis tercatat di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            if (item.kind === 'TRANSAKSI') {
              const trx = item.data;
              return (
                <div
                  key={`trx-${trx.id}`}
                  onClick={() => navigate(`/transaksi/${trx.id}`)}
                  className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs hover:border-forest-300 transition cursor-pointer flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-forest-50 text-forest-900 flex items-center justify-center flex-shrink-0 group-hover:bg-forest-100 transition">
                      <ReceiptText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <p className="text-xs font-black text-gray-900">
                          {trx.warga?.nama || 'Setoran Sampah'}
                        </p>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                            trx.statusPembayaran === 'TABUNGAN'
                              ? 'bg-forest-50 text-forest-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {trx.statusPembayaran}
                        </span>
                      </div>

                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {new Date(trx.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        #{trx.nomorTransaksi}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex items-center space-x-2">
                    <div>
                      <p className="text-xs font-black text-forest-900">
                        + Rp {Number(trx.totalHarga).toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] font-bold text-gray-500">
                        {Number(trx.totalBerat).toFixed(1)} Kg
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-forest-900 transition" />
                  </div>
                </div>
              );
            }

            // PENCAIRAN ITEM
            const pencairan = item.data;
            const isApproved = pencairan.status === 'DISETUJUI';
            const isRejected = pencairan.status === 'DITOLAK';
            const isPending = pencairan.status === 'MENUNGGU';

            return (
              <div
                key={`pencairan-${pencairan.id}`}
                onClick={() => setSelectedPencairan(pencairan)}
                className={`bg-white rounded-3xl p-4 border transition cursor-pointer flex items-center justify-between group active:scale-[0.99] shadow-2xs ${
                  isPending
                    ? 'border-amber-200 hover:border-amber-400 bg-amber-50/20'
                    : isRejected
                    ? 'border-red-100 hover:border-red-300'
                    : 'border-gray-100 hover:border-forest-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition ${
                      isPending
                        ? 'bg-amber-100 text-amber-800'
                        : isRejected
                        ? 'bg-red-50 text-red-600'
                        : 'bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <p className="text-xs font-black text-gray-900">
                        {isAdmin
                          ? pencairan.warga?.nama || 'Pencairan Tabungan'
                          : 'Pencairan Tabungan'}
                      </p>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRejected
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isApproved ? 'Dicairkan' : isRejected ? 'Ditolak' : 'Menunggu'}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                      {new Date(pencairan.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      #{pencairan.nomorPencairan} • {pencairan.metode}
                    </p>
                  </div>
                </div>

                <div className="text-right flex items-center space-x-2">
                  <div>
                    <p
                      className={`text-xs font-black ${
                        isApproved
                          ? 'text-red-700'
                          : isRejected
                          ? 'text-gray-400 line-through'
                          : 'text-amber-700'
                      }`}
                    >
                      - Rp {Number(pencairan.jumlahNominal).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] font-medium text-gray-500">
                      {pencairan.metode === 'TUNAI' ? 'Tunai di Pos' : 'Transfer'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-forest-900 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail Pencairan */}
      {selectedPencairan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedPencairan.status === 'DISETUJUI'
                      ? 'bg-emerald-50 text-emerald-700'
                      : selectedPencairan.status === 'DITOLAK'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">Detail Pencairan Tabungan</h3>
                  <p className="text-[11px] text-gray-500">#{selectedPencairan.nomorPencairan}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPencairan(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nominal Box */}
            <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
              <p className="text-[11px] text-gray-500 font-semibold">Nominal Pencairan</p>
              <h4 className="text-2xl font-black text-forest-950 mt-1">
                Rp {Number(selectedPencairan.jumlahNominal).toLocaleString('id-ID')}
              </h4>
              <span
                className={`inline-block mt-2 text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                  selectedPencairan.status === 'DISETUJUI'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedPencairan.status === 'DITOLAK'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {selectedPencairan.status === 'DISETUJUI'
                  ? '✓ BERHASIL DICAIRKAN'
                  : selectedPencairan.status === 'DITOLAK'
                  ? '✗ DITOLAK'
                  : '⏳ MENUNGGU PERSETUJUAN'}
              </span>
            </div>

            {/* Detail List */}
            <div className="space-y-2 text-xs border-t border-b border-gray-100 py-3">
              {isAdmin && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Nama Nasabah:</span>
                  <span className="font-bold text-gray-900">{selectedPencairan.warga?.nama}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Metode Penerimaan:</span>
                <span className="font-bold text-gray-900">
                  {selectedPencairan.metode === 'TUNAI' ? 'Tunai di Pos RW' : 'Transfer Bank / E-Wallet'}
                </span>
              </div>
              {selectedPencairan.infoRekening && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tujuan Transfer:</span>
                  <span className="font-bold text-gray-900">{selectedPencairan.infoRekening}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Waktu Pengajuan:</span>
                <span className="font-semibold text-gray-700">
                  {new Date(selectedPencairan.createdAt).toLocaleString('id-ID')}
                </span>
              </div>
              {selectedPencairan.updatedAt && selectedPencairan.status !== 'MENUNGGU' && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Waktu Diproses:</span>
                  <span className="font-semibold text-gray-700">
                    {new Date(selectedPencairan.updatedAt).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              {selectedPencairan.petugas?.nama && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Petugas / Admin Pencair:</span>
                  <span className="font-extrabold text-forest-900">
                    {selectedPencairan.petugas.nama}
                  </span>
                </div>
              )}
              {selectedPencairan.catatan && (
                <div className="pt-1">
                  <span className="text-gray-500">Catatan Pemohon:</span>
                  <p className="font-medium text-gray-800 italic mt-0.5 bg-gray-50 p-2 rounded-xl">
                    &quot;{selectedPencairan.catatan}&quot;
                  </p>
                </div>
              )}
              {selectedPencairan.catatanPetugas && (
                <div className="pt-1">
                  <span className="text-gray-500">Catatan Petugas:</span>
                  <p className="font-bold text-forest-900 mt-0.5 bg-forest-50 p-2 rounded-xl">
                    {selectedPencairan.catatanPetugas}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedPencairan(null)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
