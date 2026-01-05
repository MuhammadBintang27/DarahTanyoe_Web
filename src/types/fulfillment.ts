/**
 * TypeScript Types for Blood Request Fulfillment System
 * Handles donor matching, confirmation tracking, and fulfillment monitoring
 */

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export type FulfillmentStatus =
  | 'initiated'
  | 'searching_donors'
  | 'donors_found'
  | 'in_progress'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'failed'
  | 'cancelled';

export type ConfirmationStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'expired'
  | 'completed'
  | 'failed';

/**
 * Main Fulfillment Request Interface
 * Represents a blood request that requires donor campaign fulfillment
 */
export interface FulfillmentRequest {
  id: string;
  blood_request_id: string;
  campaign_id?: string;
  pmi_id: string;
  patient_name: string;
  blood_type: BloodType;
  quantity_needed: number;
  quantity_collected: number;
  status: FulfillmentStatus;
  urgency_level: PriorityLevel;
  target_donors?: number;
  confirmed_donors: number;
  completed_donors: number;
  retry_count: number;
  max_retries: number;
  search_radius_km: number;
  donor_criteria?: DonorCriteria;
  initiated_at: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Relations (populated via joins)
  blood_request?: BloodRequest;
  campaign?: Campaign;
  donor_confirmations?: DonorConfirmation[];
  pmi?: Institution;
}

/**
 * Donor Confirmation Interface
 * Tracks individual donor response and verification
 */
export interface DonorConfirmation {
  id: string;
  fulfillment_request_id: string;
  campaign_id?: string;
  donor_id: string;
  unique_code: string;
  status: ConfirmationStatus;
  confirmed_at?: string;
  code_generated_at: string;
  code_expires_at: string;
  code_verified: boolean;
  code_verified_at?: string;
  verified_by?: string;
  donation_id?: string;
  donation_completed_at?: string;
  rejection_reason?: string;
  failure_reason?: string;
  notified_at?: string;
  notification_id?: string;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Relations
  donor?: Donor;
  donation?: Donation;
  fulfillment_request?: FulfillmentRequest;
}

/**
 * Donor Search Criteria
 */
export interface DonorCriteria {
  blood_type: BloodType;
  radius_km: number;
  min_eligible_days: number;
  urgency_level: PriorityLevel;
  min_score?: number;
}

/**
 * Eligible Donor Result from Scoring Algorithm
 */
export interface EligibleDonor {
  donor_id: string;
  full_name: string;
  phone_number: string;
  blood_type: BloodType;
  age: number;
  distance_km: number;

  // Individual scores (0-100)
  distance_score: number;
  history_score: number;
  commitment_score: number;

  // Weighted scores
  weighted_distance: number;
  weighted_history: number;
  weighted_commitment: number;

  // Final score (0-100)
  final_score: number;
  recommendation_rank: number;

  // Metadata
  eligible: boolean;
  last_donation_date?: string;
  total_donations: number;
  completion_rate?: number;
  priority_flag: boolean;
}

/**
 * Fulfillment Progress Tracking
 */
export interface FulfillmentProgress {
  fulfillment_id: string;
  status: FulfillmentStatus;
  target: number;
  collected: number;
  percentage: number;
  confirmed_donors: number;
  completed_donors: number;
  pending_donors: number;
  retry_count: number;
  can_retry: boolean;
}

/**
 * Fulfillment Statistics
 */
export interface FulfillmentStats {
  total_fulfillments: number;
  active_fulfillments: number;
  completed_fulfillments: number;
  failed_fulfillments: number;
  average_completion_time_hours: number;
  average_donors_per_fulfillment: number;
  success_rate: number;
}

/**
 * Code Verification Request
 */
export interface CodeVerificationRequest {
  unique_code: string;
  pmi_id: string;
}

/**
 * Code Verification Response
 */
export interface CodeVerificationResponse {
  valid: boolean;
  confirmation_id: string;
  confirmation: DonorConfirmation;
  donor?: Donor;
  fulfillment?: FulfillmentRequest;
  message: string;
}

/**
 * Complete Donation Request
 */
export interface CompleteDonationRequest {
  confirmation_id: string;
  pmi_id: string;
  quantity: number;
  unit_type?: string;
  notes?: string;
  medical_notes?: string;
  health_screening?: Record<string, any>;
  pre_donation_vitals?: Record<string, any>;
  post_donation_vitals?: Record<string, any>;
}

/**
 * Complete Donation Response
 */
export interface CompleteDonationResponse {
  confirmation_id: string;
  confirmation: DonorConfirmation;
  donation: any;
  message: string;
}

/**
 * Search Donors Request
 */
export interface SearchDonorsRequest {
  fulfillment_id: string;
  override_criteria?: Partial<DonorCriteria>;
}

/**
 * Search Donors Response
 */
export interface SearchDonorsResponse {
  fulfillment_id: string;
  eligible_donors: EligibleDonor[];
  total_found: number;
  notifications_sent: number;
  status: FulfillmentStatus;
  message: string;
}

/**
 * Create Fulfillment Request
 */
export interface CreateFulfillmentRequest {
  blood_request_id: string;
  search_radius_km?: number;
  target_donors?: number;
  notes?: string;
}

/**
 * Retry Search Request
 */
export interface RetrySearchRequest {
  fulfillment_id: string;
  increase_radius?: boolean;
  lower_min_score?: boolean;
}

/**
 * Cancel Fulfillment Request
 */
export interface CancelFulfillmentRequest {
  fulfillment_id: string;
  reason: string;
}

// ========================================
// Supporting Types (Reference)
// ========================================

export interface BloodRequest {
  id: string;
  requester_id: string;
  partner_id?: string;
  patient_name: string;
  phone_number: string;
  blood_type: BloodType;
  quantity: number;
  unit_type: string;
  urgency_level: PriorityLevel;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  organizer_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  status: string;
  related_request?: string;
  created_at: string;
}

export interface Donor {
  id: string;
  full_name: string;
  phone_number: string;
  blood_type: BloodType;
  age: number;
  address: string;
  last_donation_date?: string;
  total_donations: number;
  total_campaigns_registered: number;
  total_campaigns_completed: number;
  completion_rate?: number;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  institution_id: string;
  blood_type: BloodType;
  quantity: number;
  unit_type: string;
  donation_date: string;
  status: string;
  created_at: string;
}

export interface Institution {
  id: string;
  institution_type: 'hospital' | 'pmi';
  institution_name: string;
  address: string;
  kota: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

// ========================================
// Form Types
// ========================================

export interface FulfillmentFormData {
  blood_request_id: string;
  search_radius_km: number;
  target_donors: number;
  notes: string;
}

export interface CodeVerificationFormData {
  code: string;
}

export interface DonationCompleteFormData {
  confirmation_id: string;
  quantity: number;
  unit_type: string;
  notes: string;
  medical_notes: string;
  vitals: {
    blood_pressure: string;
    heart_rate: string;
    temperature: string;
  };
}

// ========================================
// Filter & Pagination Types
// ========================================

export interface FulfillmentFilters {
  status?: FulfillmentStatus | FulfillmentStatus[];
  blood_type?: BloodType;
  urgency_level?: PriorityLevel;
  pmi_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string; // patient name or blood request ID
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ========================================
// Status Badge Props
// ========================================

export interface FulfillmentStatusBadge {
  status: FulfillmentStatus;
  className?: string;
}

export interface ConfirmationStatusBadge {
  status: ConfirmationStatus;
  className?: string;
}

// ========================================
// Chart Data Types
// ========================================

export interface FulfillmentChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

export interface DonorScoreDistribution {
  blood_type: BloodType;
  total_donors: number;
  avg_score: number;
  experienced_donors: number;
  reliable_donors: number;
  eligible_donors: number;
}
