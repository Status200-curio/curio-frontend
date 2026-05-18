// src/components/ArticleModal.jsx
import { useEffect } from 'react';
import { X, ExternalLink, Headphones, Pause } from 'lucide-react';
import { DEFAULT_IMAGE } from '../api/articles';
import { useDwellTime } from '../hooks/useDwellTime';

export default function ArticleModal({ article, onClose, onListen, isPlayingThis }) {
  useDwellTime(article?.id);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!article) return null;

  const thumbnail = article.thumbnail_url || article.image_url || DEFAULT_IMAGE;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 본체 */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl flex flex-col">
        {/* 썸네일 */}
        <div className="relative w-full h-56 shrink-0">
          <img
            src={thumbnail}
            alt={article.title}
            className="w-full h-full object-cover rounded-t-[32px]"
            onError={e => { e.target.src = DEFAULT_IMAGE; }}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-8 flex flex-col gap-5">
          {/* 출처 & 날짜 */}
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold">{article.source?.name ?? article.source_name ?? ''}</span>
            {article.published_at && (
              <>
                <span>·</span>
                <span>{new Date(article.published_at).toLocaleDateString('ko-KR')}</span>
              </>
            )}
          </div>

          {/* 제목 */}
          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-snug">
            {article.title}
          </h2>

          {/* AI 요약 */}
          {article.ai_summary && (
            <div className="bg-blue-50 dark:bg-blue-950/40 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/50">
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3">AI 요약</p>
              <p className="text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{article.ai_summary}</p>
            </div>
          )}

          {/* AI 인사이트 */}
          {article.ai_insight && (
            <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/50">
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3">AI 인사이트</p>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{article.ai_insight}</p>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-2">
            {onListen && (
              <button
                onClick={onListen}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {isPlayingThis ? <Pause className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                {isPlayingThis ? '일시정지' : '듣기'}
              </button>
            )}
            {article.source?.url && (
              <a
                href={article.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
              >
                <ExternalLink className="w-4 h-4" />
                원문 보기
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
