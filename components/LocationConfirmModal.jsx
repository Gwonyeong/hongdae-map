"use client";

export default function LocationConfirmModal({
  isOpen,
  place,
  onConfirm,
  onCancel,
}) {
  if (!isOpen || !place) return null;

  return (
    <>
      {/* 딤드 배경 */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onCancel} />

      {/* 말풍선 모달 */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4 relative">
          {/* 말풍선 꼬리 */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-4 h-4 bg-white rotate-45 border-r border-b border-gray-200"></div>
          </div>

          {/* 위치 정보 */}
          <div className="text-center mb-6">
            <div className="mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                이곳이 맞나요?
              </h3>
            </div>

            <div className="text-left bg-gray-50 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-gray-900 mb-1">{place.name}</h4>
              <p className="text-sm text-gray-600">{place.address}</p>
              {place.category && (
                <p className="text-xs text-gray-500 mt-1">{place.category}</p>
              )}
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              다시 선택
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              맞아요! 👍
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
