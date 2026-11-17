/**
 * Menghasilkan nomor transaksi unik dengan format:
 * TRX-YYYYMMDD-XXXX (contoh: TRX-20261117-8942)
 */
export const generateNomorTransaksi = (): string => {
  const date = new Date();
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();

  return `TRX-${yyyy}${mm}${dd}-${randomSuffix}`;
};

