// src/pages/OnboardingPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";

// [API 명세 8.2] 카테고리 코드 및 한국어 매핑 (백엔드 Article.topic 값과 일치)
const TOPIC_LIST = [
  { id: "ai",       label: "AI / 기술", icon: "💻" },
  { id: "economy",  label: "경제",      icon: "📈" },
  { id: "sports",   label: "스포츠",    icon: "⚽" },
  { id: "culture",  label: "문화",      icon: "🎨" },
  { id: "politics", label: "정치",      icon: "🏛️" },
  { id: "science",  label: "과학",      icon: "🔬" },
  { id: "health",   label: "건강",      icon: "🏥" },
  { id: "world",    label: "국제",      icon: "🌍" },
  { id: "society",  label: "사회",      icon: "🤝" },
  { id: "entertain",label: "연예",      icon: "🎬" },
];

// 세부 카테고리 — ID는 백엔드 Article.tags 키와 일치해야 함
const SUB_TOPICS = {
  ai: [
    { id: "llm",         label: "AI/머신러닝" },
    { id: "semiconductor", label: "반도체" },
    { id: "mobile",      label: "스마트폰" },
    { id: "startup",     label: "소프트웨어/스타트업" },
    { id: "game_tech",   label: "게임" },
    { id: "cloud",       label: "클라우드" },
  ],
  economy: [
    { id: "stock",       label: "주식" },
    { id: "realestate",  label: "부동산" },
    { id: "crypto",      label: "암호화폐" },
    { id: "exchange",    label: "환율" },
    { id: "company",     label: "창업/스타트업" },
    { id: "trade",       label: "무역/소비" },
  ],
  sports: [
    { id: "football",    label: "축구" },
    { id: "baseball",    label: "야구" },
    { id: "volleyball",  label: "배구" },
    { id: "basketball",  label: "농구" },
    { id: "tennis",      label: "테니스" },
    { id: "golf",        label: "골프" },
    { id: "esports",     label: "e스포츠" },
  ],
  culture: [
    { id: "movie",       label: "영화" },
    { id: "music",       label: "음악" },
    { id: "art",         label: "미술/전시" },
    { id: "book",        label: "도서" },
    { id: "fashion",     label: "패션" },
    { id: "food",        label: "음식" },
  ],
  politics: [
    { id: "domestic",    label: "국내정치" },
    { id: "election",    label: "선거" },
    { id: "foreign",     label: "외교" },
    { id: "policy",      label: "법/정책" },
    { id: "northkorea",  label: "북한" },
  ],
  science: [
    { id: "space",       label: "우주" },
    { id: "environment", label: "환경" },
    { id: "biology",     label: "생명과학" },
    { id: "physics",     label: "물리/화학" },
    { id: "robot",       label: "로봇/기계" },
  ],
  health: [
    { id: "medical",     label: "의학/의료" },
    { id: "fitness",     label: "운동/피트니스" },
    { id: "mental",      label: "정신건강" },
    { id: "diet",        label: "다이어트" },
    { id: "pharma",      label: "제약/바이오" },
  ],
  world: [
    { id: "us",          label: "미국" },
    { id: "europe",      label: "유럽" },
    { id: "china",       label: "중국" },
    { id: "japan",       label: "일본" },
    { id: "middleeast",  label: "중동" },
    { id: "asia",        label: "동남아" },
  ],
  society: [
    { id: "education",   label: "교육" },
    { id: "welfare",     label: "복지" },
    { id: "crime",       label: "범죄/사건사고" },
    { id: "human_rights",label: "인권" },
    { id: "labor",       label: "노동" },
  ],
  entertain: [
    { id: "kpop",        label: "K-pop" },
    { id: "drama",       label: "드라마" },
    { id: "movie",       label: "영화" },
    { id: "variety",     label: "예능" },
    { id: "kmusic",      label: "가요" },
  ],
};

function OnboardingPage() {
  const navigate = useNavigate();
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedSubTopics, setSelectedSubTopics] = useState({});
  const [customSubs, setCustomSubs] = useState([]);
  const [customSubInput, setCustomSubInput] = useState('');
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

    // 선택된 세부 카테고리 ID 목록 (사전 정의된 것만 sub_topics로)
    const allSubTopicIds = Object.values(selectedSubTopics).flat();

    // 커스텀 직접 입력 + 텍스트 키워드 입력 → keywords로 합산
    const mergedKeywords = [...new Set([...keywords, ...customSubs])];

    try {
      await apiClient.put('/api/user/preferences', {
        topics: selectedTopics,
        keywords: mergedKeywords,
        sub_topics: allSubTopicIds,
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

              {/* 직접 입력 */}
              <div className="border-t border-slate-200 pt-5">
                <p className="text-sm font-semibold text-slate-600 mb-3">원하는 항목이 없으면 직접 입력해보세요</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={customSubInput}
                    onChange={e => setCustomSubInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const v = customSubInput.trim();
                        if (v && !customSubs.includes(v)) setCustomSubs(prev => [...prev, v]);
                        setCustomSubInput('');
                      }
                    }}
                    placeholder="예: 반도체, 챗GPT ..."
                    className="flex-1 px-4 py-2 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  />
                  <button
                    onClick={() => {
                      const v = customSubInput.trim();
                      if (v && !customSubs.includes(v)) setCustomSubs(prev => [...prev, v]);
                      setCustomSubInput('');
                    }}
                    disabled={!customSubInput.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40"
                  >
                    + 추가
                  </button>
                </div>
                {customSubs.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customSubs.map(tag => (
                      <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-600 text-white">
                        {tag}
                        <button onClick={() => setCustomSubs(prev => prev.filter(t => t !== tag))} className="hover:text-indigo-200 transition">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
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
