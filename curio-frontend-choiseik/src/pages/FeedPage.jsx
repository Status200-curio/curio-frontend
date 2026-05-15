// src/pages/FeedPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, User, MessageSquare, Heart,
  Bookmark, TrendingUp, ExternalLink, Loader2, BookOpen,
  Play, Pause, SkipForward, SkipBack, Volume2, X, Headphones,
  CheckCircle2, Flame, Info
} from 'lucide-react';
import ChatbotPanel from '../components/ChatbotPanel';
import { articlesApi } from '../api/articles';

// [백엔드 미연결 시 대체용 가짜 뉴스 데이터]
const MOCK_ARTICLES = [
  {
    id: "art_xyz789",
    title: "GPT-5 아키텍처의 새로운 추론 메커니즘 공개",
    ai_summary: "OpenAI가 차세대 모델의 핵심 구조를 공개했습니다. 기존보다 매개변수 효율성이 30% 향상되었으며, 복잡한 수학적 추론 능력이 대폭 강화되었습니다.",
    ai_insight: "사용자님의 관심사인 'AI 기술' 분야에서 가장 큰 변화로, 향후 개발 환경에 직접적인 영향을 줄 수 있습니다.",
    source: { name: "MIT Technology Review", url: "#" },
    thumbnail_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
    topic: "ai",
    published_at: "2026-03-25T08:30:00Z",
    relevance_score: 0.98,
    is_saved: false,
    user_feedback: null
  },
  {
    id: "art_abc123",
    title: "글로벌 금리 동결 기조, 하반기 반도체 시장에 미칠 영향",
    ai_summary: "연준이 금리 동결을 발표하며 시장 불확실성이 일부 해소되었습니다. 이로 인해 반도체 설비 투자 자금 유입이 가속화될 전망입니다.",
    ai_insight: "경제와 기술을 동시에 팔로우하시는 사용자님께 이 뉴스는 포트폴리오 조정의 핵심 지표가 될 수 있습니다.",
    source: { name: "Bloomberg", url: "#" },
    thumbnail_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800",
    topic: "economy",
    published_at: "2026-03-25T10:15:00Z",
    relevance_score: 0.92,
    is_saved: true,
    user_feedback: "like"
  }
];

const CATEGORIES = [
  { id: 'all', label: '전체', subs: [] },
  { id: 'ai', label: 'AI / 기술', subs: ['머신러닝', '로보틱스', '반도체', '소프트웨어', '스타트업'] },
  { id: 'economy', label: '경제', subs: ['주식/증권', '부동산', '암호화폐', '글로벌경제', '산업/기업'] },
  { id: 'sports', label: '스포츠', subs: ['축구', '야구', '농구', '골프', '올림픽'] },
  { id: 'science', label: '과학', subs: ['우주/천문', '생명과학', '환경', '물리학', '의학'] },
];

function FeedPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [activeSubTabs, setActiveSubTabs] = useState([]);
  const [chatArticle, setChatArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ★ 알림(Notification) 상태 관리 추가
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'audio', message: '오늘의 AI 오디오 브리핑이 준비되었습니다.', time: '10분 전', isRead: false },
    { id: 2, type: 'update', message: '관심 카테고리(경제)에 새로운 핵심 기사가 추가되었습니다.', time: '1시간 전', isRead: false },
    { id: 3, type: 'badge', message: '연속 7일 출석을 달성하셨습니다! 🔥', time: '1일 전', isRead: true }
  ]);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 알림 모두 읽음 처리 함수
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  // 알림 아이콘 선택 함수
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'audio': return <Headphones className="w-4 h-4 text-blue-500" />;
      case 'badge': return <Flame className="w-4 h-4 text-orange-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  // AI 오디오 브리핑 상태 관리
  const [showAudioPlayer, setShowAudioPlayer] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const AUDIO_DURATION_SEC = 180;

  // 부드러운 오디오 진행도 시뮬레이션 로직
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const nextTime = prev + 0.05;
          if (nextTime >= AUDIO_DURATION_SEC) {
            setIsPlaying(false);
            return 0;
          }
          return nextTime;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 실전 API 통신 로직
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const params = activeTab === 'all' ? {} : { category: activeTab };
        const data = await articlesApi.getFeed(params);
        setArticles(data?.data?.articles ?? data);
      } catch (error) {
        const filteredMock = activeTab === 'all'
          ? MOCK_ARTICLES
          : MOCK_ARTICLES.filter(a => a.topic === activeTab);

        setTimeout(() => {
          setArticles(filteredMock);
          setIsLoading(false);
        }, 500);
        return;
      }
      setIsLoading(false);
    };

    fetchArticles();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20 transition-colors duration-300">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">C</div>
            <span className="text-xl font-black text-blue-900 dark:text-blue-400">Curio</span>
          </div>

          <div
            className="flex-grow max-w-md mx-8 relative hidden md:block cursor-pointer"
            onClick={() => navigate('/search')}
          >
            <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
            <input
              type="text"
              readOnly
              placeholder="관심 있는 뉴스를 검색해보세요"
              className="w-full bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:placeholder-slate-500 border border-transparent dark:border-slate-700/50 rounded-full py-2 pl-10 pr-4 text-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            />
          </div>

          <div className="flex items-center gap-4 relative">
            {/* ★ 알림 버튼 및 드롭다운 패널 추가 */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition relative"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                )}
              </button>

              {/* 알림 드롭다운 */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                      <h3 className="font-bold text-slate-800 dark:text-white">알림</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition">
                          모두 읽음 처리
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto no-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-slate-50 dark:border-slate-700/50 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer ${!notification.isRead ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}
                            onClick={() => {
                              setNotifications(notifications.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                            }}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notification.isRead ? 'bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600' : 'bg-slate-100 dark:bg-slate-700'}`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm mb-1 ${!notification.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-400">{notification.time}</p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">새로운 알림이 없습니다.</div>
                      )}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 text-center border-t border-slate-100 dark:border-slate-700">
                      <button className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">모든 알림 보기</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => navigate('/mypage')}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
            >
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <section className="mb-6 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-1.5">Today's Pick</p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              오늘의 큐레이션
              <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">for you</span>
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">AI가 선별한 오늘의 핵심 뉴스</p>
          </div>
          {!showAudioPlayer && (
            <button
              onClick={() => setShowAudioPlayer(true)}
              className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 rounded-full hover:opacity-90 transition shadow-md shadow-blue-200 dark:shadow-blue-900/40"
            >
              <Headphones className="w-4 h-4" /> 브리핑 듣기
            </button>
          )}
        </section>

        {/* AI 오디오 브리핑 UI */}
        <AnimatePresence>
          {showAudioPlayer && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0, marginBottom: 32 }}
              exit={{ opacity: 0, y: -12, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                {/* 배경 그라디언트 */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0c1a3a]" />
                {/* 배경 블러 원 장식 */}
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />

                <div className="relative p-6 text-white">
                  {/* 상단: 레이블 + 닫기 */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-blue-300/80 uppercase">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                      AI 브리핑
                    </span>
                    <button
                      onClick={() => setShowAudioPlayer(false)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 제목 */}
                  <div className="mb-5">
                    <h3 className="text-xl font-black tracking-tight mb-0.5">3월 25일 아침 브리핑</h3>
                    <p className="text-sm text-blue-200/60">AI가 선별한 오늘의 핵심 이슈 3가지</p>
                  </div>

                  {/* 파형 + 진행바 */}
                  <div className="mb-2 group cursor-pointer">
                    {/* 파형 시각화 (장식) */}
                    <div className="flex items-end gap-0.5 h-8 mb-2 px-0.5">
                      {Array.from({ length: 48 }).map((_, i) => {
                        const progress = currentTime / AUDIO_DURATION_SEC;
                        const isPast = i / 48 < progress;
                        const height = 30 + Math.sin(i * 0.8) * 20 + Math.sin(i * 0.3) * 15;
                        return (
                          <motion.div
                            key={i}
                            className={`flex-1 rounded-full transition-colors duration-150 ${isPast ? 'bg-blue-400' : 'bg-white/15'}`}
                            style={{ height: `${height}%` }}
                            animate={isPlaying && isPast ? { scaleY: [1, 1.2, 0.9, 1] } : {}}
                            transition={{ duration: 0.4, delay: i * 0.01, repeat: isPlaying ? Infinity : 0 }}
                          />
                        );
                      })}
                    </div>
                    {/* 시간 표시 */}
                    <div className="flex justify-between text-xs text-white/40 font-medium px-0.5">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(AUDIO_DURATION_SEC)}</span>
                    </div>
                  </div>

                  {/* 컨트롤 */}
                  <div className="flex items-center justify-between mt-4">
                    <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 transition text-xs font-bold">
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-5">
                      <button
                        onClick={() => setCurrentTime(prev => Math.max(0, prev - 10))}
                        className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition"
                      >
                        <SkipBack className="w-5 h-5 fill-current" />
                        <span className="text-[9px] font-bold">10</span>
                      </button>

                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-14 h-14 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-blue-900/50"
                      >
                        <motion.div
                          animate={isPlaying ? {} : {}}
                          key={isPlaying ? 'pause' : 'play'}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.15 }}
                        >
                          {isPlaying
                            ? <Pause className="w-6 h-6 fill-current" />
                            : <Play className="w-6 h-6 fill-current ml-1" />
                          }
                        </motion.div>
                      </button>

                      <button
                        onClick={() => setCurrentTime(prev => Math.min(AUDIO_DURATION_SEC, prev + 10))}
                        className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition"
                      >
                        <SkipForward className="w-5 h-5 fill-current" />
                        <span className="text-[9px] font-bold">10</span>
                      </button>
                    </div>

                    <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 transition text-xs font-bold">
                      1x
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 카테고리 탭 */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveTab(cat.id);
                  setActiveSubTabs([]);
                }}
                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
                  activeTab === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 세부 카테고리 */}
          <AnimatePresence>
            {activeTab !== 'all' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar">
                  {CATEGORIES.find(c => c.id === activeTab)?.subs.map(sub => {
                    const isActive = activeSubTabs.includes(sub);
                    return (
                      <button
                        key={sub}
                        onClick={() => {
                          setActiveSubTabs(prev =>
                            isActive ? prev.filter(s => s !== sub) : [...prev, sub]
                          );
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                          isActive
                          ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/50'
                          : 'bg-transparent text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/60 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        {isActive && <span className="mr-1">✓</span>}
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 뉴스 피드 리스트 */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
              <p className="font-bold text-sm">최신 뉴스를 가져오는 중입니다...</p>
            </div>
          ) : articles.length > 0 ? (
            articles.map(article => (
              <NewsCard
                key={article.id}
                article={article}
                onOpenChat={() => setChatArticle(article)}
              />
            ))
          ) : (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
              <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
              <p className="font-bold text-lg mb-1">해당 카테고리의 뉴스가 없습니다</p>
              <p className="text-sm">다른 카테고리를 선택해보세요.</p>
            </div>
          )}
        </div>
      </main>

      {/* 챗봇 패널 */}
      {chatArticle && (
        <ChatbotPanel
          article={chatArticle}
          onClose={() => setChatArticle(null)}
        />
      )}
    </div>
  );
}

// 파티클 색상
const PARTICLE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#f97316'];

// 기사 카드 컴포넌트
function NewsCard({ article, onOpenChat }) {
  const [isLiked, setIsLiked] = useState(article.user_feedback === 'like');
  const [burst, setBurst] = useState(false);
  const [isSaved, setIsSaved] = useState(article.is_saved);
  const [saveBurst, setSaveBurst] = useState(false);

  const handleLike = async () => {
    const newLiked = !isLiked;
    if (newLiked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
    setIsLiked(newLiked);
    try {
      await articlesApi.sendFeedback(article.id, newLiked ? 'like' : 'cancel');
    } catch (error) {
      setIsLiked(!newLiked); // 실패 시 롤백
      console.error('피드백 전송 실패:', error);
    }
  };

  const handleSave = async () => {
    const newSaved = !isSaved;
    if (newSaved) {
      setSaveBurst(true);
      setTimeout(() => setSaveBurst(false), 600);
    }
    setIsSaved(newSaved);
    try {
      await articlesApi.toggleBookmark(article.id);
    } catch (error) {
      setIsSaved(!newSaved); // 실패 시 롤백
      console.error('북마크 저장 실패:', error);
    }
  };

  const particles = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    angle: i * 36,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    distance: 28 + Math.random() * 14,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/40 transition duration-300"
    >
      <div className="relative h-48 sm:h-64">
        <img src={article.thumbnail_url} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-600">
          {article.source?.name || article.source}
        </div>
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {Math.round(article.relevance_score * 100)}% 관련도
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
          {article.title}
        </h3>

        <div className="bg-blue-50/50 dark:bg-blue-950/40 rounded-2xl p-5 mb-6 border border-blue-100/50 dark:border-blue-900/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 font-bold text-sm uppercase tracking-wider">AI 3-Line Summary</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
            {article.ai_summary}
          </p>
        </div>

        <div className="flex gap-3 mb-8">
          <div className="w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
          <div>
            <span className="text-indigo-600 font-bold text-xs uppercase">Personalized Insight</span>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mt-1 italic">
              "{article.ai_insight}"
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {/* 추천 버튼 + 파티클 이펙트 */}
            <div className="relative flex items-center">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-sm font-bold transition ${isLiked ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <motion.div
                  animate={burst ? { scale: [1, 1.5, 0.9, 1.1, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </motion.div>
                추천
              </button>

              {/* 파티클 */}
              <AnimatePresence>
                {burst && particles.map(p => (
                  <motion.span
                    key={p.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: 7,
                      height: 7,
                      backgroundColor: p.color,
                      top: '50%',
                      left: 10,
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                      y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* 저장 버튼 + 파티클 이펙트 */}
            <div className="relative flex items-center">
              <button
                onClick={handleSave}
                className={`flex items-center gap-1.5 text-sm font-bold transition ${isSaved ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <motion.div
                  animate={saveBurst ? { scale: [1, 1.5, 0.9, 1.1, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </motion.div>
                저장
              </button>
              <AnimatePresence>
                {saveBurst && particles.map(p => (
                  <motion.span
                    key={p.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{ width: 7, height: 7, backgroundColor: p.color, top: '50%', left: 10 }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                      y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenChat}
              className="p-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-600 transition shadow-lg shadow-slate-200 dark:shadow-slate-900/50"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-blue-900/50">
              <ExternalLink className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default FeedPage;
