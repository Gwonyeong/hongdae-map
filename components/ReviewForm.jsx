"use client";

import { useState } from "react";

export default function ReviewForm({ place, onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(5);
  const [selectedEmoji, setSelectedEmoji] = useState("📍");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const emojis = [
    "📍",
    "☕",
    "🍰",
    "🍕",
    "🍔",
    "🍜",
    "🍺",
    "🎵",
    "🎨",
    "📚",
    "🛍️",
    "💼",
    "🏫",
    "🎬",
    "🎮",
    "❤️",
  ];

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // 최대 3장 제한
    if (selectedImages.length + files.length > 3) {
      alert("이미지는 최대 3장까지 업로드할 수 있습니다.");
      return;
    }

    setUploadingImages(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "이미지 업로드 실패");
        }

        const result = await response.json();
        return {
          url: result.imageUrl,
          file,
          preview: URL.createObjectURL(file),
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setSelectedImages((prev) => [...prev, ...uploadedImages]);
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      alert(`이미지 업로드 실패: ${error.message}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageRemove = (index) => {
    setSelectedImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      // 미리보기 URL 해제
      if (prev[index]?.preview) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return newImages;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      alert("제목과 설명을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    const reviewData = {
      title,
      description,
      rating,
      emoji: selectedEmoji,
      placeName: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      images: selectedImages.map((img) => img.url),
    };

    try {
      await onSubmit(reviewData);
      // 폼 초기화
      setTitle("");
      setDescription("");
      setRating(5);
      setSelectedEmoji("📍");
      // 이미지 미리보기 URL 해제
      selectedImages.forEach((img) => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
      setSelectedImages([]);
    } catch (error) {
      console.error("리뷰 저장 실패:", error);
      alert("리뷰 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
      {/* 고정 헤더 */}
      <div className="p-6 pb-4 border-b border-gray-200">
        <h3 className="text-xl font-bold mb-4">리뷰 작성</h3>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="font-semibold text-gray-900">{place.name}</p>
          <p className="text-sm text-gray-600">{place.address}</p>
        </div>
      </div>

      {/* 스크롤 가능한 폼 영역 */}
      <div className="flex-1 overflow-y-auto p-6 pt-4">
        <form id="review-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="리뷰 제목을 입력하세요"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="이 장소에 대한 후기를 작성해주세요"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              별점: {rating}점
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-2xl transition-transform hover:scale-110"
                >
                  {star <= rating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              마커 이모지 선택
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-2 justify-items-center">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-2xl sm:text-xl p-3 sm:p-2 rounded-lg transition-all hover:scale-110 w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center ${
                    selectedEmoji === emoji
                      ? "bg-blue-100 ring-2 ring-blue-500"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사진 추가 (최대 3장)
            </label>

            {/* 이미지 업로드 버튼 */}
            <div className="mb-3">
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={uploadingImages || selectedImages.length >= 3}
                  className="hidden"
                />
                <div className="text-center">
                  {uploadingImages ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                      <span className="text-sm text-gray-500">
                        업로드 중...
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-8 h-8 text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">
                        {selectedImages.length >= 3
                          ? "최대 3장까지 가능"
                          : "사진 선택"}
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* 선택된 이미지 미리보기 */}
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* 고정 푸터 (버튼 영역) */}
      <div className="p-6 pt-4 border-t border-gray-200">
        <div className="flex gap-3">
          <button
            type="submit"
            form="review-form"
            disabled={isSubmitting}
            className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
          >
            {isSubmitting ? "저장 중..." : "리뷰 저장"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
