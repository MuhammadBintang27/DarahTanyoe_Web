import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export interface JanjiDonorConfirmation {
  id: string;
  donor_id: string;
  unique_code: string;
  status: string;
  code_expires_at?: string;
  code_verified: boolean;
  code_verified_at?: string;
  created_at: string;
  updated_at: string;
  scheduled_at?: string;
  pmi_id: string;
  donor?: {
    id: string;
    full_name: string;
    blood_type?: string;
    phone_number?: string;
  };
}

export const janjiDonorApi = {
  async list(pmiId: string, status?: string): Promise<JanjiDonorConfirmation[]> {
    const params = new URLSearchParams({ pmi_id: pmiId });
    if (status) params.append('status', status);
    const res = await apiClient.get(`/janji-donor/confirmations?${params.toString()}`);
    return res.data.data || [];
  },
  async verify(kode: string, pmiId: string): Promise<{ ok: boolean; status?: string; message?: string; data?: any }>{
    const res = await apiClient.post(`/janji-donor/verify`, { kode, pmi_id: pmiId });
    return res.data;
  },
  async complete(confirmationId: string, data: { quantity: number; notes?: string; }, pmiId: string): Promise<{ ok: boolean; status?: string; message?: string; data?: any }>{
    const payload = { confirmation_id: confirmationId, quantity: data.quantity, notes: data.notes, pmi_id: pmiId };
    const res = await apiClient.post(`/janji-donor/complete`, payload);
    return res.data;
  },
};

export default janjiDonorApi;
