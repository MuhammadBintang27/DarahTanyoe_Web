import { Filter, RotateCcw } from 'lucide-react';
import { FilterState } from '@/types/bloodRequest';
import { BLOOD_TYPES } from '@/constants/bloodRequest';

interface FilterSectionProps {
  filters: FilterState;
  partners: Array<{ id: string; name: string }>;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  partners,
  onFilterChange,
  onReset,
}) => {
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
          className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          value={filters.date}
          onChange={(e) => onFilterChange({ ...filters, date: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-600 font-medium">Gol. Darah</label>
        <select
          className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-w-[120px]"
          value={filters.bloodType}
          onChange={(e) => onFilterChange({ ...filters, bloodType: e.target.value })}
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
        <label className="text-xs text-gray-600 font-medium">Lokasi</label>
        <select
          className="border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent min-w-[150px]"
          value={filters.location}
          onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
        >
          <option value="">Semua Lokasi</option>
          {partners.map((partner) => (
            <option key={partner.id} value={partner.name}>
              {partner.name}
            </option>
          ))}
        </select>
      </div>

      <button
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex gap-2 items-center transition-colors ml-auto"
        onClick={onReset}
      >
        <RotateCcw size={16} />
        <span className="text-sm font-medium">Reset Filter</span>
      </button>
    </div>
  );
};
