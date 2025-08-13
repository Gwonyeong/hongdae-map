"use client";

import { useEffect, useState } from "react";

export default function LocationConfirmModal({
  isOpen,
  place,
  onConfirm,
  onCancel,
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 애니메이션을 위해 약간의 딜레이 후 표시
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen || !place) return null;

  return (
    <>
      {/* 딤드 배경 */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onCancel}
      />

      {/* 바텀시트 */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-white rounded-t-2xl shadow-2xl px-6 py-5">
          {/* 드래그 핸들 */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* 위치 정보 */}
          <div className="text-center mb-6">
            <div className="mb-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-7 h-7 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                이곳이 맞나요?
              </h3>
            </div>

            <div className="text-left bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                {place.name}
              </h4>
              <p className="text-gray-600 mb-1">{place.address}</p>
              {place.category && (
                <p className="text-sm text-gray-500">{place.category}</p>
              )}
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex gap-3 pb-2">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              다시 선택
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-semibold text-lg"
            >
              맞아요! 👍
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
