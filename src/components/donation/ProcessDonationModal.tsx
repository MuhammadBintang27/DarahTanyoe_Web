'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { 
  getAllComponentTypes, 
  getComponentInfo, 
  formatComponentType, 
  getComponentBadgeClasses,
  ComponentType 
} from '@/utils/componentHelpers';

interface Donation {
  id: string;
  donation_date: string;
  blood_type: string;
  donor_id: string;
  institution_id: string;
  status: string;
  components_created: boolean;
  donor?: {
    id: string;
    name: string;
    phone?: string;
  };
}

interface ComponentInput {
  component_type: ComponentType;
  quantity: number | '';
  notes?: string;
}

interface ProcessDonationModalProps {
  isOpen: boolean;
  donation: Donation | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (components: ComponentInput[]) => void;
}

export const ProcessDonationModal: React.FC<ProcessDonationModalProps> = ({
  isOpen,
  donation,
  loading,
  onClose,
  onSubmit,
}) => {
  const [components, setComponents] = useState<ComponentInput[]>([
    { component_type: 'PRC', quantity: 1, notes: '' },
    { component_type: 'FFP', quantity: 1, notes: '' },
  ]);

  const [errors, setErrors] = useState<Record<number, string>>({});

  if (!isOpen || !donation) return null;

  const handleAddComponent = () => {
    setComponents([
      ...components,
      { component_type: 'WB', quantity: 1, notes: '' },
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    if (components.length === 1) {
      alert('Minimal harus ada 1 komponen');
      return;
    }
    setComponents(components.filter((_, i) => i !== index));
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const handleComponentChange = (
    index: number,
    field: keyof ComponentInput,
    value: any
  ) => {
    const newComponents = [...components];
    newComponents[index] = { ...newComponents[index], [field]: value };
    setComponents(newComponents);

    // Validate quantity
    if (field === 'quantity') {
      const newErrors = { ...errors };
      if (value === '' || value <= 0) {
        newErrors[index] = 'Jumlah harus lebih dari 0';
      } else {
        delete newErrors[index];
      }
      setErrors(newErrors);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      return;
    }

    // Convert any empty strings to valid numbers (though validation should prevent this)
    const validComponents = components.map(c => ({
      ...c,
      quantity: typeof c.quantity === 'number' ? c.quantity : 1
    }));

    onSubmit(validComponents);
  };

  const handleClose = () => {
    setComponents([
      { component_type: 'PRC', quantity: 1, notes: '' },
      { component_type: 'FFP', quantity: 1, notes: '' },
    ]);
    setErrors({});
    onClose();
  };

  const componentTypes = getAllComponentTypes();

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="p-5 border-b border-gray-200 shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Proses Donasi
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Pilih komponen darah yang akan dibuat dari donasi ini
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Donation Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 text-xs font-semibold">Donor:</span>
                <p className="font-bold text-gray-900">
                  {donation.donor?.name || 'Unknown'}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-xs font-semibold">Golongan Darah:</span>
                <p className="font-bold text-gray-900">
                  {donation.blood_type}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-xs font-semibold">Tanggal Donasi:</span>
                <p className="font-bold text-gray-900">
                  {new Date(donation.donation_date).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Component List */}
            {components.map((component, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-900">
                    Komponen #{index + 1}
                  </h4>
                  {components.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Component Type */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Jenis Komponen <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={component.component_type}
                      onChange={(e) =>
                        handleComponentChange(
                          index,
                          'component_type',
                          e.target.value as ComponentType
                        )
                      }
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    >
                      {componentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label} - {type.fullName}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {getComponentInfo(component.component_type).description}
                    </p>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Jumlah Unit <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={component.quantity}
                      onChange={(e) =>
                        handleComponentChange(
                          index,
                          'quantity',
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors ${
                        errors[index]
                          ? 'border-red-500 bg-red-50 border focus:border-red-500 focus:ring-red-500'
                          : 'bg-gray-50 border border-gray-300 text-gray-900 focus:border-primary focus:ring-primary'
                      }`}
                    />
                    {errors[index] && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors[index]}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      1 unit = 1 kantong darah
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Catatan (opsional)
                  </label>
                  <input
                    type="text"
                    value={component.notes || ''}
                    onChange={(e) =>
                      handleComponentChange(index, 'notes', e.target.value)
                    }
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="Catatan tambahan untuk komponen ini"
                  />
                </div>

                {/* Component Info Badge */}
                <div className="mt-3 flex items-center gap-2">
                  <span className={getComponentBadgeClasses(component.component_type)}>
                    {formatComponentType(component.component_type)}
                  </span>
                  <span className="text-xs text-gray-600">
                    Simpan: {getComponentInfo(component.component_type).storageTemp}
                  </span>
                </div>
              </div>
            ))}

            {/* Add Component Button */}
            <button
              type="button"
              onClick={handleAddComponent}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-primary hover:text-primary hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span className="font-semibold">Tambah Komponen</span>
            </button>
          </div>

          {/* Footer - Fixed */}
          <div className="p-5 border-t border-gray-200 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                Total komponen: <strong className="text-gray-900">{components.length}</strong>
              </div>
              <div className="text-sm text-gray-600">
                Total unit:{' '}
                <strong className="text-gray-900">
                  {components.reduce((sum, c) => sum + (c.quantity || 0), 0)}
                </strong>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Memproses...' : 'Proses Donasi'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
