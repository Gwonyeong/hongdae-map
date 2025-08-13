"use client";

import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import Script from "next/script";

const KakaoMap = forwardRef(({ places = [], onMarkerClick, session }, ref) => {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(4);
  const [eventListeners, setEventListeners] = useState([]);
  const [selectedLocationMarker, setSelectedLocationMarker] = useState(null);

  // 외부에서 지도 이동을 호출할 수 있도록 ref 노출
  useImperativeHandle(ref, () => ({
    moveToLocation: (latitude, longitude, zoomLevel = 3) => {
      if (map) {
        const moveLatLon = new window.kakao.maps.LatLng(latitude, longitude);

        // 화면 상단 2/3 지점에 위치하도록 offset 계산
        const mapSize = map.getSize();
        const offsetY = mapSize.height * 0.17; // 상단에서 2/3 지점 (17% 정도 아래로)

        // 픽셀 좌표로 변환하여 offset 적용
        const projection = map.getProjection();
        const point = projection.pointFromCoords(moveLatLon);
        const offsetPoint = new window.kakao.maps.Point(
          point.x,
          point.y - offsetY
        );
        const offsetLatLon = projection.coordsFromPoint(offsetPoint);

        map.setCenter(offsetLatLon);
        map.setLevel(zoomLevel);

        // 빨간 점 마커 추가
        addSelectedLocationMarker(moveLatLon);
      }
    },
    removeSelectedLocationMarker: () => {
      if (selectedLocationMarker) {
        selectedLocationMarker.setMap(null);
        setSelectedLocationMarker(null);
      }
    },
  }));

  // 선택된 위치에 빨간 점 마커 추가
  const addSelectedLocationMarker = (position) => {
    // 기존 빨간 점 마커 제거
    if (selectedLocationMarker) {
      selectedLocationMarker.setMap(null);
    }

    // 새로운 빨간 점 마커 생성
    const redDotMarker = new window.kakao.maps.CustomOverlay({
      position: position,
      content: `
        <div style="
          width: 20px;
          height: 20px;
          background: #ef4444;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        "></div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        </style>
      `,
      yAnchor: 0.5,
      xAnchor: 0.5,
    });

    redDotMarker.setMap(map);
    setSelectedLocationMarker(redDotMarker);
  };

  const initializeMap = () => {
    if (!window.kakao || !window.kakao.maps) return;

    const options = {
      center: new window.kakao.maps.LatLng(37.5533, 126.925), // 홍대 중심 좌표
      level: 4,
    };

    const kakaoMap = new window.kakao.maps.Map(mapContainer.current, options);
    setMap(kakaoMap);

    // 줌 레벨 변경 이벤트 리스너
    window.kakao.maps.event.addListener(kakaoMap, "zoom_changed", () => {
      const zoomLevel = kakaoMap.getLevel();
      setCurrentZoomLevel(zoomLevel);
    });

    // 지도 컨트롤 제거 (깔끔한 UI를 위해)
  };

  // 같은 주소를 가진 장소들을 그룹핑하는 함수
  const groupPlacesByAddress = (places) => {
    const grouped = {};

    places.forEach((place) => {
      const key = place.address || `${place.latitude}_${place.longitude}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(place);
    });

    return grouped;
  };

  // 그룹에서 가장 많은 이모지 찾기
  const getMostFrequentEmoji = (places) => {
    const emojiCount = {};
    places.forEach((place) => {
      emojiCount[place.emoji] = (emojiCount[place.emoji] || 0) + 1;
    });

    return Object.entries(emojiCount).reduce((a, b) =>
      emojiCount[a[0]] > emojiCount[b[0]] ? a : b
    )[0];
  };

  // 그룹의 총 후기 수 계산
  const getTotalReviews = (places) => {
    return places.reduce(
      (total, place) => total + (place.totalReviews || 0),
      0
    );
  };

  // 사용자가 작성한 후기가 있는 장소인지 확인하는 함수
  const hasUserReview = (place) => {
    if (!session?.user?.id) return false;

    // 개별 장소의 경우
    if (place.allReviews) {
      return place.allReviews.some(
        (review) => review.userId === session.user.id
      );
    }

    return false;
  };

  // 그룹에서 사용자가 작성한 후기가 있는지 확인하는 함수
  const hasUserReviewInGroup = (placesInGroup) => {
    if (!session?.user?.id) return false;

    return placesInGroup.some((place) => hasUserReview(place));
  };

  const createMarkers = () => {
    if (!map || !window.kakao) return;

    // 기존 마커 및 이벤트 리스너 제거
    markers.forEach((overlay) => {
      if (overlay && overlay.setMap) {
        overlay.setMap(null);
      }
    });

    // 기존 이벤트 리스너 제거
    eventListeners.forEach(({ element, eventType, handler }) => {
      if (element && element.removeEventListener) {
        element.removeEventListener(eventType, handler);
      }
    });

    const newMarkers = [];
    const newEventListeners = [];

    // 줌 레벨 3 이상일 때는 주소별로 그룹핑된 마커 표시
    if (currentZoomLevel >= 3) {
      const groupedPlaces = groupPlacesByAddress(places);

      Object.entries(groupedPlaces).forEach(([address, placesInGroup]) => {
        // 그룹의 첫 번째 장소의 위치를 사용
        const representativePlace = placesInGroup[0];
        const position = new window.kakao.maps.LatLng(
          representativePlace.latitude,
          representativePlace.longitude
        );

        // 그룹에서 가장 많은 이모지
        const mostFrequentEmoji = getMostFrequentEmoji(placesInGroup);
        // 그룹의 총 후기 수
        const totalGroupReviews = getTotalReviews(placesInGroup);
        // 사용자가 작성한 후기가 있는지 확인
        const userHasReviewInGroup = hasUserReviewInGroup(placesInGroup);

        const shouldShowReviewCount = totalGroupReviews > 1;
        const reviewCountText =
          totalGroupReviews > 9 ? "9+" : totalGroupReviews.toString();

        // 통합된 마커 생성
        const customOverlay = createCustomOverlay(
          position,
          mostFrequentEmoji,
          shouldShowReviewCount,
          reviewCountText,
          false,
          "",
          `grouped_${address}`,
          true,
          userHasReviewInGroup
        );
        customOverlay.setMap(map);
        newMarkers.push(customOverlay);

        // 통합된 마커 클릭 이벤트 등록
        const addGroupedMarkerEvent = () => {
          const overlayElement = document.querySelector(
            `[data-place-id="grouped_${address}"]`
          );
          if (overlayElement) {
            const clickHandler = () => {
              map.setLevel(1);
              map.setCenter(position);
            };
            overlayElement.addEventListener("click", clickHandler);
            newEventListeners.push({
              element: overlayElement,
              eventType: "click",
              handler: clickHandler,
            });
          } else {
            // 요소가 아직 생성되지 않았다면 다시 시도
            setTimeout(addGroupedMarkerEvent, 50);
          }
        };
        addGroupedMarkerEvent();
      });
    } else {
      // 줌 레벨 2 이하일 때는 개별 마커 표시
      places.forEach((place) => {
        const position = new window.kakao.maps.LatLng(
          place.latitude,
          place.longitude
        );

        // 줌 레벨에 따라 매장 이름 표시 여부 결정 (레벨 1-2에서 표시)
        const shouldShowStoreName = currentZoomLevel <= 2;
        // 후기 숫자 표시 (후기가 1개 이상일 때)
        const shouldShowReviewCount = place.totalReviews > 1;
        const reviewCountText =
          place.totalReviews > 9 ? "9+" : place.totalReviews.toString();
        // 사용자가 작성한 후기가 있는지 확인
        const userHasReviewInPlace = hasUserReview(place);

        // 개별 마커 생성
        const customOverlay = createCustomOverlay(
          position,
          place.emoji,
          shouldShowReviewCount,
          reviewCountText,
          shouldShowStoreName,
          place.placeName,
          place.placeId,
          false,
          userHasReviewInPlace
        );
        customOverlay.setMap(map);
        newMarkers.push(customOverlay);

        // 개별 마커 클릭 이벤트 등록
        const addIndividualMarkerEvent = () => {
          const overlayElement = document.querySelector(
            `[data-place-id="${place.placeId}"]`
          );
          if (overlayElement) {
            const clickHandler = () => {
              if (onMarkerClick) {
                onMarkerClick(place);
              }
            };
            overlayElement.addEventListener("click", clickHandler);
            newEventListeners.push({
              element: overlayElement,
              eventType: "click",
              handler: clickHandler,
            });
          } else {
            // 요소가 아직 생성되지 않았다면 다시 시도
            setTimeout(addIndividualMarkerEvent, 50);
          }
        };
        addIndividualMarkerEvent();
      });
    }

    setMarkers(newMarkers);
    setEventListeners(newEventListeners);
  };

  // 커스텀 오버레이 생성 함수
  const createCustomOverlay = (
    position,
    emoji,
    shouldShowReviewCount,
    reviewCountText,
    shouldShowStoreName,
    placeName,
    placeId,
    isGrouped,
    userHasReview
  ) => {
    const backgroundColor = userHasReview ? "#4ade80" : "white";
    return new window.kakao.maps.CustomOverlay({
      position: position,
      content: `
        <div style="position: relative; text-align: center; cursor: pointer;" data-place-id="${placeId}">
          <div style="
            background: ${backgroundColor};
            border-radius: 20px;
            padding: 8px 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 2px solid ${isGrouped ? "#3b82f6" : "#e5e7eb"};
            position: relative;
            display: inline-block;
            transition: transform 0.2s, box-shadow 0.2s;
          " onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'">
            <div style="font-size: 24px; line-height: 1; position: relative;">
              ${emoji}
              ${
                shouldShowReviewCount
                  ? `<span style="position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; font-size: 10px; border-radius: 50%; min-width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-weight: bold; padding: 0 2px;">${reviewCountText}</span>`
                  : ""
              }
            </div>
            <div style="
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 8px solid transparent;
              border-right: 8px solid transparent;
              border-top: 8px solid ${isGrouped ? "#3b82f6" : "#e5e7eb"};
            "></div>
            <div style="
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid ${backgroundColor};
            "></div>
          </div>
          ${
            shouldShowStoreName
              ? `
            <div style="
              background: rgba(0,0,0,0.8);
              color: white;
              font-size: 11px;
              font-weight: 500;
              padding: 4px 8px;
              border-radius: 12px;
              margin-top: 4px;
              white-space: nowrap;
              max-width: 120px;
              overflow: hidden;
              text-overflow: ellipsis;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            ">
              ${placeName}
            </div>
          `
              : ""
          }
        </div>
      `,
      yAnchor: 1,
      xAnchor: 0.5,
      clickable: true,
    });
  };

  useEffect(() => {
    if (map) {
      console.log("KakaoMap: places updated, length:", places.length);
      if (places.length > 0) {
        createMarkers();
      } else {
        // places가 빈 배열일 때도 기존 마커들을 제거
        markers.forEach((overlay) => {
          if (overlay && overlay.setMap) {
            overlay.setMap(null);
          }
        });
        setMarkers([]);

        // 이벤트 리스너도 정리
        eventListeners.forEach(({ element, eventType, handler }) => {
          if (element && element.removeEventListener) {
            element.removeEventListener(eventType, handler);
          }
        });
        setEventListeners([]);
      }
    }
  }, [map, places, currentZoomLevel]);

  // 컴포넌트 언마운트 시 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      eventListeners.forEach(({ element, eventType, handler }) => {
        if (element && element.removeEventListener) {
          element.removeEventListener(eventType, handler);
        }
      });
    };
  }, [eventListeners]);

  return (
    <>
      <Script
        strategy="afterInteractive"
        type="text/javascript"
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`}
        onLoad={() => {
          window.kakao.maps.load(() => {
            initializeMap();
          });
        }}
      />
      <div ref={mapContainer} className="w-full h-full" />
    </>
  );
});

export default KakaoMap;
