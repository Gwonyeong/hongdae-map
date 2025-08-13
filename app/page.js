"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import KakaoMap from "@/components/KakaoMap";
import PlaceSearch from "@/components/PlaceSearch";
import ReviewForm from "@/components/ReviewForm";
import BottomSheet from "@/components/BottomSheet";
import LoginModal from "@/components/LoginModal";
import UserSettingsModal from "@/components/UserSettingsModal";
import LocationConfirmModal from "@/components/LocationConfirmModal";

export default function Home() {
  const { data: session, status } = useSession();
  const mapRef = useRef(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [selectedPlaceForSheet, setSelectedPlaceForSheet] = useState(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews");
      const data = await response.json();
      setPlaces(data.reviews || []);
    } catch (error) {
      console.error("리뷰 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
    setShowSearchModal(false);

    // 지도를 선택한 위치로 이동
    if (mapRef.current) {
      mapRef.current.moveToLocation(place.latitude, place.longitude, 2);
    }

    // 위치 확인 모달 표시
    setTimeout(() => {
      setShowLocationConfirm(true);
    }, 500); // 지도 이동 애니메이션 후 모달 표시
  };

  const handleLocationConfirm = () => {
    setShowLocationConfirm(false);
    setShowReviewForm(true);
  };

  const handleLocationCancel = () => {
    setShowLocationConfirm(false);
    setSelectedPlace(null);
    setShowSearchModal(true);
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        const data = await response.json();
        // 새 리뷰 추가 후 전체 데이터 다시 로드
        await fetchReviews();
        setShowReviewForm(false);
        setSelectedPlace(null);
      } else {
        throw new Error("리뷰 저장 실패");
      }
    } catch (error) {
      console.error("리뷰 저장 오류:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    setShowReviewForm(false);
    setSelectedPlace(null);
  };

  const handleMarkerClick = (place) => {
    setSelectedPlaceForSheet(place);
    setShowBottomSheet(true);
  };

  const handleBottomSheetClose = () => {
    setShowBottomSheet(false);
    setSelectedPlaceForSheet(null);
  };

  const handleReviewDeleted = async (reviewId) => {
    try {
      // 후기 삭제 후 전체 데이터 다시 로드
      const response = await fetch("/api/reviews");
      const data = await response.json();
      const updatedPlaces = data.reviews || [];
      setPlaces(updatedPlaces);

      // 바텀시트에 표시된 장소 데이터도 업데이트
      if (selectedPlaceForSheet) {
        // 새로운 데이터에서 같은 장소 찾기
        const updatedPlace = updatedPlaces.find(
          (p) => p.placeId === selectedPlaceForSheet.placeId
        );
        if (updatedPlace) {
          setSelectedPlaceForSheet(updatedPlace);
        } else {
          // 장소에 리뷰가 더 이상 없으면 바텀시트 닫기
          setShowBottomSheet(false);
          setSelectedPlaceForSheet(null);
        }
      }
    } catch (error) {
      console.error("데이터 업데이트 실패:", error);
    }
  };

  const handleAddButtonClick = () => {
    if (!session) {
      setShowLoginModal(true);
    } else {
      setShowSearchModal(true);
    }
  };

  const handleLoginModalClose = () => {
    setShowLoginModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* 헤더 */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 py-2">
          <div className="flex items-end gap-2">
            {/* 로고 이미지 */}
            <img
              src="/logo.png"
              alt="함께만홍 로고"
              className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11"
            />
            {/* 모든 화면 크기에서 제목 표시 */}
            <h1
              className="text-[14px] sm:text-xs lg:text-sm text-gray-800 mb-0.5 sm:mb-1 font-pinkfong"
              style={{ letterSpacing: "0.02em", fontWeight: 400 }}
            >
              함께 만들어가는 홍대 지도
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {session ? (
              <>
                {/* 프로필 이미지 */}
                <div className="flex items-center">
                  <img
                    src={session.user?.image || "/default-profile.svg"}
                    alt="프로필"
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    title={`${session.user?.name || "사용자"}님의 프로필`}
                  />
                </div>
                {/* 환경설정 버튼 */}
                <button
                  onClick={() => setShowUserSettings(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="사용자 설정"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-1.5 rounded-lg transition-colors"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 장소 검색 모달 */}
      {showSearchModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSearchModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md">
              <PlaceSearch
                onPlaceSelect={handlePlaceSelect}
                onClose={() => setShowSearchModal(false)}
              />
            </div>
          </div>
        </>
      )}

      {/* 위치 확인 모달 */}
      <LocationConfirmModal
        isOpen={showLocationConfirm}
        place={selectedPlace}
        onConfirm={handleLocationConfirm}
        onCancel={handleLocationCancel}
      />

      {/* 리뷰 작성 폼 모달 */}
      {showReviewForm && selectedPlace && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleCancel}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <ReviewForm
              place={selectedPlace}
              onSubmit={handleReviewSubmit}
              onCancel={handleCancel}
            />
          </div>
        </>
      )}

      {/* 지도 영역 */}
      <main className="h-full">
        <KakaoMap
          ref={mapRef}
          places={places}
          onMarkerClick={handleMarkerClick}
          session={session}
        />
      </main>

      {/* 플로팅 추가 버튼 */}
      <button
        onClick={handleAddButtonClick}
        className="fixed bottom-8 right-8 z-30 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 flex items-center justify-center"
        aria-label="장소 추가"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* 로그인 모달 */}
      <LoginModal isOpen={showLoginModal} onClose={handleLoginModalClose} />

      {/* 유저 설정 모달 */}
      <UserSettingsModal
        isOpen={showUserSettings}
        onClose={() => setShowUserSettings(false)}
        session={session}
      />

      {/* 바텀시트 */}
      <BottomSheet
        isOpen={showBottomSheet}
        onClose={handleBottomSheetClose}
        place={selectedPlaceForSheet}
        session={session}
        onReviewDeleted={handleReviewDeleted}
      />
    </div>
  );
}
