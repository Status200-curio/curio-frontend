// src/components/TopicRecommendations.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { userApi } from '../api/userApi';
import { TOPIC_IMAGES, DEFAULT_IMAGE } from '../api/articles';

const TOPIC_META = {
  ai:       { label: 'AI / 기술', icon: '💻' },
  economy:  { label: '경제',      icon: '📈' },
  sports:   { label: '스포츠',    icon: '⚽' },
  culture:  { label: '문화',      icon: '🎨' },
  politics: { label: '정치',      icon: '🏛️' },
  science:  { label: '과학',      icon: '🔬' },
  health:   { label: '건강',      icon: '🏥' },
  world:    { label: '국제',      icon: '🌍' },
  society:  { label: '사회',      icon: '🤝' },
  entertain:{ label: '연예',      icon: '🎬' },
};

export default function TopicRecommendations({ isDarkMode }) {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingTopic, setAddingTopic] = useState(null);

  useEffect(() => {
    // 세션 캐시 초기화 후 재요청 (기사 데이터 포함 버전으로)
    sessionStorage.removeItem('topic_recommendations');
    userApi.getRecommendations()
      .then(res => {
        const recs = res.data?.recommendations ?? [];
        setRecommendations(recs);
      })
      .catch(e => console.error('[TopicRecommendations] 로딩 실패:', e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleGoToTopic = async (topic) => {
    setAddingTopic(topic);
    try {
      const meRes = await userApi.getMe();
      const pref = meRes.data?.preferences ?? {};
      const currentTopics = pref.topics ?? [];
      const newTopics = currentTopics.includes(topic)
        ? currentTopics
        : [...currentTopics, topic];
      await userApi.updatePreferences({ topics: newTopics });
    } catch (e) {
      console.error('[TopicRecommendations] 주제 추가 실패:', e.message);
    } finally {
      setAddingTopic(null);
      navigate('/feed');
    }
  };

  if (loading) {
    return (
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-8 rounded-[32px] shadow-sm border transition-colors duration-300`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-8 rounded-[32px] shadow-sm border transition-colors duration-300`}>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Sparkles className="w-7 h-7 text-blue-600" />
        이런 주제는 어떠세요?
      </h2>
      <div className="space-y-4">
        {recommendations.map((rec) => {
          const meta = TOPIC_META[rec.topic] ?? { label: rec.topic, icon: '📰' };
          const isAdding = addingTopic === rec.topic;
          const thumbnail = TOPIC_IMAGES[rec.article?.topic] || DEFAULT_IMAGE;

          return (
            <div
              key={rec.topic}
              className={`rounded-2xl overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-700/60' : 'bg-slate-50'}`}
            >
              {/* 읽기 컨텍스트 헤더 (읽기 기록 기반 추천일 때만) */}
              {rec.source_label && rec.time_str && (
                <div className={`px-4 py-2.5 flex items-center gap-2 text-xs ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    <span className="font-semibold">{rec.source_label}</span>을(를) {rec.time_str} 읽으셨네요 —&nbsp;
                    {rec.reason}
                  </span>
                </div>
              )}

              {/* 기사 카드 본문 */}
              <div className="flex items-center gap-4 p-4">
                {/* 썸네일 */}
                <img
                  src={thumbnail}
                  alt={rec.article?.title ?? meta.label}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                  onError={e => { e.target.src = DEFAULT_IMAGE; }}
                />

                {/* 텍스트 영역 */}
                <div className="flex-1 min-w-0">
                  {/* 토픽 뱃지 */}
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 ${isDarkMode ? 'bg-slate-600 text-slate-200' : 'bg-slate-200 text-slate-600'}`}>
                    {meta.icon} {meta.label}
                  </span>

                  {/* 기사 제목 */}
                  {rec.article?.title ? (
                    <p className={`text-sm font-semibold leading-snug line-clamp-2 mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      {rec.article.title}
                    </p>
                  ) : (
                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {rec.reason}
                    </p>
                  )}

                  {/* 버튼 행 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGoToTopic(rec.topic)}
                      disabled={isAdding}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
                    >
                      {isAdding ? '추가 중...' : `${meta.label} 보러가기`}
                    </button>
                    {rec.article?.original_url && (
                      <a
                        href={rec.article.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1.5 rounded-lg transition ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-400 hover:text-blue-600'}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
