// src/pages/MyPage.jsx
import { useState, useEffect } from 'react';
import {
  BookOpen, Calendar, Flame, Award, ChevronLeft, Bell,
  Moon, LogOut, UserMinus, AlertTriangle, Tag, Clock, Trash2, ExternalLink, X, Check, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '../api/userApi';
import { articlesApi } from '../api/articles';
import { useTheme } from '../context/ThemeContext';
import WeeklyTopReads from '../components/WeeklyTopReads';
import TopicRecommendations from '../components/TopicRecommendations';

// 백엔드 topic ID → 레이블/아이콘
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

// 환경설정 모달용 카테고리 목록 (백엔드 ID 기준)
export const TOPIC_LIST = Object.entries(TOPIC_META).map(([id, { label, icon }]) => ({ id, label, icon }));

// 세부 카테고리 — ID는 백엔드 Article.tags 키와 일치 (OnboardingPage와 동일)
const SUB_TOPIC_MAP = {
  ai:       [{ key: 'llm', label: 'AI/머신러닝' }, { key: 'semiconductor', label: '반도체' }, { key: 'mobile', label: '스마트폰' }, { key: 'startup', label: '소프트웨어/스타트업' }, { key: 'game_tech', label: '게임' }, { key: 'cloud', label: '클라우드' }],
  economy:  [{ key: 'stock', label: '주식' }, { key: 'realestate', label: '부동산' }, { key: 'crypto', label: '암호화폐' }, { key: 'exchange', label: '환율' }, { key: 'company', label: '창업/스타트업' }, { key: 'trade', label: '무역/소비' }],
  sports:   [{ key: 'football', label: '축구' }, { key: 'baseball', label: '야구' }, { key: 'volleyball', label: '배구' }, { key: 'basketball', label: '농구' }, { key: 'tennis', label: '테니스' }, { key: 'golf', label: '골프' }, { key: 'esports', label: 'e스포츠' }],
  culture:  [{ key: 'movie', label: '영화' }, { key: 'music', label: '음악' }, { key: 'art', label: '미술/전시' }, { key: 'book', label: '도서' }, { key: 'fashion', label: '패션' }, { key: 'food', label: '음식' }],
  politics: [{ key: 'domestic', label: '국내정치' }, { key: 'election', label: '선거' }, { key: 'foreign', label: '외교' }, { key: 'policy', label: '법/정책' }, { key: 'northkorea', label: '북한' }],
  science:  [{ key: 'space', label: '우주' }, { key: 'environment', label: '환경' }, { key: 'biology', label: '생명과학' }, { key: 'physics', label: '물리/화학' }, { key: 'robot', label: '로봇/기계' }],
  health:   [{ key: 'medical', label: '의학/의료' }, { key: 'fitness', label: '운동/피트니스' }, { key: 'mental', label: '정신건강' }, { key: 'diet', label: '다이어트' }, { key: 'pharma', label: '제약/바이오' }],
  world:    [{ key: 'us', label: '미국' }, { key: 'europe', label: '유럽' }, { key: 'china', label: '중국' }, { key: 'japan', label: '일본' }, { key: 'middleeast', label: '중동' }, { key: 'asia', label: '동남아' }],
  society:  [{ key: 'education', label: '교육' }, { key: 'welfare', label: '복지' }, { key: 'crime', label: '범죄/사건사고' }, { key: 'human_rights', label: '인권' }, { key: 'labor', label: '노동' }],
  entertain:[{ key: 'kpop', label: 'K-pop' }, { key: 'drama', label: '드라마' }, { key: 'movie', label: '영화' }, { key: 'variety', label: '예능' }, { key: 'kmusic', label: '가요' }],
};

function MyPage() {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme, syncThemeFromServer } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState(false);
  const [isDigestModalOpen, setIsDigestModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('전체');
  const [selectedDate, setSelectedDate] = useState('전체');

  // ── API 데이터 상태 ──────────────────────────────────────────
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [bookmarks, setBookmarks] = useState([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);

  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [userSettings, setUserSettings] = useState({
    selectedTopics: [],
    selectedSubTopics: [],
    digestFrequency: 'daily',
    digestTime: '08:00',
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // ── 데이터 페칭 ──────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'dashboard')  fetchStats();
    if (activeTab === 'bookmarks')  fetchBookmarks();
    if (activeTab === 'history')    fetchHistory();
    if (activeTab === 'settings')   fetchSettings();
  }, [activeTab]);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const [statsRes, meRes] = await Promise.all([
        userApi.getStats(),
        userApi.getMe(),
      ]);
      setStats(statsRes.data);
      setUserName(meRes.data?.name ?? '');
    } catch (e) {
      console.error('[MyPage] stats 로딩 실패:', e.response?.status, e.message);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchBookmarks = async () => {
    setIsLoadingBookmarks(true);
    try {
      const res = await articlesApi.getBookmarks();
      setBookmarks(res.data?.bookmarks ?? []);
    } catch (e) {
      console.error('[MyPage] bookmarks 로딩 실패:', e.response?.status, e.message);
    } finally {
      setIsLoadingBookmarks(false);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await userApi.getHistory();
      setHistoryData(res.data?.articles ?? []);
    } catch (e) {
      console.error('[MyPage] history 로딩 실패:', e.response?.status, e.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await userApi.getMe();
      const pref = res.data?.preferences;
      if (pref) {
        setUserSettings({
          selectedTopics: pref.topics ?? [],
          selectedSubTopics: pref.sub_topics ?? [],
          selectedKeywords: pref.keywords ?? [],
          digestFrequency: pref.digest_frequency ?? 'daily',
          digestTime: pref.digest_time ?? '08:00',
        });
        // 테마 동기화는 App.jsx ThemeSyncer가 앱 시작 시 처리함 — 여기선 스킵
      }
    } catch (e) {
      console.error('[MyPage] settings 로딩 실패:', e.response?.status, e.message);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // ── 북마크 삭제 ──────────────────────────────────────────────
  const handleDeleteBookmark = async (bookmark) => {
    if (!window.confirm('정말 북마크를 삭제하시겠습니까?')) return;
    try {
      await articlesApi.toggleBookmark(bookmark.article_id);
      setBookmarks(prev => prev.filter(b => b.id !== bookmark.id));
    } catch (e) {
      console.error('[MyPage] 북마크 삭제 실패:', e.message);
      alert('삭제에 실패했습니다.');
    }
  };

  // ── 계정 ─────────────────────────────────────────────────────
  const handleLogout = () => {
    if (window.confirm('정말 로그아웃 하시겠습니까?')) {
      localStorage.removeItem('curio_access_token');
      localStorage.removeItem('curio_refresh_token');
      navigate('/');
    }
  };

  const handleWithdraw = () => {
    alert('회원 탈퇴가 완료되었습니다.');
    localStorage.removeItem('curio_access_token');
    localStorage.removeItem('curio_refresh_token');
    setIsWithdrawModalOpen(false);
    navigate('/');
  };

  // ── 설정 저장 ─────────────────────────────────────────────────
  const handleSaveTopics = async (newTopics, newSubTopics, newKeywords) => {
    try {
      await userApi.updatePreferences({ topics: newTopics, sub_topics: newSubTopics, keywords: newKeywords });
      setUserSettings(prev => ({ ...prev, selectedTopics: newTopics, selectedSubTopics: newSubTopics, selectedKeywords: newKeywords }));
    } catch (e) {
      console.error('[MyPage] 관심사 저장 실패:', e.message);
      alert('저장에 실패했습니다.');
    }
  };

  const handleSaveDigest = async (newFrequency, newTime) => {
    try {
      await userApi.updatePreferences({ digest_frequency: newFrequency, digest_time: newTime });
      setUserSettings(prev => ({ ...prev, digestFrequency: newFrequency, digestTime: newTime }));
    } catch (e) {
      console.error('[MyPage] 발송 설정 저장 실패:', e.message);
      alert('저장에 실패했습니다.');
    }
  };

  const handleToggleDarkMode = async () => {
    const newDark = !isDarkMode;
    toggleTheme(); // 즉시 UI 반영 (localStorage도 저장)
    try {
      await userApi.updatePreferences({ dark_mode: newDark }); // DB 저장
    } catch (e) {
      console.error('[MyPage] 다크모드 저장 실패:', e.message);
    }
  };

  // ── 유틸 ─────────────────────────────────────────────────────
  const getSelectedTopicLabels = () =>
    userSettings.selectedTopics
      .map(id => TOPIC_META[id]?.label)
      .filter(Boolean)
      .join(', ') || '선택된 카테고리 없음';

  // 북마크 태그 필터
  const allTags = ['전체', ...new Set(bookmarks.flatMap(b => b.tags ?? []))];
  const filteredBookmarks = selectedTag === '전체' ? bookmarks : bookmarks.filter(b => b.tags?.includes(selectedTag));

  // 읽은 기사 날짜 필터
  const allDates = ['전체', ...new Set(historyData.map(h => h.viewed_at?.slice(0, 10)).filter(Boolean))];
  const filteredHistory = selectedDate === '전체'
    ? historyData
    : historyData.filter(h => h.viewed_at?.startsWith(selectedDate));

  // 로딩 스피너 공통
  const Spinner = () => (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className={`min-h-screen font-sans pb-16 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
      {/* 상단 헤더 */}
      <header className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b sticky top-0 z-10 w-full transition-colors duration-300`}>
        <div className="max-w-[1400px] mx-auto px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/feed')} className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-500'}`}>
              <ChevronLeft className="w-7 h-7" />
            </button>
            <h1 className="text-2xl font-black">개인 페이지</h1>
          </div>
          <div className="w-10" />
        </div>
        <div className="max-w-[1400px] mx-auto px-10 flex gap-10 overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: '대시보드' },
            { id: 'bookmarks', label: '북마크' },
            { id: 'history',   label: '읽은 기사' },
            { id: 'settings',  label: '환경설정' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-5 text-base font-bold whitespace-nowrap border-b-4 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : `border-transparent ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── 탭 1. 대시보드 ── */}
      {activeTab === 'dashboard' && (
        <main className="max-w-[1400px] mx-auto px-10 py-12 grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-10 animate-slide-up">
          <section className="space-y-10">
            {/* ── 이번 주 TOP 3 ── */}
            <WeeklyTopReads isDarkMode={isDarkMode} userName={userName} />

            {/* ── 이런 주제는 어떠세요? ── */}
            <TopicRecommendations isDarkMode={isDarkMode} />

            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <BookOpen className="w-7 h-7 text-blue-600" />
                나의 읽기 통계
              </h2>
              {isLoadingStats ? <Spinner /> : (
                <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-10 rounded-[32px] shadow-sm border transition-colors duration-300`}>
                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="bg-blue-600 p-8 rounded-3xl text-white">
                      <p className="text-base font-bold mb-2">총 읽은 기사</p>
                      <p className="text-6xl font-black tracking-tight">
                        {stats?.reading?.total_read ?? 0}<span className="text-2xl font-normal ml-1">개</span>
                      </p>
                    </div>
                    <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'} p-8 rounded-3xl transition-colors duration-300`}>
                      <p className={`text-base font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>이번 주 읽은 기사</p>
                      <p className="text-6xl font-black tracking-tight">
                        {stats?.reading?.weekly_read ?? 0}<span className={`text-2xl font-normal ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>개</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className={`text-base font-bold mb-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>가장 많이 읽은 카테고리 (Top 3)</p>
                    {stats?.reading?.top_topics?.length > 0 ? (
                      <div className="space-y-4">
                        {stats.reading.top_topics.map((t, idx) => {
                          const meta = TOPIC_META[t.topic] ?? { label: t.topic, icon: '📰' };
                          return (
                            <div key={t.topic} className={`flex items-center justify-between px-6 py-4 rounded-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                              <div className="flex items-center gap-4">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-600'}`}>
                                  {idx + 1}
                                </span>
                                <span className="text-3xl">{meta.icon}</span>
                                <span className="text-lg font-bold">{meta.label}</span>
                              </div>
                              <span className="text-lg font-bold text-blue-500">{t.count}회</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>아직 읽은 기사가 없습니다.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Calendar className="w-7 h-7 text-indigo-500" />
              출석 현황
            </h2>
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-10 rounded-[32px] shadow-sm border space-y-6 transition-colors duration-300`}>
              {/* 총 출석일 */}
              {isLoadingStats ? (
                <AttendanceSkeleton isDarkMode={isDarkMode} />
              ) : (
                <div className={`flex flex-col items-center justify-center p-8 rounded-2xl text-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-500 mb-1">총 출석일</p>
                  <p className="text-3xl font-black tracking-tight">
                    {stats?.attendance?.total_attendance ?? 0}
                    <span className={`text-lg font-normal ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>일</span>
                  </p>
                </div>
              )}

              {/* 현재 연속 출석 */}
              {isLoadingStats ? (
                <AttendanceSkeleton isDarkMode={isDarkMode} accent />
              ) : (
                <div className={`flex flex-col items-center justify-center p-8 rounded-2xl text-center border transition-colors duration-300 ${isDarkMode ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-100'}`}>
                  <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                    <Flame className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-orange-500 mb-1">현재 연속 출석</p>
                  <p className="text-3xl font-black text-orange-500 tracking-tight">
                    {stats?.attendance?.current_streak ?? 0}
                    <span className="text-lg font-normal ml-1">일</span>
                  </p>
                </div>
              )}

              {/* 최장 연속 기록 */}
              {isLoadingStats ? (
                <AttendanceSkeleton isDarkMode={isDarkMode} />
              ) : (
                <div className={`flex flex-col items-center justify-center p-8 rounded-2xl text-center transition-colors duration-300 ${isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
                  <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                    <Award className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-amber-500 mb-1">최장 연속 기록</p>
                  <p className="text-3xl font-black text-amber-500 tracking-tight">
                    {stats?.attendance?.max_streak ?? 0}
                    <span className="text-lg font-normal ml-1">일</span>
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      )}

      {/* ── 탭 2. 북마크 ── */}
      {activeTab === 'bookmarks' && (
        <main className="max-w-[1400px] mx-auto px-10 py-12 animate-slide-up pb-32">
          <div className="flex items-center gap-3 mb-8">
            <Tag className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">저장한 기사</h2>
          </div>

          {/* 태그 필터 */}
          <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar pb-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white shadow-md'
                    : `${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`
                }`}
              >
                {tag === '전체' ? tag : `#${tag}`}
              </button>
            ))}
          </div>

          {isLoadingBookmarks ? <Spinner /> : filteredBookmarks.length === 0 ? (
            <div className={`py-20 text-center rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}>
              <p className="font-bold text-lg">저장한 기사가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookmarks.map(bookmark => (
                <div key={bookmark.id} className={`p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      {bookmark.source_name}
                    </span>
                    <button onClick={() => handleDeleteBookmark(bookmark)} className="text-slate-400 hover:text-red-500 transition">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold mb-4 line-clamp-2">{bookmark.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(bookmark.tags ?? []).map(tag => (
                      <span key={tag} className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">#{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                      저장일: {bookmark.created_at?.slice(0, 10)}
                    </p>
                    {bookmark.original_url && (
                      <a href={bookmark.original_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ── 탭 3. 읽은 기사 ── */}
      {activeTab === 'history' && (
        <main className="max-w-[1400px] mx-auto px-10 py-12 animate-slide-up pb-32">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-6 h-6 text-indigo-500" />
            <h2 className="text-2xl font-bold">최근 읽은 기사</h2>
          </div>

          {/* 날짜 필터 */}
          <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar pb-2">
            {allDates.map(date => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  selectedDate === date
                    ? 'bg-indigo-600 text-white shadow-md'
                    : `${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`
                }`}
              >
                {date}
              </button>
            ))}
          </div>

          {isLoadingHistory ? <Spinner /> : filteredHistory.length === 0 ? (
            <div className={`py-20 text-center rounded-3xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-100 text-slate-500'}`}>
              <p className="font-bold text-lg">읽은 기사 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.source_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                        {item.viewed_at ? new Date(item.viewed_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {TOPIC_META[item.topic] && (
                        <span className="text-xs">{TOPIC_META[item.topic].icon} {TOPIC_META[item.topic].label}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold">{item.title}</h3>
                  </div>
                  {item.original_url && (
                    <a href={item.original_url} target="_blank" rel="noopener noreferrer" className="p-3 text-slate-400 hover:text-blue-600 transition">
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ── 탭 4. 환경설정 ── */}
      {activeTab === 'settings' && (
        <main className="max-w-3xl mx-auto px-10 py-12 animate-slide-up space-y-8 pb-32">
          {isLoadingSettings ? <Spinner /> : (
            <>
              <section className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-8 rounded-3xl shadow-sm border transition-colors duration-300`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Bell className="w-6 h-6 text-blue-600" />
                  뉴스레터 설정
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-slate-200/50">
                    <div>
                      <p className="font-bold text-lg">관심 카테고리 관리</p>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>선택된 관심사: {getSelectedTopicLabels()}</p>
                    </div>
                    <button onClick={() => setIsTopicsModalOpen(true)} className="px-5 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition">
                      수정하기
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-slate-200/50">
                    <div>
                      <p className="font-bold text-lg">발송 주기 및 시간</p>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {userSettings.digestFrequency === 'daily' ? '매일' : '매주'} {userSettings.digestTime} 발송
                      </p>
                    </div>
                    <button onClick={() => setIsDigestModalOpen(true)} className="px-5 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition">
                      변경
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-bold text-lg">다크 모드</p>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>어두운 테마로 화면을 표시합니다</p>
                    </div>
                    <button
                      onClick={handleToggleDarkMode}
                      className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}>
                        {isDarkMode && <Moon className="w-4 h-4 text-blue-600" />}
                      </div>
                    </button>
                  </div>
                </div>
              </section>

              <section className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-8 rounded-3xl shadow-sm border transition-colors duration-300`}>
                <h3 className="text-xl font-bold mb-6 text-slate-400">계정 관리</h3>
                <div className="space-y-2">
                  <button onClick={handleLogout} className={`w-full flex items-center justify-between p-4 rounded-xl transition ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <LogOut className="w-5 h-5 text-slate-400" />
                      <span className="font-bold">로그아웃</span>
                    </div>
                  </button>
                  <button onClick={() => setIsWithdrawModalOpen(true)} className={`w-full flex items-center justify-between p-4 rounded-xl transition ${isDarkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
                    <div className="flex items-center gap-3">
                      <UserMinus className="w-5 h-5 text-red-500" />
                      <span className="font-bold text-red-500">회원 탈퇴</span>
                    </div>
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      )}

      {/* 회원 탈퇴 모달 */}
      {isWithdrawModalOpen && (
        <WithdrawModal isDarkMode={isDarkMode} onClose={() => setIsWithdrawModalOpen(false)} onWithdraw={handleWithdraw} />
      )}

      {/* 관심 카테고리 편집 모달 */}
      <TopicSettingsModal
        isDarkMode={isDarkMode}
        isOpen={isTopicsModalOpen}
        onClose={() => setIsTopicsModalOpen(false)}
        selectedTopics={userSettings.selectedTopics}
        selectedSubTopics={userSettings.selectedSubTopics}
        selectedKeywords={userSettings.selectedKeywords ?? []}
        onSave={handleSaveTopics}
      />

      {/* 발송 주기/시간 편집 모달 */}
      <DigestSettingsModal
        isDarkMode={isDarkMode}
        isOpen={isDigestModalOpen}
        onClose={() => setIsDigestModalOpen(false)}
        frequency={userSettings.digestFrequency}
        time={userSettings.digestTime}
        onSave={handleSaveDigest}
      />
    </div>
  );
}


// ── 모달 컴포넌트들 ──────────────────────────────────────────────

function WithdrawModal({ isDarkMode, onClose, onWithdraw }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4">
      <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} w-full max-w-lg p-8 rounded-[32px] sm:rounded-[40px] shadow-2xl animate-slide-up relative`}>
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-2xl font-black mb-4">정말 탈퇴하시겠습니까?</h3>
        <p className={`text-base leading-relaxed mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
          탈퇴 시 사용자의 모든 데이터(북마크, 읽은 기록, 관심사 등)가 즉시 삭제되며 복구할 수 없습니다.
        </p>
        <div className="flex gap-4">
          <button onClick={onClose} className={`flex-1 py-4 font-bold rounded-2xl transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>취소하기</button>
          <button onClick={onWithdraw} className="flex-1 py-4 font-bold bg-red-500 text-white rounded-2xl hover:bg-red-600 transition shadow-lg shadow-red-200/50">탈퇴하기</button>
        </div>
      </div>
    </div>
  );
}

function TopicSettingsModal({ isDarkMode, isOpen, onClose, selectedTopics, selectedSubTopics, selectedKeywords, onSave }) {
  const [step, setStep] = useState(1);
  const [tempTopics, setTempTopics] = useState(selectedTopics);
  const [tempSubs, setTempSubs] = useState(selectedSubTopics);
  const [tempKeywords, setTempKeywords] = useState(selectedKeywords);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTempTopics(selectedTopics);
      setTempSubs(selectedSubTopics);
      setTempKeywords(selectedKeywords);
      setCustomInput('');
    }
  }, [isOpen, selectedTopics, selectedSubTopics, selectedKeywords]);

  const toggleTopic = (id) =>
    setTempTopics(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const toggleSub = (key) =>
    setTempSubs(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);

  const addCustomKeyword = () => {
    const trimmed = customInput.trim();
    if (!trimmed || tempKeywords.includes(trimmed)) { setCustomInput(''); return; }
    setTempKeywords(prev => [...prev, trimmed]);
    setCustomInput('');
  };

  // 선택된 토픽에서 제거된 토픽의 서브토픽도 정리
  const handleNext = () => {
    const validSubs = tempSubs.filter(sub =>
      tempTopics.some(t => SUB_TOPIC_MAP[t]?.some(s => s.key === sub))
    );
    setTempSubs(validSubs);
    setStep(2);
  };

  const handleSave = async () => {
    await onSave(tempTopics, tempSubs, tempKeywords);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} w-full max-w-4xl p-10 rounded-[40px] shadow-2xl animate-slide-up relative max-h-[90vh] overflow-y-auto`}>
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100/50 transition">
          <X className="w-7 h-7" />
        </button>

        {/* 단계 표시 */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-blue-600 text-white' : `${isDarkMode ? 'bg-slate-600 text-slate-400' : 'bg-slate-200 text-slate-400'}`}`}>1</div>
          <div className={`w-16 h-1 rounded-full ${step >= 2 ? 'bg-blue-600' : `${isDarkMode ? 'bg-slate-600' : 'bg-slate-200'}`}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-blue-600 text-white' : `${isDarkMode ? 'bg-slate-600 text-slate-400' : 'bg-slate-200 text-slate-400'}`}`}>2</div>
        </div>

        {/* ── 1단계: 메인 카테고리 ── */}
        {step === 1 && (
          <>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Tag className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black mb-3">관심 카테고리 선택</h2>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>관심 분야를 선택해주세요 (최소 1개)</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-12">
              {TOPIC_LIST.map(topic => {
                const isSelected = tempTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-200 relative ${
                      isSelected
                        ? `border-blue-500 shadow-md ${isDarkMode ? 'bg-slate-700/50 text-white' : 'bg-blue-50 text-blue-700'}`
                        : `border-slate-100 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white text-slate-600'} hover:border-blue-200`
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-4xl mb-4">{topic.icon}</span>
                    <span className="font-bold text-sm whitespace-nowrap">{topic.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4">
              <button onClick={onClose} className={`flex-1 py-4 font-bold rounded-2xl transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>취소하기</button>
              <button
                onClick={handleNext}
                disabled={tempTopics.length === 0}
                className={`flex-1 py-4 font-bold rounded-2xl transition shadow-lg ${tempTopics.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200/50' : 'bg-slate-300 text-slate-400 cursor-not-allowed'}`}
              >
                다음 → 세부 관심사
              </button>
            </div>
          </>
        )}

        {/* ── 2단계: 세부 카테고리 ── */}
        {step === 2 && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-3">세부 관심사 선택</h2>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>더 정확한 추천을 위해 세부 주제를 선택해주세요 (선택사항)</p>
            </div>

            <div className="space-y-8 mb-12">
              {tempTopics.map(topicId => {
                const meta = TOPIC_META[topicId];
                const subs = SUB_TOPIC_MAP[topicId] ?? [];
                if (subs.length === 0) return null;
                return (
                  <div key={topicId}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{meta.icon}</span>
                      <h3 className="font-bold text-lg">{meta.label}</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {subs.map(sub => {
                        const isActive = tempSubs.includes(sub.key);
                        return (
                          <button
                            key={sub.key}
                            onClick={() => toggleSub(sub.key)}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
                              isActive
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200/50'
                                : `border-slate-200 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300 hover:border-indigo-400' : 'bg-white text-slate-600 hover:border-indigo-300'}`
                            }`}
                          >
                            {isActive && <span className="mr-1">✓</span>}
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 직접 입력 */}
            <div className={`rounded-2xl border p-5 mb-8 ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
              <p className="font-bold mb-1 text-sm">원하는 세부 관심사가 없으신가요? 직접 입력해보세요</p>
              <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>입력한 키워드가 제목에 포함된 기사를 우선 추천해드려요</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomKeyword()}
                  placeholder="예: 반도체, 챗GPT, 금리인하 ..."
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-900'}`}
                />
                <button
                  onClick={addCustomKeyword}
                  disabled={!customInput.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-40"
                >
                  + 추가
                </button>
              </div>
              {tempKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tempKeywords.map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-600 text-white">
                      {tag}
                      <button onClick={() => setTempKeywords(prev => prev.filter(k => k !== tag))} className="hover:text-indigo-200 transition">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className={`flex-1 py-4 font-bold rounded-2xl transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>← 이전</button>
              <button onClick={handleSave} className="flex-1 py-4 font-bold bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200/50">저장하기</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DigestSettingsModal({ isDarkMode, isOpen, onClose, frequency, time, onSave }) {
  const [tempFreq, setTempFreq] = useState(frequency);
  const [tempTime, setTempTime] = useState(time);

  useEffect(() => {
    if (isOpen) { setTempFreq(frequency); setTempTime(time); }
  }, [isOpen, frequency, time]);

  const handleSave = async () => {
    await onSave(tempFreq, tempTime);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} w-full max-w-2xl p-10 rounded-[40px] shadow-2xl animate-slide-up relative`}>
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100/50 transition">
          <X className="w-7 h-7" />
        </button>
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Bell className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black mb-3">발송 설정 변경</h2>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>뉴스레터 발송 주기와 시간을 변경할 수 있습니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className={`${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'} p-8 rounded-3xl border`}>
            <h4 className="text-lg font-bold mb-6">발송 주기</h4>
            <div className="grid grid-cols-2 gap-4">
              {[{ id: 'daily', label: '매일' }, { id: 'weekly', label: '매주' }].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTempFreq(opt.id)}
                  className={`py-4 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2 ${tempFreq === opt.id ? 'border-blue-500 bg-white text-blue-700 shadow' : `bg-white ${isDarkMode ? 'bg-slate-600 border-slate-500 text-slate-300' : 'text-slate-600 border-slate-100 hover:border-blue-100'}`}`}
                >
                  {tempFreq === opt.id && <Check className="w-5 h-5" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className={`${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'} p-8 rounded-3xl border`}>
            <h4 className="text-lg font-bold mb-6">발송 시간</h4>
            <select value={tempTime} onChange={e => setTempTime(e.target.value)} className={`w-full p-4 rounded-xl border-2 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-slate-100 text-slate-700'}`}>
              <optgroup label="오전">
                {['06','07','08','09','10','11'].flatMap(h => [
                  <option key={`${h}:00`} value={`${h}:00`}>{`오전 ${parseInt(h)}:00`}{h === '08' ? ' (추천)' : ''}</option>,
                  <option key={`${h}:30`} value={`${h}:30`}>{`오전 ${parseInt(h)}:30`}</option>,
                ])}
              </optgroup>
              <optgroup label="오후">
                {['12','13','14','15','16','17','18','19','20','21','22','23'].flatMap(h => {
                  const label = parseInt(h) >= 13 ? `오후 ${parseInt(h)-12}` : '오후 12';
                  return [
                    <option key={`${h}:00`} value={`${h}:00`}>{`${label}:00`}</option>,
                    <option key={`${h}:30`} value={`${h}:30`}>{`${label}:30`}</option>,
                  ];
                })}
              </optgroup>
            </select>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className={`flex-1 py-4 font-bold rounded-2xl transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>취소하기</button>
          <button onClick={handleSave} className="flex-1 py-4 font-bold bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200/50">변경 완료</button>
        </div>
      </div>
    </div>
  );
}

// 출석 카드 스켈레톤
function AttendanceSkeleton({ isDarkMode, accent }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-2xl text-center animate-pulse
      ${accent
        ? isDarkMode ? 'bg-orange-900/10 border border-orange-500/20' : 'bg-orange-50/60 border border-orange-100'
        : isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
      }`}
    >
      <div className={`w-14 h-14 rounded-full mb-4 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-200'}`} />
      <div className={`h-3 w-20 rounded-full mb-3 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-200'}`} />
      <div className={`h-8 w-16 rounded-full ${isDarkMode ? 'bg-slate-600' : 'bg-slate-200'}`} />
    </div>
  );
}

export default MyPage;
