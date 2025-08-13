"use client";

import { useState } from "react";

export default function PlaceSearch({ onPlaceSelect }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim() || !window.kakao) return;

    setIsSearching(true);
    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch(
      `홍대 ${searchQuery}`,
      (data, status) => {
        setIsSearching(false);

        if (status === window.kakao.maps.services.Status.OK) {
          setSearchResults(data);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setSearchResults([]);
          alert("검색 결과가 없습니다.");
        } else {
          alert("검색 중 오류가 발생했습니다.");
        }
      },
      {
        bounds: new window.kakao.maps.LatLngBounds(
          new window.kakao.maps.LatLng(37.545, 126.91),
          new window.kakao.maps.LatLng(37.565, 126.935)
        ),
      }
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const selectPlace = (place) => {
    onPlaceSelect({
      name: place.place_name,
      address: place.address_name,
      roadAddress: place.road_address_name,
      latitude: parseFloat(place.y),
      longitude: parseFloat(place.x),
      category: place.category_name,
    });
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="홍대 주변 장소를 검색하세요"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
        >
          {isSearching ? "검색중..." : "검색"}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="max-h-60 overflow-y-auto">
          <div className="space-y-2">
            {searchResults.map((place, index) => (
              <div
                key={index}
                onClick={() => selectPlace(place)}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <h4 className="font-semibold text-gray-900">
                  {place.place_name}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {place.address_name}
                </p>
                {place.category_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    {place.category_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
