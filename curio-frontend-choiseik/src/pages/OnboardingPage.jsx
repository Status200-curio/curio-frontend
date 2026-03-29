// src/pages/OnboardingPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 페이지 이동 도구
// import apiClient from '../api/client'; // 백엔드 연결 전이므로 일단 주석 처리해도 무방합니다.

// [API 명세 8.2] 카테고리 코드 및 한국어 매핑
const TOPIC_LIST = [
  { id: "ai", label: "AI / 기술", icon: "💻" },
  { id: "economy", label: "경제", icon: "📈" },
  { id: "sports", label: "스포츠", icon: "⚽" },
  { id: "culture", label: "문화", icon: "🎨" },
  { id: "politics", label: "정치", icon: "🏛️" },
  { id: "science", label: "과학", icon: "🔬" },
  { id: "health", label: "건강", icon: "🏥" },
  { id: "global", label: "국제", icon: "🌍" },
  { id: "society", label: "사회", icon: "🤝" },
  { id: "entertainment", label: "연예", icon: "🎬" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [keywordInput, setKeywordInput] = useState("");

  // 토픽 클릭 핸들러 (토글 방식)
  const toggleTopic = (topicId) => {
    if (selectedTopics.includes(topicId)) {
      setSelectedTopics(selectedTopics.filter((id) => id !== topicId));
    } else {
      setSelectedTopics([...selectedTopics, topicId]);
    }
  };

  // 폼 제출 핸들러 (가짜 성공 로직 적용)
  const handleSubmit = async () => {
    const keywords = keywordInput
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // --- [테스트를 위한 Mock 로직 시작] ---
    console.log("선택된 데이터:", { topics: selectedTopics, keywords });
    alert("관심사 설정이 완료되었습니다! 맞춤형 피드로 이동합니다.");

    // 무조건 성공했다고 가정하고 메인 피드로 넘깁니다.
    navigate("/feed");
    return;
    // --- [테스트를 위한 Mock 로직 끝] ---

    /* 백엔드 서버가 켜지면 아래 주석을 풀고 사용하세요.
    const payload = {
      topics: selectedTopics,
      keywords: keywords,
      digest_frequency: 'daily',
      digest_time: '08:00',
      ai_summary_depth: 'balanced'
    };

    try {
      await apiClient.put('/api/user/preferences', payload);
      alert('관심사 설정이 완료되었습니다!');
      navigate('/feed');
    } catch (error) {
      alert('설정 저장 중 오류가 발생했습니다.');
    }
    */
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-20 pb-12 px-4 font-sans">
      <div className="w-full max-w-2xl bg-white p-10 rounded-[40px] shadow-xl border border-slate-100">
        {/* 헤더 영역 */}
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1.5 mb-4 text-sm font-bold text-blue-600 bg-blue-50 rounded-full">
            1단계 / 1단계
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3">
            어떤 뉴스에 관심이 있으신가요?
          </h1>
          <p className="text-slate-500">
            관심사를 선택해주시면 Curio가 맞춤형 피드를 만들어 드립니다.
          </p>
        </div>

        {/* 관심 카테고리 선택 영역 */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            관심 카테고리 (최소 1개 선택)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {TOPIC_LIST.map((topic) => {
              const isSelected = selectedTopics.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                      : "border-slate-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-3xl mb-3">{topic.icon}</span>
                  <span className="font-bold">{topic.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 관심 키워드 입력 영역 */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            세부 관심 키워드{" "}
            <span className="text-slate-400 font-normal text-sm">(선택)</span>
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            특별히 챙겨보고 싶은 키워드가 있다면 쉼표(,)로 구분해서 적어주세요.
          </p>
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="예: 반도체, 챗GPT, 금리인하"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* 하단 완료 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={selectedTopics.length === 0}
            className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
              selectedTopics.length > 0
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:-translate-y-1"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            Curio 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
