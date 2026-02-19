/**
 * Blood Component Utilities
 * Provides metadata and helper functions for blood component management
 */

export type ComponentType = 'WB' | 'PRC' | 'FFP' | 'TC' | 'Cryo';

export interface ComponentInfo {
  value: ComponentType;
  label: string;
  fullName: string;
  description: string;
  shelfLifeDays: number;
  storageTemp: string;
  color: string;
  bgColor: string;
  icon: string;
  volumeRange: string;
}

export const COMPONENT_TYPES: Record<ComponentType, ComponentInfo> = {
  WB: {
    value: 'WB',
    label: 'WB',
    fullName: 'Whole Blood',
    description: 'Darah utuh lengkap dengan semua komponen',
    shelfLifeDays: 35,
    storageTemp: '2-6°C',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: '🩸',
    volumeRange: '350-500 ml',
  },
  PRC: {
    value: 'PRC',
    label: 'PRC',
    fullName: 'Packed Red Cells',
    description: 'Sel darah merah pekat untuk anemia & kehilangan darah',
    shelfLifeDays: 35,
    storageTemp: '2-6°C',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: '🔴',
    volumeRange: '200-300 ml',
  },
  FFP: {
    value: 'FFP',
    label: 'FFP',
    fullName: 'Fresh Frozen Plasma',
    description: 'Plasma beku untuk faktor pembekuan darah',
    shelfLifeDays: 365,
    storageTemp: '-18°C atau lebih rendah',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: '❄️',
    volumeRange: '200-300 ml',
  },
  TC: {
    value: 'TC',
    label: 'TC',
    fullName: 'Thrombocyte Concentrate',
    description: 'Konsentrat trombosit untuk gangguan pembekuan',
    shelfLifeDays: 5,
    storageTemp: '20-24°C dengan agitasi',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    icon: '🟡',
    volumeRange: '50-80 ml',
  },
  Cryo: {
    value: 'Cryo',
    label: 'Cryo',
    fullName: 'Cryoprecipitate',
    description: 'Kriopresipitat untuk hemofilia & fibrinogen',
    shelfLifeDays: 365,
    storageTemp: '-18°C atau lebih rendah',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    icon: '💜',
    volumeRange: '10-20 ml',
  },
};

/**
 * Get component information by type
 */
export const getComponentInfo = (componentType: ComponentType): ComponentInfo => {
  return COMPONENT_TYPES[componentType] || COMPONENT_TYPES.WB;
};

/**
 * Get all component types as array
 */
export const getAllComponentTypes = (): ComponentInfo[] => {
  return Object.values(COMPONENT_TYPES);
};

/**
 * Calculate expiry date based on component type and collection date
 */
export const calculateExpiryDate = (
  componentType: ComponentType,
  collectionDate: Date | string
): Date => {
  const collection = typeof collectionDate === 'string' 
    ? new Date(collectionDate) 
    : collectionDate;
  
  const info = getComponentInfo(componentType);
  const expiryDate = new Date(collection);
  expiryDate.setDate(expiryDate.getDate() + info.shelfLifeDays);
  
  return expiryDate;
};

/**
 * Get default components created from a donation
 * This is a helper for the processing form
 */
export const getDefaultComponents = (bloodType: string) => {
  // Default components that can be created from a single donation
  return [
    {
      component_type: 'PRC' as ComponentType,
      volume_ml: 250,
      notes: 'Sel darah merah dari donor',
    },
    {
      component_type: 'FFP' as ComponentType,
      volume_ml: 200,
      notes: 'Plasma dari donor',
    },
  ];
};

/**
 * Format component type for display
 */
export const formatComponentType = (componentType: ComponentType): string => {
  const info = getComponentInfo(componentType);
  return `${info.icon} ${info.label} - ${info.fullName}`;
};

/**
 * Get component badge classes
 */
export const getComponentBadgeClasses = (componentType: ComponentType): string => {
  const info = getComponentInfo(componentType);
  return `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${info.color} ${info.bgColor}`;
};

/**
 * Check if component needs frozen storage
 */
export const requiresFrozenStorage = (componentType: ComponentType): boolean => {
  return componentType === 'FFP' || componentType === 'Cryo';
};

/**
 * Check if component is short shelf life (< 7 days)
 */
export const isShortShelfLife = (componentType: ComponentType): boolean => {
  const info = getComponentInfo(componentType);
  return info.shelfLifeDays < 7;
};

/**
 * Get storage requirement icon
 */
export const getStorageIcon = (componentType: ComponentType): string => {
  return requiresFrozenStorage(componentType) ? '❄️' : '🌡️';
};

/**
 * Format volume display
 */
export const formatVolume = (volumeMl: number): string => {
  return `${volumeMl} ml`;
};

/**
 * Validate component volume
 */
export const validateComponentVolume = (
  componentType: ComponentType,
  volumeMl: number
): { valid: boolean; message?: string } => {
  const info = getComponentInfo(componentType);
  const [min, max] = info.volumeRange.split('-').map(v => parseInt(v));
  
  if (volumeMl < min) {
    return {
      valid: false,
      message: `Volume terlalu kecil. Minimal ${min} ml untuk ${info.label}`,
    };
  }
  
  if (volumeMl > max) {
    return {
      valid: false,
      message: `Volume terlalu besar. Maksimal ${max} ml untuk ${info.label}`,
    };
  }
  
  return { valid: true };
};

/**
 * Get component type from label (case insensitive)
 */
export const getComponentTypeFromLabel = (label: string): ComponentType | null => {
  const upperLabel = label.toUpperCase();
  const found = Object.values(COMPONENT_TYPES).find(
    c => c.label.toUpperCase() === upperLabel || c.value.toUpperCase() === upperLabel
  );
  return found ? found.value : null;
};
