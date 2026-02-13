'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/authContext';
import { janjiDonorApi, JanjiDonorConfirmation } from '@/utils/api/janjiDonor';
import ProtectedRoute from '@/components/protectedRoute/protectedRoute';
import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle, Copy, X } from 'lucide-react';

type Tab = 'all' | 'confirmed' | 'code_verified' | 'completed';

export default function JanjiDonorPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<JanjiDonorConfirmation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyForId, setVerifyForId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [completeForId, setCompleteForId] = useState<string | null>(null);
  const [volumeMl, setVolumeMl] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');

  const statusFilter = useMemo(() => (tab === 'all' ? undefined : tab), [tab]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await janjiDonorApi.list(user.id, statusFilter);
      setItems(data);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat konfirmasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, statusFilter]);

  // Quick actions: auto buka modal Verifikasi atau Selesaikan bila kode cocok
  useEffect(() => {
    if (user?.institution_type !== 'pmi') return;
    const upper = searchQuery.trim().toUpperCase();
    if (!upper) return;
    const matches = items.filter((it) => it.unique_code?.toUpperCase() === upper);
    if (matches.length === 1) {
      const it = matches[0];
      if (it.status === 'confirmed') {
        setVerifyForId(it.id);
        setVerifyCode(upper);
      } else if (it.status === 'code_verified') {
        setCompleteForId(it.id);
        setVolumeMl('1');
        setNotes('');
      } else if (it.status === 'completed') {
        toast.success('Donasi sudah selesai');
      } else if (it.status === 'expired') {
        toast.error('Kode sudah kadaluarsa');
      } else {
        toast.error(`Status saat ini: ${it.status}`);
      }
    }
  }, [searchQuery, items, user?.institution_type]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((it) => {
      if (!q) return true;
      const donor = it.donor?.full_name?.toLowerCase() || '';
      const code = (it.unique_code || '').toLowerCase();
      return donor.includes(q) || code.includes(q);
    });
  }, [items, searchQuery]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
      code_verified: 'bg-amber-50 text-amber-700 border-amber-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-gray-50 text-gray-700 border-gray-200',
      expired: 'bg-red-50 text-red-700 border-red-200',
    };
    return `px-3 py-1 rounded-lg text-xs font-semibold border ${map[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`;
  };

  const copyCode = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success('Kode disalin');
  };

  return (
    <ProtectedRoute>
      <Toaster position="top-right" />
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Janji Donor</h2>
          <p className="text-white/90">Kelola konfirmasi dan penyelesaian donasi darah</p>
        </div>

        {/* Quick Verify - PMI only */}
        {user?.institution_type === 'pmi' && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Verifikasi Cepat</h3>
                <p className="text-sm text-gray-600">Masukkan kode unik untuk verifikasi otomatis</p>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="Contoh: DN2602110907"
                className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-wider font-mono text-lg font-semibold"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              ) : (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ketik kode unik untuk membuka verifikasi/penyelesaian otomatis
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md p-2 flex gap-2 border border-gray-200 mb-6">
          {([
            { key: 'all', label: 'Semua' },
            { key: 'confirmed', label: 'Terkonfirmasi' },
            { key: 'code_verified', label: 'Kode Diverifikasi' },
            { key: 'completed', label: 'Selesai' },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                tab === t.key ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat data...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada data</h3>
            <p className="text-gray-600 text-sm">Data akan muncul ketika ada Janji Donor masuk</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((it) => (
              <div key={it.id} className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{it.donor?.full_name || 'Pendonor'}</h3>
                    <span className={statusBadge(it.status)}>
                      {it.status === 'code_verified' ? 'Kode Diverifikasi' : it.status === 'confirmed' ? 'Terkonfirmasi' : it.status === 'completed' ? 'Selesai' : it.status === 'expired' ? 'Kedaluwarsa' : it.status}
                    </span>
                  </div>

                  <div className="px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="text-sm font-bold text-primary">{it.donor?.blood_type || '-'}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {user?.institution_type !== 'pmi' && (
                    <div className="flex items-center gap-2 text-xs">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="text-gray-600">Kode:</span>
                      <span className="font-mono font-semibold text-gray-900">{it.unique_code || '-'}</span>
                      {it.unique_code && (
                        <button onClick={() => copyCode(it.unique_code)} className="text-gray-400 hover:text-gray-600 transition-colors">
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Kadaluarsa: {it.code_expires_at ? new Date(it.code_expires_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Dibuat: {new Date(it.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  {it.status === 'confirmed' && (
                    <button
                      onClick={() => { setVerifyForId(it.id); setVerifyCode(''); }}
                      className="w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle size={16} /> Verifikasi Kode
                    </button>
                  )}
                  
                  {it.status === 'code_verified' && (
                    <button
                      onClick={() => { setCompleteForId(it.id); setVolumeMl('1'); setNotes(''); }}
                      className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-green-500 hover:bg-green-600 text-white"
                    >
                      Selesaikan Donasi
                    </button>
                  )}
                  
                  {it.status === 'completed' && (
                    <div className="text-center py-2 px-3 rounded-lg bg-gray-100 border border-gray-200">
                      <span className="text-sm font-medium text-gray-600">✓ Donasi Selesai</span>
                    </div>
                  )}
                  
                  {it.status === 'expired' && (
                    <div className="text-center py-2 px-3 rounded-lg bg-red-50 border border-red-200">
                      <span className="text-sm font-medium text-red-600">Kode Kedaluwarsa</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>

      {/* Modal Verifikasi Kode */}
      {verifyForId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Verifikasi Kode</h3>
                  <p className="text-sm text-gray-600 mt-1">Masukkan kode unik dari pendonor</p>
                </div>
                <button onClick={() => setVerifyForId(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              {/* Donor Info */}
              {(() => {
                const selected = items.find(x => x.id === verifyForId);
                if (!selected) return null;
                return (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Pendonor</span>
                      <span className="text-sm font-bold text-gray-900">{selected.donor?.full_name || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">No. Telepon</span>
                      <span className="text-sm font-semibold text-gray-900">{selected.donor?.phone_number || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Golongan Darah</span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
                        {selected.donor?.blood_type || '—'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Form Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Kode Unik <span className="text-red-500">*</span>
                </label>
                <input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: DN2602110907"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase tracking-wider font-mono text-lg font-semibold"
                  autoFocus
                />
                <p className="mt-2 text-gray-500 text-xs flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Minta kode dari pendonor untuk verifikasi
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button 
                onClick={() => setVerifyForId(null)} 
                className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 text-sm font-medium bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!user?.id) { toast.error('PMI tidak dikenali'); return; }
                    const res = await janjiDonorApi.verify(verifyCode, user.id);
                    if (res?.ok === false) {
                      toast.error(res?.message || 'Verifikasi gagal');
                      return;
                    }
                    const updatedId = res?.data?.id || verifyForId;
                    setItems((prev) => prev.map((x) => x.id === updatedId ? { ...x, status: 'code_verified' } as JanjiDonorConfirmation : x));
                    setVerifyForId(null);
                    setSearchQuery(''); // Clear search to prevent auto-opening complete modal
                    toast.success('Kode berhasil diverifikasi');
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || e.message || 'Verifikasi gagal');
                  }
                }}
                disabled={!verifyCode}
                className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verifikasi Kode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Selesaikan Donasi */}
      {completeForId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Selesaikan Donasi</h3>
                  <p className="text-sm text-gray-600 mt-1">Lengkapi informasi donasi darah</p>
                </div>
                <button onClick={() => setCompleteForId(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              {/* Donor Info */}
              {(() => {
                const selected = items.find(x => x.id === completeForId);
                if (!selected) return null;
                return (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Pendonor</span>
                      <span className="text-sm font-bold text-gray-900">{selected.donor?.full_name || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">No. Telepon</span>
                      <span className="text-sm font-semibold text-gray-900">{selected.donor?.phone_number || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Golongan Darah</span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
                        {selected.donor?.blood_type || '—'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Jumlah Kantong Darah <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Contoh: 1"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Catatan Tambahan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Catatan tentang proses donasi..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button 
                onClick={() => setCompleteForId(null)} 
                className="flex-1 px-4 py-2.5 rounded-lg text-gray-700 text-sm font-medium bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!user?.id) { toast.error('PMI tidak dikenali'); return; }
                    const qty = volumeMl ? parseInt(volumeMl, 10) : 0;
                    const res = await janjiDonorApi.complete(completeForId!, { quantity: isNaN(qty) ? 0 : qty, notes }, user.id);
                    if (res?.ok === false) {
                      toast.error(res?.message || 'Gagal menyelesaikan donasi');
                      return;
                    }
                    setItems((prev) => prev.map((x) => x.id === completeForId ? { ...x, status: 'completed' } as JanjiDonorConfirmation : x));
                    setCompleteForId(null);
                    toast.success('Donasi diselesaikan');
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || e.message || 'Gagal menyelesaikan donasi');
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium bg-green-500 hover:bg-green-600 transition-colors"
              >
                Selesaikan Donasi
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
