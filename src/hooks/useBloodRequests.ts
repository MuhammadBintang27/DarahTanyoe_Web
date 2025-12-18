import { useState, useEffect } from 'react';
import axios from 'axios';
import { BloodRequest, Partner } from '@/types/bloodRequest';
import toast from 'react-hot-toast';

export const useBloodRequests = (userId: string | undefined, userRole: 'hospital' | 'pmi') => {
  const [data, setData] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const endpoint = userRole === 'pmi' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/bloodReq/partner/${userId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/bloodReq/${userId}`;
        
      const response = await axios.get(endpoint);
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Gagal memuat data permintaan');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [userId, userRole]);

  return { data, loading, refetch: fetchRequests };
};

export const usePartners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/partners`);
      
      // Map institutions data to Partner interface
      const institutions = response.data.data || [];
      const mappedPartners = institutions
        .filter((inst: any) => inst.institution_type === 'pmi') // Only PMI institutions
        .map((inst: any) => ({
          id: inst.id,
          name: inst.institution_name,
          institution_name: inst.institution_name,
          institution_type: inst.institution_type,
          address: inst.address,
          blood_stock: inst.blood_stock || [],
        }));
      
      setPartners(mappedPartners);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Gagal memuat data mitra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  return { partners, loading };
};

export const useBloodStock = (userId: string | undefined) => {
  const [bloodStock, setBloodStock] = useState<Array<{ blood_type: string; quantity: number }>>([]);
  const [loading, setLoading] = useState(false);

  const fetchBloodStock = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/partners/${userId}`);
      const stockData = response.data.data?.blood_stock || [];
      setBloodStock(stockData);
    } catch (error) {
      console.error('Error fetching blood stock:', error);
      setBloodStock([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBloodStock();
  }, [userId]);

  return { bloodStock, loading, refetch: fetchBloodStock };
};
