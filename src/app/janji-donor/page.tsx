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
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="mb-2">
          <h2 className="font-bold text-3xl text-white">Janji Donor</h2>
          <p className="mt-2 text-lg text-white font-semibold">Kelola konfirmasi dan penyelesaian donasi</p>
        </div>

        {/* Quick Verify - PMI only */}
        {user?.institution_type === 'pmi' && (
          <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">Verifikasi Cepat</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="Masukkan kode unik (contoh: DN2602110907)"
                className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors uppercase tracking-wider font-mono text-lg font-bold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-2">Ketik tepat kode unik untuk membuka verifikasi/penyelesaian otomatis</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-2 flex gap-2 border border-gray-200">
          {([
            { key: 'all', label: 'Semua' },
            { key: 'confirmed', label: 'Terkonfirmasi' },
            { key: 'code_verified', label: 'Kode Diverifikasi' },
            { key: 'completed', label: 'Selesai' },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                tab === t.key ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat data...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
            <p className="text-gray-900 text-lg font-bold mb-2">Tidak ada data</p>
            <p className="text-gray-600 text-sm">Data akan muncul ketika ada Janji Donor masuk</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((it) => (
              <div key={it.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{it.donor?.full_name || 'Pendonor'}</h3>
                      <span className={statusBadge(it.status)}>{it.status === 'code_verified' ? 'Kode Diverifikasi' : it.status === 'confirmed' ? 'Terkonfirmasi' : it.status === 'completed' ? 'Selesai' : it.status}</span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">ID: {it.id.substring(0, 8)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="text-xs text-primary font-semibold">{it.donor?.blood_type || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  {user?.institution_type !== 'pmi' && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Kode</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{it.unique_code || '-'}</span>
                        {it.unique_code && (
                          <button onClick={() => copyCode(it.unique_code)} className="text-gray-500 hover:text-gray-700"><Copy size={16} /></button>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Kadaluarsa</p>
                    <p className="text-sm text-gray-900">{it.code_expires_at ? new Date(it.code_expires_at).toLocaleString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Dibuat</p>
                    <p className="text-sm text-gray-900">{new Date(it.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setVerifyForId(it.id); setVerifyCode(''); }}
                    disabled={it.status !== 'confirmed'}
                    className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 border transition-all ${
                      it.status === 'confirmed' ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle size={18} /> Verifikasi Kode
                  </button>

                  <button
                    onClick={() => { setCompleteForId(it.id); setVolumeMl('450'); setNotes(''); }}
                    disabled={it.status !== 'code_verified'}
                    className={`px-4 py-2 rounded-lg font-semibold border transition-all ${
                      it.status === 'code_verified' ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    Selesaikan Donasi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
        )}
      </div>

      {/* Modal Verifikasi Kode */}
      {verifyForId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Verifikasi Kode</h3>
              <button onClick={() => setVerifyForId(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            {/* Donor Info */}
            {(() => {
              const selected = items.find(x => x.id === verifyForId);
              if (!selected) return null;
              return (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pendonor</p>
                      <p className="text-sm text-gray-900 font-medium">{selected.donor?.full_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Golongan Darah</p>
                      <p className="text-sm text-gray-900 font-medium">{selected.donor?.blood_type || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Telepon</p>
                      <p className="text-sm text-gray-900 font-medium">{selected.donor?.phone_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Dibuat</p>
                      <p className="text-sm text-gray-900 font-medium">{new Date(selected.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Kode Unik</label>
              <input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                placeholder="Masukkan kode unik (contoh: DN2602110907)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase tracking-wider font-mono text-lg"
              />
              <p className="mt-2 text-gray-500 text-xs">Minta kode dari pendonor untuk verifikasi</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setVerifyForId(null)} className="flex-1 px-4 py-2.5 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg font-medium">Batal</button>
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
                    toast.success('Kode berhasil diverifikasi');
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || e.message || 'Verifikasi gagal');
                  }
                }}
                disabled={!verifyCode}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium disabled:opacity-50"
              >
                Verifikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Selesaikan Donasi */}
      {completeForId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Selesaikan Donasi</h3>
              <button onClick={() => setCompleteForId(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Kantong</label>
              <input
                type="number"
                min={1}
                value={volumeMl}
                onChange={(e) => setVolumeMl(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setCompleteForId(null)} className="flex-1 px-4 py-2.5 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg font-medium">Batal</button>
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
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium"
              >
                Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
