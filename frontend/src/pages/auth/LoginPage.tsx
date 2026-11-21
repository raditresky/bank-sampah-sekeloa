import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  Users,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Scale,
  Wallet,
  CheckCircle,
} from 'lucide-react';
import { UserRole } from '../../types';
import { AppLogo } from '../../components/common/AppLogo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // Mode: Petugas RW vs Warga / Nasabah
  const [selectedRole, setSelectedRole] = useState<'PETUGAS' | 'WARGA'>('PETUGAS');
  // Sub-mode: Masuk (Login) vs Daftar Baru (Register)
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  // Form State
  const [nomorHp, setNomorHp] = useState<string>('081234567890');
  const [password, setPassword] = useState<string>('password123');
  const [nama, setNama] = useState<string>('');
  const [rw, setRw] = useState<string>('RW 08');
  const [rt, setRt] = useState<string>('RT 01');
  const [kodeAksesPengurus, setKodeAksesPengurus] = useState<string>('SEKELOA_JUARA_2026');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleTabChange = (role: 'PETUGAS' | 'WARGA') => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'PETUGAS') {
      setIsRegisterMode(false);
      setNomorHp('081234567890');
      setPassword('password123');
    } else {
      if (!isRegisterMode) {
        setNomorHp('089876543210');
        setPassword('password123');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      // Normalisasi nomor HP: bersihkan spasi, tanda strip, dan sesuaikan prefix
      let cleanNomorHp = nomorHp.trim().replace(/[\s-]/g, '');
      if (cleanNomorHp.startsWith('+62')) {
        cleanNomorHp = '0' + cleanNomorHp.substring(3);
      } else if (cleanNomorHp.startsWith('62')) {
        cleanNomorHp = '0' + cleanNomorHp.substring(2);
      } else if (!cleanNomorHp.startsWith('0') && cleanNomorHp.length > 0) {
        cleanNomorHp = '0' + cleanNomorHp;
      }

      if (isRegisterMode) {
        const assignedRole: UserRole =
          selectedRole === 'PETUGAS' ? 'ADMIN_RW' : 'WARGA';

        await register({
          nama,
          nomorHp: cleanNomorHp,
          password,
          rw,
          rt: rt || undefined,
          unitBankSampah: selectedRole === 'PETUGAS' ? `Unit Pos ${rw}` : undefined,
          role: assignedRole,
          kodeAksesPengurus: selectedRole === 'PETUGAS' ? kodeAksesPengurus : undefined,
        });
      } else {
        await login({
          nomorHp: cleanNomorHp,
          password,
        });
      }

      navigate('/');
    } catch (err: any) {
      console.error(err);
      const validationDetails = Array.isArray(err.response?.data?.error)
        ? err.response.data.error.map((e: any) => e.message).join('. ')
        : null;

      setErrorMessage(
        validationDetails ||
          err.response?.data?.message ||
          'Terjadi kesalahan saat memproses data. Silakan coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 flex flex-col justify-between p-4 selection:bg-forest-100">
      <div className="w-full pt-4">
        {/* App Logo & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <AppLogo size="lg" showCheckmark={true} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Sampiah</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Sampah jadi Rupiah
          </p>
        </div>

        {/* Dual Tab Role Selector (Admin RW vs Warga) */}
        <div className="bg-gray-200/80 p-1.5 rounded-2xl flex space-x-1 mb-5">
          <button
            type="button"
            onClick={() => handleRoleTabChange('PETUGAS')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              selectedRole === 'PETUGAS'
                ? 'bg-white text-forest-950 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-forest-800" />
            <span>Admin RW</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleTabChange('WARGA')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              selectedRole === 'WARGA'
                ? 'bg-white text-forest-950 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 text-forest-800" />
            <span>Warga / Nasabah</span>
          </button>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          {/* Mode Banner Info Box */}
          <div className="bg-forest-50 border border-forest-100 rounded-2xl p-3.5 mb-5 flex items-start space-x-2.5">
            <span className="p-1 rounded-lg bg-forest-200 text-forest-800 flex-shrink-0 mt-0.5">
              {selectedRole === 'PETUGAS' ? (
                <Briefcase className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </span>
            <div>
              <p className="text-xs font-bold text-forest-900">
                {selectedRole === 'PETUGAS' ? 'Mode Admin RW' : 'Mode Warga / Nasabah'}
              </p>
              <p className="text-[11px] text-forest-700 leading-relaxed mt-0.5">
                {selectedRole === 'PETUGAS'
                  ? 'Gunakan akun Admin RW untuk operasional penimbangan, pencairan tabungan, dan kelola pos.'
                  : 'Gunakan akun warga untuk melihat buku tabungan, struk digital, dan kartu QR nasabah.'}
              </p>
            </div>
          </div>

          {/* Toggle Masuk vs Daftar Baru */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <span className="text-xs font-bold text-gray-800">
              {isRegisterMode ? 'Form Pendaftaran Baru' : 'Masuk ke Akun Anda'}
            </span>
            {selectedRole === 'WARGA' && (
              <button
                type="button"
                onClick={() => {
                  const nextMode = !isRegisterMode;
                  setIsRegisterMode(nextMode);
                  setErrorMessage(null);
                  if (nextMode) {
                    setNama('');
                    setNomorHp('');
                    setPassword('');
                  } else {
                    setNomorHp('089876543210');
                    setPassword('password123');
                  }
                }}
                className="text-xs font-bold text-forest-700 hover:text-forest-900 transition"
              >
                {isRegisterMode ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
              </button>
            )}
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start space-x-2 text-red-700 text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Input Nama Lengkap (Khusus Register) */}
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-900 focus:bg-white transition"
                />
              </div>
            )}

            {/* Input RW & RT (Khusus Register) */}
            {isRegisterMode && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">RW</label>
                  <select
                    value={rw}
                    onChange={(e) => setRw(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-900 focus:bg-white transition"
                  >
                    {Array.from({ length: 15 }, (_, i) => {
                      const num = String(i + 1).padStart(2, '0');
                      return (
                        <option key={num} value={`RW ${num}`}>
                          RW {num}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    RT (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: RT 03"
                    value={rt}
                    onChange={(e) => setRt(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest-900 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            {/* Kolom Mitigasi Keamanan: KODE AKSES PENGURUS (Wajib untuk Register Petugas) */}
            {isRegisterMode && selectedRole === 'PETUGAS' && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold text-amber-900 flex items-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kode Akses Pengurus</span>
                  </label>
                  <span className="text-[10px] font-semibold text-amber-700">Wajib Petugas</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Masukkan kode rahasia RW"
                  value={kodeAksesPengurus}
                  onChange={(e) => setKodeAksesPengurus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
                <p className="text-[10px] text-amber-700 mt-1">
                  Kode ini diberikan oleh Ketua RW / Koordinator (Default Demo: <span className="font-mono font-bold">SEKELOA_JUARA_2026</span>).
                </p>
              </div>
            )}

            {/* Nomor HP / WhatsApp */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700">Nomor WhatsApp / HP</label>
                <span className="text-[10px] text-gray-400">Format: 08...</span>
              </div>
              <div className="flex rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-forest-900 focus-within:bg-white transition overflow-hidden">
                <span className="px-3 py-2.5 bg-gray-100 text-gray-500 font-bold text-xs border-r border-gray-200 flex items-center">
                  +62
                </span>
                <input
                  type="tel"
                  required
                  placeholder="812-3456-7890"
                  value={nomorHp.replace(/^(\+62|0)/, '')}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.startsWith('62')) {
                      val = val.substring(2);
                    }
                    val = val.replace(/^0+/, '');
                    setNomorHp(val ? '0' + val : '');
                  }}
                  className="w-full px-3 py-2.5 bg-transparent text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            {/* Kata Sandi / PIN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700">Kata Sandi / PIN</label>
              </div>
              <div className="relative rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-forest-900 focus-within:bg-white transition">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 bg-transparent text-xs font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-forest-900 focus:ring-forest-900 w-4 h-4"
                />
                <span className="text-xs text-gray-600 font-medium">Ingat Sesi di Perangkat</span>
              </label>
              {!isRegisterMode && (
                <button
                  type="button"
                  onClick={() => alert('Fitur reset password dapat menghubungi petugas pos RW Anda.')}
                  className="text-xs text-forest-700 font-semibold hover:underline"
                >
                  Lupa Sandi?
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-forest-900 hover:bg-forest-950 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-4 active:scale-[0.98]"
            >
              <span>
                {loading
                  ? 'Memproses...'
                  : isRegisterMode
                  ? `Daftar Sebagai ${selectedRole === 'PETUGAS' ? 'Petugas RW' : 'Warga'}`
                  : `Masuk Sebagai ${selectedRole === 'PETUGAS' ? 'Petugas' : 'Warga'}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="text-center py-2 text-[10px] text-gray-400">
        <p className="font-semibold text-gray-500">
          Didukung oleh Kelurahan Sekeloa & DLH Kota Bandung
        </p>
        <p className="mt-0.5">PWA Version 1.0 (React + TypeScript + Express + MySQL)</p>
      </footer>
    </div>
  );
};

