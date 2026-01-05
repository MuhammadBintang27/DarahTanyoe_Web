import { RequestStatus, StatusInfo } from '@/types/bloodRequest';

export const STATUS_MAP: Record<RequestStatus, StatusInfo> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
  },
  approved: {
    label: 'Approved',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
  },
  in_fulfillment: {
    label: 'Fulfillment',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
  },
  pickup_scheduled: {
    label: 'Pickup Scheduled',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
  },
  rejected: {
    label: 'Reject',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
  },
  ready: {
    label: 'Ready',
    color: 'text-cyan-800',
    bgColor: 'bg-cyan-100',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
  },
  completed: {
    label: 'Completed',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-900',
    bgColor: 'bg-red-200',
  },
};

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type BloodType = typeof BLOOD_TYPES[number];
