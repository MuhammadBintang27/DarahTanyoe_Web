import React, { useState } from 'react';

interface CodeVerificationFormProps {
  onVerify: (code: string) => Promise<void>;
  loading?: boolean;
}

export default function CodeVerificationForm({
  onVerify,
  loading = false,
}: CodeVerificationFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || code.length < 12) {
      setError('Kode tidak valid');
      return;
    }

    try {
      await onVerify(code);
      setCode('');
    } catch (err: any) {
      setError(err.message || 'Verifikasi gagal');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Verifikasi Kode Donor</h3>

      <div className="mb-4">
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
          Kode Unik Pendonor
        </label>
        <input
          type="text"
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="DN2601051473"
          maxLength={12}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Format: DNYYMMDDHHRR (contoh: DN2601051473 = DN + 26-01-05 Jam 14 + Random 73)
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !code}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Memverifikasi...
          </span>
        ) : (
          'Verifikasi Kode'
        )}
      </button>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Cara Verifikasi:</h4>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>Minta pendonor menunjukkan kode unik mereka</li>
          <li>Masukkan kode 12 digit (format: DNYYMMDDHHRR)</li>
          <li>Klik tombol Verifikasi Kode</li>
          <li>Sistem akan memvalidasi kode dan menampilkan data pendonor</li>
        </ol>
      </div>
    </form>
  );
}
