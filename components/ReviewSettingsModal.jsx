'use client';

import { useState } from 'react';

export default function ReviewSettingsModal({ isOpen, onClose, reviewId, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(reviewId);
        onClose();
      } else {
        throw new Error('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Review deletion failed:', error);
      alert('후기 삭제에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm mx-4 overflow-hidden">
        {!showDeleteConfirm ? (
          // 초기 설정 모달
          <>
            <div className="p-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">후기 설정</h3>
              
              <button
                onClick={handleDeleteClick}
                className="w-full text-left p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="font-medium">후기 삭제</span>
                </div>
              </button>
            </div>
            
            <div className="border-t p-4">
              <button
                onClick={onClose}
                className="w-full py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </>
        ) : (
          // 삭제 확인 모달
          <>
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">후기를 삭제하시겠습니까?</h3>
                <p className="text-sm text-gray-600">
                  삭제한 후기는 복구할 수 없습니다.<br />
                  정말로 삭제하시겠습니까?
                </p>
              </div>
            </div>
            
            <div className="border-t p-4 flex gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}