// src/pages/OnboardingPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";

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

const SUB_TOPICS = {
  ai: [
    { id: "ai_ml", label: "AI/머신러닝" },
    { id: "ai_semiconductor", label: "반도체" },
    { id: "ai_smartphone", label: "스마트폰" },
    { id: "ai_software", label: "소프트웨어" },
    { id: "ai_game", label: "게임" },
    { id: "ai_space", label: "우주/항공" },
  ],
  economy: [
    { id: "eco_stock", label: "주식" },
    { id: "eco_realestate", label: "부동산" },
    { id: "eco_crypto", label: "암호화폐" },
    { id: "eco_exchange", label: "환율" },
    { id: "eco_startup", label: "창업/스타트업" },
    { id: "eco_price", label: "소비/물가" },
  ],
  sports: [
    { id: "sp_soccer", label: "축구" },
    { id: "sp_baseball", label: "야구" },
    { id: "sp_volleyball", label: "배구" },
    { id: "sp_basketball", label: "농구" },
    { id: "sp_tennis", label: "테니스" },
    { id: "sp_golf", label: "골프" },
    { id: "sp_esports", label: "e스포츠" },
  ],
  culture: [
    { id: "cu_movie", label: "영화" },
    { id: "cu_music", label: "음악" },
    { id: "cu_art", label: "미술/전시" },
    { id: "cu_book", label: "책/문학" },
    { id: "cu_fashion", label: "패션" },
    { id: "cu_food", label: "음식" },
  ],
  politics: [
    { id: "po_domestic", label: "국내정치" },
    { id: "po_election", label: "선거" },
    { id: "po_diplomacy", label: "외교" },
    { id: "po_law", label: "법/정책" },
    { id: "po_defense", label: "국방" },
  ],
  science: [
    { id: "sc_space", label: "우주" },
    { id: "sc_environment", label: "환경" },
    { id: "sc_biology", label: "생물학" },
    { id: "sc_physics", label: "물리학" },
    { id: "sc_chemistry", label: "화학" },
  ],
  health: [
    { id: "he_medicine", label: "의학" },
    { id: "he_fitness", label: "운동/피트니스" },
    { id: "he_mental", label: "정신건강" },
    { id: "he_diet", label: "다이어트" },
    { id: "he_policy", label: "의료정책" },
  ],
  global: [
    { id: "gl_us", label: "미국" },
    { id: "gl_europe", label: "유럽" },
    { id: "gl_china", label: "중국" },
    { id: "gl_japan", label: "일본" },
    { id: "gl_middleeast", label: "중동" },
    { id: "gl_asia", label: "동남아" },
  ],
  society: [
    { id: "so_education", label: "교육" },
    { id: "so_welfare", label: "복지" },
    { id: "so_crime", label: "범죄" },
    { id: "so_environment", label: "환경" },
    { id: "so_rights", label: "인권" },
  ],
  entertainment: [
    { id: "en_kpop", label: "K-pop" },
    { id: "en_drama", label: "드라마" },
    { id: "en_movie", label: "영화" },
    { id: "en_variety", label: "예능" },
    { id: "en_youtube", label: "유튜버" },
  ],
};

function OnboardingPage() {
  const navigate = useNavigate();
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedSubTopics, setSelectedSubTopics] = useState({});
  const [keywordInput, setKeywordInput] = useState("");

  // 메인 카테고리 토글
  const toggleTopic = (topicId) => {
    if (selectedTopics.includes(topicId)) {
      setSelectedTopics(selectedTopics.filter((id) => id !== topicId));
      // 메인 카테고리 해제 시 해당 세부 카테고리도 초기화
      setSelectedSubTopics((prev) => {
        const next = { ...prev };
        delete next[topicId];
        return next;
      });
    } else {
      setSelectedTopics([...selectedTopics, topicId]);
    }
  };

  // 세부 카테고리 토글
  const toggleSubTopic = (topicId, subId) => {
    const current = selectedSubTopics[topicId] || [];
    const updated = current.includes(subId)
      ? current.filter((id) => id !== subId)
      : [...current, subId];
    setSelectedSubTopics({ ...selectedSubTopics, [topicId]: updated });
  };

  // 폼 제출
  const handleSubmit = async () => {
    const keywords = keywordInput
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // 세부 카테고리를 keywords에 병합 (백엔드 keywords 필드로 전달)
    const allSubTopicLabels = Object.values(selectedSubTopics).flat().map((subId) => {
      for (const subs of Object.values(SUB_TOPICS)) {
        const found = subs.find((s) => s.id === subId);
        if (found) return found.label;
      }
      return subId;
    });
    const mergedKeywords = [...new Set([...keywords, ...allSubTopicLabels])];

    try {
      await apiClient.put('/api/user/preferences', {
        topics: selectedTopics,
        keywords: mergedKeywords,
      });
      navigate("/feed");
    } catch (error) {
      alert("설정 저장에 실패했습니다. 다시 시도해주세요.");
      console.error(error);
    }
  };

  // 선택된 메인 카테고리 중 TOPIC_LIST 순서대로 정렬
  const selectedTopicObjs = TOPIC_LIST.filter((t) =>
    selectedTopics.includes(t.id)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-20 pb-12 px-4 font-sans">
      <div className="w-full max-w-2xl bg-white p-10 rounded-[40px] shadow-xl border border-slate-100">
        {/* 헤더 */}
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

        {/* 메인 카테고리 */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            관심 카테고리 <span className="text-slate-400 font-normal text-sm">(최소 1개 선택)</span>
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

        {/* 세부 카테고리 섹션 (선택된 메인 카테고리가 있을 때만 표시) */}
        {selectedTopicObjs.length > 0 && (
          <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              세부 카테고리
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              더 관심 있는 세부 분야를 골라보세요. <span className="text-slate-400">(선택)</span>
            </p>
            <div className="flex flex-col gap-6">
              {selectedTopicObjs.map((topic) => {
                const subs = SUB_TOPICS[topic.id] || [];
                const selectedSubs = selectedSubTopics[topic.id] || [];
                return (
                  <div key={topic.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{topic.icon}</span>
                      <span className="font-bold text-slate-700">{topic.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subs.map((sub) => {
                        const isSubSelected = selectedSubs.includes(sub.id);
                        return (
                          <button
                            key={sub.id}
                            onClick={() => toggleSubTopic(topic.id, sub.id)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150 ${
                              isSubSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                            }`}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 관심 키워드 */}
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

        {/* 완료 버튼 */}
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
