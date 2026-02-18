'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (id) {
      // Detect if Android
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      if (isAndroid) {
        // Try Intent URL for Android (more reliable)
        const intentUrl = `intent://confirmation/${id}#Intent;scheme=darahtanyoe;package=com.darahtanyoe.app;S.browser_fallback_url=${window.location.origin}/app/confirmation?id=${id};end`;
        window.location.href = intentUrl;
      } else {
        // Use deep link for iOS/others
        window.location.href = `darahtanyoe://confirmation/${id}`;
      }
      
      // Fallback: Show message after 2 seconds if app not installed
      setTimeout(() => {
        setShowFallback(true);
      }, 2000);
    }
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Membuka DarahTanyoe</h1>
          <p className="text-gray-600">
            Aplikasi sedang dibuka...
          </p>
        </div>

        {showFallback && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-3">
              Aplikasi tidak terbuka otomatis?
            </p>
            <a 
              href={`darahtanyoe://confirmation/${id}`}
              className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Buka Aplikasi
            </a>
            <p className="text-xs text-gray-500 mt-3">
              Pastikan aplikasi DarahTanyoe sudah terinstall
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmationRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
