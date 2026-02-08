import { useState, useEffect } from 'react';
import axios from 'axios';
import { BloodRequest, Partner } from '@/types/bloodRequest';
import toast from 'react-hot-toast';

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FilterParams {
  bloodType?: string;
  location?: string;
  date?: string;
}

export const useBloodRequests = (
  userId: string | undefined, 
  userRole: 'hospital' | 'pmi', 
  page: number = 1, 
  limit: number = 10,
  filters?: FilterParams
) => {
  const [data, setData] = useState<BloodRequest[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const endpoint = userRole === 'pmi' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/bloodReq/partner/${userId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/bloodReq/${userId}`;
      
      // Build query params with filters
      const params: any = { page, limit };
      if (filters?.bloodType) params.bloodType = filters.bloodType;
      if (filters?.date) params.date = filters.date;
      if (filters?.status) params.status = filters.status;
      
      // For hospital view, location filter means partnerId
      // For PMI view, location filter means requesterId
      if (filters?.location) {
        if (userRole === 'hospital') {
          params.partnerId = filters.location;
        } else {
          params.requesterId = filters.location;
        }
      }
        
      const response = await axios.get(endpoint, { params });
      
      setData(response.data.data || []);
      setPagination(response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
      });
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
  }, [userId, userRole, page, limit, filters?.bloodType, filters?.location, filters?.date, filters?.status]);

  return { data, pagination, loading, refetch: fetchRequests };
};

export const usePartners = (institutionType?: 'pmi' | 'hospital') => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/partners`);
      
      // Map institutions data to Partner interface
      const institutions = response.data.data || [];
      const mappedPartners = institutions
        .filter((inst: any) => {
          // If institutionType specified, filter by it. Otherwise show all.
          if (institutionType) {
            return inst.institution_type === institutionType;
          }
          return true;
        })
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
  }, [institutionType]);

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
