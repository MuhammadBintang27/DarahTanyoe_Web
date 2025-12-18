import { useState } from 'react';

interface RejectModalProps {
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  loading,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Tolak Permintaan</h3>
        <p className="text-sm text-gray-600 mb-4">
          Masukkan alasan penolakan permintaan darah ini:
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Contoh: Stok darah tidak tersedia..."
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
        />
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={() => {
              onClose();
              setReason('');
            }}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || loading}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Memproses...' : 'Tolak Permintaan'}
          </button>
        </div>
      </div>
    </div>
  );
};
