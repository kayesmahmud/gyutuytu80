'use client';

import { useState } from 'react';
import ReportShopModal from './ReportShopModal';

interface ReportShopButtonProps {
  shopId: number;
  shopName: string;
  lang: string;
}

export default function ReportShopButton({ shopId, shopName, lang }: ReportShopButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="lg:text-gray-500 lg:hover:text-orange-600 text-sm cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 group
          w-12 h-12 lg:w-auto lg:h-auto rounded-full lg:rounded-none bg-white lg:bg-transparent shadow-lg lg:shadow-none border border-gray-200 lg:border-0"
      >
        <span className="group-hover:scale-110 transition-transform text-xl lg:text-sm">🚩</span>
        <span className="hidden lg:inline group-hover:underline">Report this shop</span>
      </button>

      <ReportShopModal
        shopId={shopId}
        shopName={shopName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lang={lang}
      />
    </>
  );
}
