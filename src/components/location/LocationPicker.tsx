'use client';

import { useState, useEffect } from 'react';
import { MapPin, Crosshair, X, Check, Loader2, Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { LatLngExpression, LeafletMouseEvent } from 'leaflet';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

interface LocationPickerProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
  defaultAddress?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  defaultAddress = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  );
  const [address, setAddress] = useState(defaultAddress);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapKey, setMapKey] = useState(0);
  const [isMapReady, setIsMapReady] = useState(false);

  // Load Leaflet CSS on mount
  useEffect(() => {
    // Load CSS immediately
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      
      link.onload = () => {
        // Fix for default marker icon
        import('leaflet').then((L) => {
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });
          setTimeout(() => setIsMapReady(true), 100);
        });
      };
      
      document.head.appendChild(link);
    }
  }, []);

  // Reverse geocode using Nominatim (OpenStreetMap)
  const reverseGeocode = async (location: { lat: number; lng: number }) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung browser Anda');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelectedLocation(newLocation);
        reverseGeocode(newLocation);
        setMapKey(prev => prev + 1);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.');
        setIsLoadingLocation(false);
      }
    );
  };

  // Search location using Nominatim
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=id`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const newLocation = { 
          lat: parseFloat(data[0].lat), 
          lng: parseFloat(data[0].lon) 
        };
        setSelectedLocation(newLocation);
        setAddress(data[0].display_name);
        setMapKey(prev => prev + 1);
      } else {
        alert('Lokasi tidak ditemukan');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Gagal mencari lokasi');
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (!selectedLocation) {
      alert('Pilih lokasi terlebih dahulu');
      return;
    }

    onLocationSelect({
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      address: address,
    });

    setIsOpen(false);
  };

  // Cancel selection
  const handleCancel = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  // Default center (Jakarta)
  const defaultCenter = selectedLocation || { lat: -6.2088, lng: 106.8456 };

  // Map click handler component
  function MapClickHandler() {
    const { useMapEvents } = require('react-leaflet');
    useMapEvents({
      click: (e: LeafletMouseEvent) => {
        const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
        setSelectedLocation(newLocation);
        reverseGeocode(newLocation);
      },
    });
    return null;
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <MapPin className="w-5 h-5 text-red-500" />
        <span className="text-sm font-medium">Pilih Lokasi di Peta</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Pilih Lokasi</h3>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Cari alamat atau tempat..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cari
                </button>
                <button
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingLocation ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Crosshair className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative min-h-[400px] bg-gray-100">
              {!isMapReady ? (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Memuat peta...</p>
                  </div>
                </div>
              ) : (
                <MapContainer
                  key={mapKey}
                  center={[defaultCenter.lat, defaultCenter.lng] as LatLngExpression}
                  zoom={15}
                  style={{ height: '100%', width: '100%', minHeight: '400px' }}
                  className="z-0"
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {selectedLocation && (
                    <Marker 
                      position={[selectedLocation.lat, selectedLocation.lng] as LatLngExpression}
                      draggable={true}
                      eventHandlers={{
                        dragend: (e: any) => {
                          const marker = e.target;
                          const position = marker.getLatLng();
                          const newLocation = { 
                            lat: position.lat, 
                            lng: position.lng 
                          };
                          setSelectedLocation(newLocation);
                          reverseGeocode(newLocation);
                        },
                      }}
                    />
                  )}
                  
                  <MapClickHandler />
                </MapContainer>
              )}
            </div>

            {/* Info Panel */}
            {selectedLocation && (
              <div className="p-4 border-t bg-gray-50">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Alamat:</p>
                      <p className="text-sm text-gray-600">{address || 'Memuat alamat...'}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Koordinat: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedLocation}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" />
                Konfirmasi Lokasi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
