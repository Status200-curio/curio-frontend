// src/components/WeeklyTopReads.jsx
import { useState, useEffect } from 'react';
import { Trophy, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { userApi } from '../api/userApi';
import { TOPIC_IMAGES, DEFAULT_IMAGE } from '../api/articles';

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return null;
  if (seconds < 60) return `총 ${seconds}초 읽음`;
  return `총 ${Math.floor(seconds / 60)}분 읽음`;
}

export default function WeeklyTopReads({ isDarkMode, userName }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getTopReads()
      .then(res => {
        setArticles(res.data?.top_reads ?? []);
      })
      .catch(e => console.error('[WeeklyTopReads] 로딩 실패:', e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-8 rounded-[32px] shadow-sm border transition-colors duration-300`}>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Trophy className="w-7 h-7 text-amber-500" />
        이번 주 {userName ? `${userName}님이` : ''} 가장 오래 읽은 뉴스 TOP 3
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : articles.length === 0 ? (
        <p className={`text-center py-10 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          이번 주 읽은 기사가 없습니다.
        </p>
      ) : (
        <div className="space-y-4">
          {articles.slice(0, 3).map((article, idx) => {
            const thumbnail = article.image_url || TOPIC_IMAGES[article.topic] || DEFAULT_IMAGE;
            const durationLabel = formatDuration(article.duration_seconds);
            return (
              <div
                key={article.id ?? idx}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${isDarkMode ? 'bg-slate-700/60' : 'bg-slate-50'}`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  idx === 0 ? 'bg-amber-100 text-amber-600' :
                  idx === 1 ? 'bg-slate-200 text-slate-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {idx + 1}
                </span>
                <img
                  src={thumbnail}
                  alt={article.title}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                  onError={e => { e.target.src = DEFAULT_IMAGE; }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-snug line-clamp-2">{article.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {article.source_name ?? article.source?.name ?? ''}
                    </p>
                    {durationLabel && (
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-500'}`}>
                        <Clock className="w-3 h-3" />
                        {durationLabel}
                      </span>
                    )}
                  </div>
                </div>
                {article.original_url && (
                  <a
                    href={article.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-blue-600 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
