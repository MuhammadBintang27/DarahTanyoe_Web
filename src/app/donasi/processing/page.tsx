'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import ProtectedRoute from '@/components/protectedRoute/protectedRoute';
import { ProcessDonationModal } from '@/components/donation/ProcessDonationModal';
import { Beaker, Search, Calendar, Package } from 'lucide-react';
import { ComponentType } from '@/utils/componentHelpers';

interface Donation {
  id: string;
  donation_date: string;
  blood_type: string;
  donor_id: string;
  institution_id: string;
  status: string;
  components_created: boolean;
  quantity: number;
  donor?: {
    id: string;
    name: string;
    phone?: string;
  };
  institution?: {
    id: string;
    institution_name: string;
  };
}

interface ComponentInput {
  component_type: ComponentType;
  quantity: number | '';
  notes?: string;
}

export default function DonationProcessingPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log('🔄 useEffect triggered, user:', user);
    console.log('🏥 Using user.id as institution_id:', user?.id);
    
    if (user?.id) {
      console.log('✅ Calling fetchPendingDonations...');
      fetchPendingDonations();
    } else {
      console.log('❌ No user.id, skipping fetch');
    }
  }, [user]);

  useEffect(() => {
    // Filter donations based on search query
    if (searchQuery.trim() === '') {
      setFilteredDonations(donations);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = donations.filter(
        (donation) =>
          donation.donor?.name?.toLowerCase().includes(query) ||
          donation.blood_type.toLowerCase().includes(query) ||
          donation.id.toLowerCase().includes(query)
      );
      setFilteredDonations(filtered);
    }
  }, [searchQuery, donations]);

  const fetchPendingDonations = async () => {
    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_API_URL}/donation-processing/pending?pmi_id=${user?.id}`;
      console.log('🔍 Fetching donations from:', url);
      console.log('🏥 Using institution_id (user.id):', user?.id);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('❌ Response not OK:', response.status, response.statusText);
        throw new Error('Failed to fetch pending donations');
      }

      const result = await response.json();
      console.log('✅ API Response:', result);
      console.log('📊 Donations count:', result.data?.donations?.length || 0);
      console.log('📋 Donations data:', result.data?.donations);
      
      setDonations(result.data.donations || []);
      setFilteredDonations(result.data.donations || []);
    } catch (error) {
      console.error('❌ Error fetching pending donations:', error);
      alert('Gagal memuat data donasi');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessDonation = async (components: ComponentInput[]) => {
    if (!selectedDonation) return;

    try {
      setProcessing(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/donation-processing/${selectedDonation.id}/process`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            components,
            notes: 'Processed into components',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process donation');
      }

      const result = await response.json();
      alert(`Berhasil memproses donasi menjadi ${result.data.components_created} komponen!`);
      
      // Close modal and refresh list
      setIsModalOpen(false);
      setSelectedDonation(null);
      fetchPendingDonations();
    } catch (error: any) {
      console.error('Error processing donation:', error);
      alert(`Gagal memproses donasi: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const openProcessModal = (donation: Donation) => {
    setSelectedDonation(donation);
    setIsModalOpen(true);
  };

  const closeProcessModal = () => {
    setIsModalOpen(false);
    setSelectedDonation(null);
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="mb-2">
          <h2 className="font-bold text-3xl text-white">Proses Donasi</h2>
          <p className="mt-2 text-lg text-white font-semibold">
            Tentukan komponen stok darah dari donasi yang sudah diterima
          </p>
        </div>

        {/* Stats Card */}
        

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari berdasarkan nama donor, golongan darah, atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm"
            />
          </div>
        </div>

        {/* Donations List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat data donasi...</p>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Beaker className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchQuery
                ? 'Tidak ada donasi yang cocok'
                : 'Tidak ada donasi yang menunggu proses'}
            </h3>
            <p className="text-gray-600 text-sm">
              {searchQuery
                ? 'Coba gunakan kata kunci lain'
                : 'Semua donasi sudah diproses menjadi komponen stok'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDonations.map((donation) => (
              <div
                key={donation.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
              >
                {/* Donor Info */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-base mb-1">
                        {donation.donor?.name || 'Unknown'}
                      </h3>
                      {donation.donor?.phone && (
                        <p className="text-sm text-gray-600">{donation.donor.phone}</p>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm font-semibold border border-red-200">
                      {donation.blood_type}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <p className="text-xs text-gray-600 font-semibold">Tanggal Donasi</p>
                    </div>
                    <p className="text-sm text-gray-900 font-bold">
                      {new Date(donation.donation_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-gray-600" />
                      <p className="text-xs text-gray-600 font-semibold">Jumlah</p>
                    </div>
                    <p className="text-sm text-gray-900 font-bold">
                      {donation.quantity} kantong
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => openProcessModal(donation)}
                  className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm"
                >
                  Tentukan Komponen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Process Donation Modal */}
      <ProcessDonationModal
        isOpen={isModalOpen}
        donation={selectedDonation}
        loading={processing}
        onClose={closeProcessModal}
        onSubmit={handleProcessDonation}
      />
    </ProtectedRoute>
  );
}
