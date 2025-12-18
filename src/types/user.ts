// Institution Types
export type InstitutionType = 'hospital' | 'pmi';

export interface RegisterInstitutionData {
  institution_type: InstitutionType;
  email: string;
  password: string;
  institution_name: string;
  address: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
}

export interface Institution {
  id: string;
  institution_type: InstitutionType;
  email: string;
  institution_name: string;
  address: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

// Donor Types (previously User)
export interface RegisterDonorData {
  email: string;
  full_name: string;
  phoneNumber: string;
  address: string;
  latitude?: number;
  longitude?: number;
  age: number;
  blood_type: BloodType;
  last_donation_date?: string;
  health_notes?: string;
  profile_picture?: string;
}

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Donor {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  address: string;
  age: number;
  blood_type: BloodType;
  total_points: number;
  profile_picture?: string;
  last_donation_date?: string;
  health_notes?: string;
  created_at: string;
  updated_at: string;
}

// Legacy types for backward compatibility
export type UserType = 'donor' | 'hospital' | 'pmi';

export interface RegisterFormData {
  email: string;
  full_name: string;
  phoneNumber: string;
  address: string;
  latitude?: number;
  longitude?: number;
  age: number;
  blood_type: BloodType;
  last_donation_date?: string;
  health_notes?: string;
  user_type: UserType;
  profile_picture?: string;
  password?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  address: string;
  age: number;
  blood_type: BloodType;
  user_type: UserType;
  total_points: number;
  profile_picture?: string;
  last_donation_date?: string;
  health_notes?: string;
  created_at: string;
  updated_at: string;
}
