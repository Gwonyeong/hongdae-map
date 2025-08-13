"use client";

import { useState } from "react";

const FEEDBACK_SUBJECTS = [
  { value: "feature", label: "새로운 기능 제안" },
  { value: "advertisement", label: "광고 문의 (현재 무료!)" },
  { value: "report", label: "콘텐츠 신고" },
  { value: "other", label: "기타" },
];

export default function FeedbackModal({ isOpen, onClose, session }) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject || !content.trim()) {
      alert("문의 주제와 상세 내용을 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          content: content.trim(),
        }),
      });

      if (response.ok) {
        alert("피드백이 성공적으로 전송되었습니다. 소중한 의견 감사합니다!");
        setSubject("");
        setContent("");
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "피드백 전송에 실패했습니다.");
      }
    } catch (error) {
      console.error("피드백 전송 오류:", error);
      alert(`피드백 전송에 실패했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSubjectLabel =
    FEEDBACK_SUBJECTS.find((s) => s.value === subject)?.label ||
    "주제를 선택해주세요";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">다만홍 문의</h2>
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

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                문의 주제 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-left flex items-center justify-between"
                >
                  <span className={subject ? "text-gray-900" : "text-gray-500"}>
                    {selectedSubjectLabel}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {FEEDBACK_SUBJECTS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSubject(option.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                          subject === option.value
                            ? "bg-green-50 text-green-700"
                            : "text-gray-900"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                상세 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="개선하고 싶은 부분이나 문제점을 자세히 설명해주세요..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                maxLength={1000}
              />
              <div className="text-right text-xs text-gray-500">
                {content.length}/1000
              </div>
              <div className="text-sm text-green-600 mt-2">
                💬 로그인 하신 메일로 답장드릴게요
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading || !subject || !content.trim()}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "전송 중..." : "피드백 전송"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
