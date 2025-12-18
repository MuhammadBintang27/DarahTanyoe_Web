// Types for Blood Request
export interface BloodRequest {
  id: string;
  patient_name: string;
  blood_type: string;
  quantity: number;
  blood_bags_fulfilled: number;
  created_at: string;
  status: RequestStatus;
  phone_number?: string;
  medical_condition?: string;
  notes?: string;
  urgency_level?: 'low' | 'medium' | 'high' | 'urgent';
  unit_type?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  unique_code?: string;
  requester_id?: string;
  partner_id?: string;
  approved_by?: string;
  approved_at?: string;
  fulfilled_by?: string;
  fulfilled_at?: string;
  requester?: {
    id: string;
    institution_name: string;
    institution_type?: 'hospital' | 'pmi';
    address?: string;
    phone_number?: string;
  };
  partners?: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}

// Request Status
export type RequestStatus = 
  | 'pending' 
  | 'approved' 
  | 'in_fulfillment' 
  | 'rejected' 
  | 'ready' 
  | 'confirmed' 
  | 'completed' 
  | 'cancelled';

// Status Display Info
export interface StatusInfo {
  label: string;
  color: string;
  bgColor: string;
}

// Partner/PMI (now using institutions table)
export interface Partner {
  id: string;
  name: string; // mapped from institution_name
  institution_name?: string;
  institution_type?: 'hospital' | 'pmi';
  address: string;
  latitude?: number;
  longitude?: number;
  blood_stock?: Array<{
    blood_type: string;
    quantity: number;
    expiry_date?: string;
  }>;
}

// Filter State
export interface FilterState {
  date: string;
  bloodType: string;
  location: string;
  status?: RequestStatus;
}

// Form Data for Creating Request
export interface CreateRequestForm {
  patient_name: string;
  blood_type: string;
  quantity: number;
  partner_id: string;
  phone_number: string;
  medical_condition?: string;
  notes?: string;
  urgency_level?: 'low' | 'medium' | 'high' | 'urgent';
  unit_type?: string;
}

// User Type
export type UserRole = 'hospital' | 'pmi' | 'donor' | 'admin';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  user_type: UserRole;
  blood_type?: string;
}
