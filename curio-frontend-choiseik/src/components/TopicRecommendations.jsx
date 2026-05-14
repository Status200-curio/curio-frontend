// src/components/TopicRecommendations.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import { userApi } from '../api/userApi';

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
    const cached = sessionStorage.getItem('topic_recommendations');
    if (cached) {
      try {
        setRecommendations(JSON.parse(cached));
        setLoading(false);
        return;
      } catch (_) {}
    }
    userApi.getRecommendations()
      .then(res => {
        const recs = res.data?.recommendations ?? [];
        setRecommendations(recs);
        if (recs.length > 0) {
          sessionStorage.setItem('topic_recommendations', JSON.stringify(recs));
        }
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
          return (
            <div
              key={rec.topic}
              className={`flex items-center justify-between p-5 rounded-2xl transition-colors ${isDarkMode ? 'bg-slate-700/60' : 'bg-slate-50'}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-3xl shrink-0">{meta.icon}</span>
                <div className="min-w-0">
                  <p className="font-bold text-base">{meta.label}</p>
                  <p className={`text-sm truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{rec.reason}</p>
                </div>
              </div>
              <button
                onClick={() => handleGoToTopic(rec.topic)}
                disabled={isAdding}
                className="ml-4 shrink-0 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
              >
                {isAdding ? '추가 중...' : '보러가기'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
