import { Filter, RotateCcw } from 'lucide-react';
import { FilterState } from '@/types/bloodRequest';
import { BLOOD_TYPES, STATUS_OPTIONS } from '@/constants/bloodRequest';

interface FilterSectionProps {
  filters: FilterState;
  partners: Array<{ id: string; name: string }>;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  disabled?: boolean;
  userRole?: 'hospital' | 'pmi';
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  partners,
  onFilterChange,
  onReset,
  disabled = false,
  userRole = 'hospital',
}) => {
  // Determine label based on user role
  const locationLabel = userRole === 'hospital' ? 'PMI Tujuan' : 'Rumah Sakit';
  
  return (
    <div className="flex gap-4 flex-wrap bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 items-center">
      <div className="flex items-center gap-2">
        <Filter size={20} className="text-primary" />
        <span className="font-semibold text-gray-700">Filter By:</span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-600 font-medium">Tanggal</label>
        <input
          type="date"
          className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={filters.date}
          onChange={(e) => onFilterChange({ ...filters, date: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-600 font-medium">Gol. Darah</label>
        <select
          className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-w-[120px] disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={filters.bloodType}
          onChange={(e) => onFilterChange({ ...filters, bloodType: e.target.value })}
          disabled={disabled}
        >
          <option value="">Semua</option>
          {BLOOD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-600 font-medium">Status</label>
        <select
          className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-w-[140px] disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={filters.status || ''}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value as any })}
          disabled={disabled}
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-600 font-medium">{locationLabel}</label>
        <select
          className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-w-[150px] disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={filters.location}
          onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
          disabled={disabled}
        >
          <option value="">Semua {locationLabel}</option>
          {partners.map((partner) => (
            <option key={partner.id} value={partner.id}>
              {partner.name}
            </option>
          ))}
        </select>
      </div>

      <button
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex gap-2 items-center transition-colors ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onReset}
        disabled={disabled}
      >
        <RotateCcw size={16} />
        <span className="text-sm font-medium">Reset Filter</span>
      </button>
    </div>
  );
};
