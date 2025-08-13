'use client';

import { useState, useRef, useEffect } from 'react';
import ImageModal from './ImageModal';
import ReviewSettingsModal from './ReviewSettingsModal';

export default function BottomSheet({ isOpen, onClose, place, session, onReviewDeleted }) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const startY = useRef(0);
  const sheetRef = useRef(null);
  
  const SHEET_HEIGHT = 400;
  const CLOSE_THRESHOLD = 100;

  useEffect(() => {
    if (isOpen) {
      setDragY(0);
    } else {
      setDragY(SHEET_HEIGHT);
      setIsFullScreen(false); // 바텀시트가 닫히면 전체화면 상태 초기화
    }
  }, [isOpen]);

  const handleTouchStart = (e) => {
    if (isFullScreen) return; // 전체화면일 때 드래그 비활성화
    setIsDragging(true);
    startY.current = e.touches ? e.touches[0].clientY : e.clientY;
  };

  const handleTouchMove = (e) => {
    if (!isDragging || isFullScreen) return;
    
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      setDragY(Math.min(diff, SHEET_HEIGHT));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (dragY > CLOSE_THRESHOLD) {
      onClose();
      setTimeout(() => setDragY(SHEET_HEIGHT), 50);
    } else {
      setDragY(0);
    }
  };

  const handleMouseDown = (e) => {
    if (isFullScreen) return; // 전체화면일 때 드래그 비활성화
    setIsDragging(true);
    startY.current = e.clientY;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isFullScreen) return;
    
    const diff = e.clientY - startY.current;
    if (diff > 0) {
      setDragY(Math.min(diff, SHEET_HEIGHT));
    }
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  const handleImageClick = (images, imageIndex) => {
    setSelectedImages(images);
    setSelectedImageIndex(imageIndex);
    setShowImageModal(true);
  };

  const handleImageModalClose = () => {
    setShowImageModal(false);
    setSelectedImages([]);
    setSelectedImageIndex(0);
  };

  const handleSettingsClick = (reviewId) => {
    setSelectedReviewId(reviewId);
    setShowSettingsModal(true);
  };

  const handleSettingsModalClose = () => {
    setShowSettingsModal(false);
    setSelectedReviewId(null);
  };

  const handleReviewDelete = (reviewId) => {
    if (onReviewDeleted) {
      onReviewDeleted(reviewId);
    }
    handleSettingsModalClose();
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    setDragY(0);
  };

  if (!place) return null;

  // 디버깅을 위한 콘솔 로그
  console.log('BottomSheet place data:', place);
  console.log('Session data:', session);
  if (place?.topEmojis) {
    place.topEmojis.forEach((emojiGroup, groupIndex) => {
      emojiGroup.reviews.forEach((review, reviewIndex) => {
        console.log(`Review ${groupIndex}-${reviewIndex}:`, {
          id: review.id,
          userId: review.userId,
          sessionUserId: session?.user?.id,
          isOwnReview: session?.user?.id === review.userId
        });
      });
    });
  }

  return (
    <>
      {/* 배경 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* 바텀시트 */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl transition-all ${
          !isOpen && !isDragging ? 'translate-y-full' : ''
        } ${isFullScreen ? '' : 'rounded-t-3xl'}`}
        style={{
          height: isFullScreen ? '100vh' : `${SHEET_HEIGHT}px`,
          transform: `translateY(${isOpen || isDragging ? (isFullScreen ? 0 : dragY) : SHEET_HEIGHT}px)`,
          transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* 상단 헤더 바 */}
        <div className={`sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between ${isFullScreen ? '' : 'rounded-t-3xl'}`}>
          <div className="flex items-center gap-3">
            {place && (
              <>
                <span className="text-2xl">{place.emoji}</span>
                <h2 className="text-lg font-semibold text-gray-900">{place.placeName}</h2>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* 전체화면 토글 버튼 */}
            <button
              onClick={toggleFullScreen}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullScreen ? "축소" : "확대"}
            >
              <img 
                src={isFullScreen ? "/ensmall.svg" : "/enlarge.svg"} 
                alt={isFullScreen ? "축소" : "확대"}
                className="w-5 h-5"
              />
            </button>
            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                setIsFullScreen(false); // 닫을 때 전체화면 상태 초기화
                onClose();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 컨텐츠 영역 */}
        <div className={`px-6 ${isFullScreen ? 'py-6' : 'pt-4 pb-6'} h-full overflow-y-auto`}>
          {/* 장소 정보 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">평균 {place.avgRating?.toFixed(1)}점</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">리뷰 {place.totalReviews}개</span>
            </div>
            <p className="text-sm text-gray-600">{place.address}</p>
          </div>
          
          <div className="border-t pt-4">
            {/* 이모지별 리뷰 그룹 */}
            {place.topEmojis && place.topEmojis.map((emojiGroup, groupIndex) => (
              <div key={groupIndex} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{emojiGroup.emoji}</span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {emojiGroup.count}개의 리뷰
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {emojiGroup.reviews.map((review, reviewIndex) => (
                    <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                      {/* 리뷰 헤더 */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {review.user?.image && (
                            <img 
                              src={review.user.image} 
                              alt={review.user.name} 
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {review.user?.name || '익명'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-sm">
                                {i < review.rating ? '⭐' : '☆'}
                              </span>
                            ))}
                          </div>
                          {/* 본인이 작성한 후기인 경우 설정 버튼 표시 */}
                          {session?.user?.id === review.userId && (
                            <button
                              onClick={() => handleSettingsClick(review.id)}
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                              title="설정"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* 리뷰 제목 */}
                      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                      
                      {/* 리뷰 내용 */}
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        {review.description}
                      </p>
                      
                      {/* 리뷰 이미지 */}
                      {review.images && Array.isArray(review.images) && review.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {review.images.map((imageUrl, imageIndex) => (
                            <div key={imageIndex} className="relative">
                              <img
                                src={imageUrl}
                                alt={`Review image ${imageIndex + 1}`}
                                className="w-full aspect-[9/16] object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleImageClick(review.images, imageIndex)}
                              />
                              {/* 여러 이미지가 있을 때 인디케이터 */}
                              {review.images.length > 1 && (
                                <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                                  {imageIndex + 1}/{review.images.length}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* 작성일 */}
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이미지 확대 모달 */}
      <ImageModal
        isOpen={showImageModal}
        onClose={handleImageModalClose}
        images={selectedImages}
        initialIndex={selectedImageIndex}
      />

      {/* 리뷰 설정 모달 */}
      <ReviewSettingsModal
        isOpen={showSettingsModal}
        onClose={handleSettingsModalClose}
        reviewId={selectedReviewId}
        onDelete={handleReviewDelete}
      />
    </>
  );
}