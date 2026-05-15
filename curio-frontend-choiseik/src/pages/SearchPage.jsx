// src/pages/SearchPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, Clock, Trash2, X, ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// [API 명세 8.1] 검색 테스트를 위한 가짜 기사 데이터
const MOCK_ARTICLES = [
  { id: "art_1", title: "GPT-5 아키텍처의 새로운 추론 메커니즘 공개", source: "MIT Technology Review", published_at: "2026-03-23" },
  { id: "art_2", title: "글로벌 금리 동결 기조, 하반기 반도체 시장에 미칠 영향", source: "Bloomberg", published_at: "2026-03-23" },
  { id: "art_3", title: "애플, 새로운 AI 기능 탑재한 아이폰 18 발표", source: "The Verge", published_at: "2026-03-24" },
  { id: "art_4", title: "한국은행, 기준금리 0.25%p 인하 전격 결정", source: "한국경제", published_at: "2026-03-25" },
  { id: "art_5", title: "차세대 반도체 공정, 수율 90% 돌파 성공", source: "전자신문", published_at: "2026-03-26" }
];

function SearchPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  // 1. 컴포넌트 마운트 시 최근 검색어 불러오기 (FR-15)
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('curio_recent_searches') || '[]');
    setRecentSearches(saved);
  }, []);

  // 2. 300ms Debounce 로직 구현 (FR-14)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 3. Debounced 키워드가 변경될 때마다 실시간 검색 실행
  useEffect(() => {
    if (debouncedKeyword) {
      setIsSearching(true);
      // 백엔드 API 호출을 흉내내는 setTimeout
      setTimeout(() => {
        const results = MOCK_ARTICLES.filter(article => 
          article.title.toLowerCase().includes(debouncedKeyword.toLowerCase())
        );
        setSearchResults(results);
        setIsSearching(false);
      }, 400);
    } else {
      setSearchResults([]);
    }
  }, [debouncedKeyword]);

  // 최근 검색어 저장 (최대 10개, 중복 시 최상단 끌어올리기 - DB UPSERT 모사)
  const saveRecentSearch = (query) => {
    if (!query) return;
    let searches = [...recentSearches];
    searches = searches.filter(q => q !== query); // 중복 제거
    searches.unshift(query); // 맨 앞에 추가
    if (searches.length > 10) searches.pop(); // 10개 초과 시 마지막 삭제
    
    localStorage.setItem('curio_recent_searches', JSON.stringify(searches));
    setRecentSearches(searches);
  };

  // 기사 클릭 핸들러 (UC-04)
  const handleArticleClick = (article) => {
    saveRecentSearch(debouncedKeyword); // 클릭 시점에 검색어 확정 저장
    alert(`"${article.title}" 기사 원문으로 이동합니다.`);
  };

  // 최근 검색어 전체 삭제 (FR-16)
  const clearRecentSearches = () => {
    localStorage.removeItem('curio_recent_searches');
    setRecentSearches([]);
  };

  // 최근 검색어 개별 삭제
  const removeRecentSearch = (queryToRemove) => {
    const filtered = recentSearches.filter(q => q !== queryToRemove);
    localStorage.setItem('curio_recent_searches', JSON.stringify(filtered));
    setRecentSearches(filtered);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* 상단 검색 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="관심 있는 뉴스를 검색해보세요"
              className="w-full bg-slate-100 border-none rounded-full py-3 pl-12 pr-10 text-base focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              autoFocus
            />
            {keyword && (
              <button 
                onClick={() => setKeyword('')}
                className="absolute right-4 p-1 bg-slate-200 text-slate-500 rounded-full hover:bg-slate-300 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 키워드가 없을 때: 최근 검색어 표시 (UC-04A) */}
        {!keyword.trim() && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
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
              <div className="py-10 text-center text-slate-400 text-sm">최근 검색 내역이 없습니다.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((query, idx) => (
                  <div key={idx} className="flex items-center bg-white border border-slate-200 rounded-full pl-4 pr-1 py-1.5 shadow-sm hover:border-blue-300 hover:shadow-md transition">
                    <button onClick={() => setKeyword(query)} className="text-sm font-medium text-slate-700 mr-2">
                      {query}
                    </button>
                    <button onClick={() => removeRecentSearch(query)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* 키워드가 있을 때: 실시간 검색 결과 표시 */}
        {keyword.trim() && (
          <section>
            <p className="text-sm font-bold text-slate-500 mb-4 px-2">
              '{debouncedKeyword}' 검색 결과
            </p>

            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                <p>뉴스를 찾고 있습니다...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((article, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={article.id}
                    onClick={() => handleArticleClick(article)}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                        {article.source}
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 leading-snug">
                      {article.title}
                    </h4>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center">
                <Search className="w-12 h-12 text-slate-200 mb-4" />
                <p className="font-bold text-lg mb-1">검색 결과가 없습니다</p>
                <p className="text-sm">다른 키워드로 검색해보세요.</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default SearchPage;