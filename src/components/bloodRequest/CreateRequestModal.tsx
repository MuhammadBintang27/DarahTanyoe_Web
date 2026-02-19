import { useState } from 'react';
import { CreateRequestForm, Partner } from '@/types/bloodRequest';
import { BLOOD_TYPES } from '@/constants/bloodRequest';

interface CreateRequestModalProps {
  isOpen: boolean;
  loading: boolean;
  partners: Partner[];
  onClose: () => void;
  onSubmit: (formData: CreateRequestForm) => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  loading,
  partners,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateRequestForm>({
    patient_name: '',
    blood_type: '',
    quantity: 1,
    partner_id: '',
    phone_number: '',
    medical_condition: '',
    notes: '',
    urgency_level: 'medium',
    unit_type: 'kantong',
    // Medical fields
    patient_nik: '',
    patient_birth_date: '',
    patient_gender: 'Laki-laki',
    prescribing_doctor: '',
    doctor_license: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    onClose();
    setFormData({
      patient_name: '',
      blood_type: '',
      quantity: 1,
      partner_id: '',
      phone_number: '',
      medical_condition: '',
      notes: '',
      urgency_level: 'medium',
      unit_type: 'kantong',
      // Medical fields
      patient_nik: '',
      patient_birth_date: '',
      patient_gender: 'Laki-laki',
      prescribing_doctor: '',
      doctor_license: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-2xl font-bold text-gray-900">
            Buat Permintaan Darah Baru
          </h3>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4" id="create-request-form">

          {/* Patient Identity Section */}
          <div className="">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              Data Identitas Pasien
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Pasien <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.patient_name}
                onChange={(e) =>
                  setFormData({ ...formData, patient_name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Masukkan nama pasien"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Telepon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  pattern="[0-9]{16}"
                  value={formData.patient_nik}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only numbers
                    setFormData({ ...formData, patient_nik: value });
                  }}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="16 digit NIK pasien"
                />
                {formData.patient_nik && formData.patient_nik.length !== 16 && (
                  <p className="text-xs text-red-500 mt-1">NIK harus 16 digit ({formData.patient_nik.length}/16)</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.patient_birth_date}
                  onChange={(e) =>
                    setFormData({ ...formData, patient_birth_date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.patient_gender}
                  onChange={(e) =>
                    setFormData({ ...formData, patient_gender: e.target.value as 'Laki-laki' | 'Perempuan' })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Doctor Information Section */}
          <div className="pt-2 mt-2">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
               Data Dokter Penanggung Jawab
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Dokter <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.prescribing_doctor}
                  onChange={(e) =>
                    setFormData({ ...formData, prescribing_doctor: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Dr. Nama Dokter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. SIP/STR <span className="text-gray-400 text-xs">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={formData.doctor_license}
                  onChange={(e) =>
                    setFormData({ ...formData, doctor_license: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nomor izin praktik"
                />
              </div>
            </div>
          </div>

          {/* Blood Request Details */}
          <div className="pt-2 mt-2">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
             Detail Permintaan Darah
            </h4>
           </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Golongan Darah <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.blood_type}
                onChange={(e) =>
                  setFormData({ ...formData, blood_type: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Pilih Golongan Darah</option>
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah Kantong <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi PMI <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.partner_id}
                onChange={(e) =>
                  setFormData({ ...formData, partner_id: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Pilih PMI</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tingkat Urgensi <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.urgency_level}
                onChange={(e) =>
                  setFormData({ ...formData, urgency_level: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })
                }
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
                <option value="urgent">Mendesak</option>
              </select>
            </div>
          </div>

          {/* Medical Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kondisi Medis <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.medical_condition}
              onChange={(e) =>
                setFormData({ ...formData, medical_condition: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px]"
              placeholder="Jelaskan kondisi medis pasien..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan Tambahan
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px]"
              placeholder="Catatan atau informasi tambahan (opsional)..."
            />
          </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              form="create-request-form"
              disabled={loading}
              className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Memproses...' : 'Buat Permintaan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
