"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

export default function UserSettingsModal({ isOpen, onClose, session }) {
  const { update } = useSession();
  const [activeSection, setActiveSection] = useState(null);
  const [profileName, setProfileName] = useState(session?.user?.name || "");
  const [profileImage, setProfileImage] = useState(session?.user?.image || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(session?.user?.image || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 형식 체크
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.");
        return;
      }

      // 매우 큰 파일에 대한 사용자 알림 (100MB 이상)
      if (file.size > 100 * 1024 * 1024) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        const proceed = confirm(
          `선택하신 이미지가 ${sizeMB}MB로 큽니다. 업로드 시 시간이 오래 걸릴 수 있습니다. 계속하시겠습니까?`
        );
        if (!proceed) {
          return;
        }
      }

      setSelectedFile(file);

      // 미리보기 이미지 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      let finalImageUrl = profileImage;

      console.log("프로필 업데이트 시작:", {
        profileName,
        profileImage,
        selectedFile: selectedFile ? selectedFile.name : "없음",
        sessionUser: session?.user,
      });

      // 새 파일이 선택된 경우 업로드
      if (selectedFile) {
        console.log("이미지 업로드 시작:", selectedFile.name);
        const formData = new FormData();
        formData.append("profileImage", selectedFile);

        const uploadResponse = await fetch("/api/user/profile-image", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        console.log("이미지 업로드 응답:", uploadData);

        if (uploadResponse.ok) {
          finalImageUrl = uploadData.imageUrl;
          console.log("이미지 업로드 성공:", finalImageUrl);
        } else {
          console.error("이미지 업로드 실패:", uploadData);
          throw new Error(uploadData.error || "이미지 업로드 실패");
        }
      }

      console.log("프로필 정보 업데이트 요청:", {
        name: profileName,
        image: finalImageUrl,
      });

      // 프로필 정보 업데이트
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileName,
          image: finalImageUrl,
        }),
      });

      const responseData = await response.json();
      console.log("프로필 업데이트 응답:", responseData);

      if (response.ok) {
        alert("프로필이 업데이트되었습니다.");
        // 세션 업데이트를 위해 페이지 새로고침 대신 더 나은 방법 사용
        update();
      } else {
        console.error("프로필 업데이트 실패:", responseData);
        throw new Error(responseData.error || "프로필 업데이트 실패");
      }
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      alert(`프로필 업데이트에 실패했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (response.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        throw new Error("회원 탈퇴 실패");
      }
    } catch (error) {
      console.error("회원 탈퇴 오류:", error);
      alert("회원 탈퇴에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">사용자 설정</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto">
            {/* 메인 메뉴 */}
            {!activeSection && (
              <>
                {/* 프로필 변경 */}
                <button
                  onClick={() => setActiveSection("profile")}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">프로필 변경</p>
                      <p className="text-sm text-gray-500">
                        이름과 프로필 사진 수정
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* 로그아웃 */}
                <button
                  onClick={() => signOut()}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">로그아웃</p>
                      <p className="text-sm text-gray-500">계정에서 로그아웃</p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* 회원 탈퇴 */}
                <button
                  onClick={() => setActiveSection("delete")}
                  className="w-full p-4 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-red-900">회원 탈퇴</p>
                      <p className="text-sm text-red-700">
                        계정과 모든 데이터 삭제
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-red-400 group-hover:text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* 프로필 변경 섹션 */}
            {activeSection === "profile" && (
              <div className="space-y-4">
                <button
                  onClick={() => setActiveSection(null)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="text-sm">뒤로가기</span>
                </button>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      프로필 사진
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={imagePreview || "/default-profile.svg"}
                          alt="프로필"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                        {selectedFile && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="file"
                          id="profileImageFile"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="profileImageFile"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg cursor-pointer transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          사진 선택
                        </label>
                        {selectedFile && (
                          <div className="text-sm text-gray-600">
                            선택된 파일: {selectedFile.name}
                            <span className="ml-2 text-xs text-gray-500">
                              ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          JPEG, PNG, WebP 형식 (자동으로 300x300 크기로
                          조정됩니다)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="이름 입력"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleProfileUpdate}
                    disabled={isLoading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "업데이트 중..." : "프로필 업데이트"}
                  </button>
                </div>
              </div>
            )}

            {/* 회원 탈퇴 섹션 */}
            {activeSection === "delete" && (
              <div className="space-y-4">
                <button
                  onClick={() => setActiveSection(null)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="text-sm">뒤로가기</span>
                </button>

                {!showDeleteConfirm ? (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-900 mb-2">
                        회원 탈퇴 시 주의사항
                      </h3>
                      <ul className="space-y-1 text-sm text-red-700">
                        <li>• 모든 리뷰와 평가가 삭제됩니다</li>
                        <li>• 프로필 정보가 영구적으로 삭제됩니다</li>
                        <li>• 삭제된 데이터는 복구할 수 없습니다</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-colors"
                    >
                      회원 탈퇴 진행
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                      <p className="text-red-900 font-medium text-center">
                        정말로 탈퇴하시겠습니까?
                      </p>
                      <p className="text-red-700 text-sm text-center mt-2">
                        이 작업은 되돌릴 수 없습니다.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "탈퇴 중..." : "확인"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
