// src/pages/SearchPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, Clock, X, Loader2, BookOpen, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { articlesApi } from '../api/articles';
import { DEFAULT_IMAGE } from '../api/articles';
import { useTheme } from '../context/ThemeContext';

const TOPIC_LABELS = {
  ai: 'AI/기술', economy: '경제', sports: '스포츠', culture: '문화',
  politics: '정치', science: '과학', health: '건강', world: '국제',
  society: '사회', entertain: '연예',
};

function SearchPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [keyword, setKeyword]             = useState('');
  const [isSearching, setIsSearching]     = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched]     = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const debounceRef = useRef(null);

  // 최근 검색어 로드
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('curio_recent_searches') || '[]');
      setRecentSearches(Array.isArray(saved) ? saved : []);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const saveRecentSearch = (query) => {
    if (!query.trim()) return;
    const next = [query, ...recentSearches.filter(q => q !== query)].slice(0, 10);
    localStorage.setItem('curio_recent_searches', JSON.stringify(next));
    setRecentSearches(next);
  };

  const removeRecentSearch = (query) => {
    const next = recentSearches.filter(q => q !== query);
    localStorage.setItem('curio_recent_searches', JSON.stringify(next));
    setRecentSearches(next);
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('curio_recent_searches');
    setRecentSearches([]);
  };

  // 검색어 변경 → 300ms debounce
  useEffect(() => {
    const q = keyword.trim();
    if (!q) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(false);
      try {
        const res = await articlesApi.searchArticles(q, 1);
        setSearchResults(res?.data?.articles ?? []);
        saveRecentSearch(q);
      } catch (err) {
        console.error('[SearchPage] 검색 실패:', err.response?.status, err.message);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
        setHasSearched(true);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [keyword]);

  const handleClear = () => {
    setKeyword('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleBookmarkToggle = async (e, article) => {
    e.stopPropagation();
    try {
      await articlesApi.toggleBookmark(article.id);
      setSearchResults(prev =>
        prev.map(a => a.id === article.id ? { ...a, is_saved: !a.is_saved } : a)
      );
    } catch (err) {
      console.error('[SearchPage] 북마크 실패:', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      {/* 상단 검색 헤더 */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="관심 있는 뉴스를 검색해보세요"
              className="w-full bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500 border-none rounded-full py-3 pl-12 pr-10 text-base focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition"
              autoFocus
            />
            {keyword && (
              <button
                onClick={handleClear}
                className="absolute right-4 p-1 bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 rounded-full hover:bg-slate-300 dark:hover:bg-slate-500 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* 검색어 없을 때 — 최근 검색어 */}
          {!keyword.trim() && (
            <motion.section key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  최근 검색어
                </h3>
                {recentSearches.length > 0 && (
                  <button onClick={clearRecentSearches} className="text-sm font-bold text-slate-400 hover:text-red-500 transition">
                    전체 삭제
                  </button>
                )}
              </div>
              {recentSearches.length === 0 ? (
                <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">최근 검색 내역이 없습니다.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((query, idx) => (
                    <div key={idx} className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-4 pr-1 py-1.5 shadow-sm hover:border-blue-300 transition">
                      <button onClick={() => setKeyword(query)} className="text-sm font-medium text-slate-700 dark:text-slate-200 mr-2">{query}</button>
                      <button onClick={() => removeRecentSearch(query)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {/* 검색 결과 */}
          {keyword.trim() && (
            <motion.section key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 px-1">
                '{keyword.trim()}' 검색 결과
              </p>

              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                  <p className="text-sm">뉴스를 찾고 있습니다...</p>
                </div>
              ) : hasSearched && searchResults.length === 0 ? (
                <div className="py-20 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                  <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-4" />
                  <p className="font-bold text-lg mb-1">검색 결과가 없습니다</p>
                  <p className="text-sm">다른 키워드로 검색해보세요.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((article, idx) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => article.original_url && window.open(article.original_url, '_blank', 'noopener,noreferrer')}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 cursor-pointer transition overflow-hidden"
                    >
                      {/* 썸네일 */}
                      <img
                        src={article.thumbnail_url || DEFAULT_IMAGE}
                        alt={article.title}
                        className="w-full h-40 object-cover"
                        onError={e => { e.target.src = DEFAULT_IMAGE; }}
                      />

                      <div className="p-4">
                        {/* 카테고리 + 언론사 + 북마크 */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {article.topic && (
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-md">
                                {TOPIC_LABELS[article.topic] ?? article.topic}
                              </span>
                            )}
                            <span className="text-xs text-slate-400 dark:text-slate-500">{article.source_name}</span>
                          </div>
                          <button
                            onClick={(e) => handleBookmarkToggle(e, article)}
                            className={`p-1.5 rounded-lg transition ${article.is_saved ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500'}`}
                          >
                            <Bookmark className={`w-4 h-4 ${article.is_saved ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* 제목 */}
                        <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2">
                          {article.title}
                        </h4>

                        {/* 날짜 */}
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {article.published_at?.slice(0, 10)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}

export default SearchPage;
