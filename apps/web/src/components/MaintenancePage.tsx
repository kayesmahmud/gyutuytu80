'use client';

import Image from 'next/image';

export function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="Thulo Bazaar"
            width={180}
            height={60}
            className="mx-auto"
            priority
          />
        </div>

        {/* English */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          We&apos;ll Be Right Back
        </h1>
        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          Thulo Bazaar is currently undergoing scheduled maintenance.
          We&apos;re working hard to improve your experience. Please check back soon.
        </p>

        {/* Decorative bar */}
        <div className="w-16 h-1 bg-indigo-500 rounded-full mx-auto mb-6" />

        {/* Nepali */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          हामी छिट्टै फर्कने छौं
        </h2>
        <p className="text-base text-gray-500 leading-relaxed">
          ठूलो बजार हाल मर्मत सम्भारमा छ।
          हामी तपाईंको अनुभव सुधार गर्न कडा मेहनत गर्दैछौं। कृपया केही समय पछि पुन: प्रयास गर्नुहोस्।
        </p>
      </div>
    </div>
  );
}
