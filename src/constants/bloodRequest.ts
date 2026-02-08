import { RequestStatus, StatusInfo } from '@/types/bloodRequest';

export const STATUS_MAP: Record<RequestStatus, StatusInfo> = {
  pending: {
    label: 'Menunggu',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
  },
  approved: {
    label: 'Disetujui',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
  },
  in_fulfillment: {
    label: 'Dalam Pemenuhan',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
  },
  pickup_scheduled: {
    label: 'Jadwal Pickup',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
  },
  rejected: {
    label: 'Ditolak',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
  },
  ready: {
    label: 'Siap',
    color: 'text-cyan-800',
    bgColor: 'bg-cyan-100',
  },
  confirmed: {
    label: 'Dikonfirmasi',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
  },
  completed: {
    label: 'Selesai',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'text-red-900',
    bgColor: 'bg-red-200',
  },
};

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type BloodType = typeof BLOOD_TYPES[number];

// Status options for filter dropdown
export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'in_fulfillment', label: 'Dalam Pemenuhan' },
  { value: 'pickup_scheduled', label: 'Jadwal Pickup' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'ready', label: 'Siap' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
] as const;
