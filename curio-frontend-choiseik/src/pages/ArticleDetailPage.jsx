// src/pages/ArticleDetailPage.jsx
// 뉴스레터 이메일의 "Curio에서 더 읽기" 링크 → /article/:id 로 진입 시 표시
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink, ChevronLeft } from 'lucide-react';
import { articlesApi } from '../api/articles';
import { DEFAULT_IMAGE } from '../api/articles';
import { useTheme } from '../context/ThemeContext';
import { useDwellTime } from '../hooks/useDwellTime';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useDwellTime(article?.id);

  // 비로그인 시 로그인 페이지로 리다이렉트 (로그인 후 이 페이지로 복귀)
  useEffect(() => {
    if (!localStorage.getItem('curio_access_token')) {
      navigate(`/?redirect=/article/${id}`, { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    if (!localStorage.getItem('curio_access_token')) return;
    articlesApi.getArticleById(id)
      .then(res => {
        setArticle(res.data?.article ?? res.data ?? null);
      })
      .catch(err => {
        if (err?.response?.status === 404) setNotFound(true);
        else console.error('[ArticleDetailPage] 로딩 실패:', err.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const thumbnail = article?.thumbnail_url || article?.image_url || DEFAULT_IMAGE;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
        <p className="text-xl font-bold">기사를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/feed')} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
          피드로 이동
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} font-sans transition-colors duration-300`}>
      {/* 상단 헤더 */}
      <header className={`sticky top-0 z-40 border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} transition-colors`}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/feed')} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="font-bold text-sm truncate">{article.source_name ?? ''}</span>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 썸네일 */}
        <img
          src={thumbnail}
          alt={article.title}
          className="w-full h-56 object-cover rounded-2xl mb-6"
          onError={e => { e.target.src = DEFAULT_IMAGE; }}
        />

        {/* 출처 & 날짜 */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
          <span className="font-semibold">{article.source_name ?? ''}</span>
          {article.published_at && (
            <>
              <span>·</span>
              <span>{new Date(article.published_at).toLocaleDateString('ko-KR')}</span>
            </>
          )}
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-black leading-snug mb-6">{article.title}</h1>

        {/* AI 요약 */}
        {(article.ai_summary || article.summary) && (
          <div className="bg-blue-50 dark:bg-blue-950/40 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/50 mb-4">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">AI 요약</p>
            <p className="text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {article.ai_summary ?? article.summary}
            </p>
          </div>
        )}

        {/* AI 인사이트 */}
        {(article.ai_insight || article.insight) && (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/50 mb-6">
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2">AI 인사이트</p>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
              {article.ai_insight ?? article.insight}
            </p>
          </div>
        )}

        {/* 원문 보기 버튼 */}
        {article.original_url && (
          <a
            href={article.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition"
          >
            <ExternalLink className="w-4 h-4" />
            원문 보기
          </a>
        )}
      </main>
    </div>
  );
}
