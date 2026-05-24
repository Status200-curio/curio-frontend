// src/pages/FeedPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, User, MessageSquare, Heart,
  Bookmark, TrendingUp, ExternalLink, Loader2, BookOpen,
  Play, Pause, SkipForward, SkipBack, X, Headphones,
  Flame, Info
} from 'lucide-react';
import ChatbotPanel from '../components/ChatbotPanel';
import ArticleModal from '../components/ArticleModal';
import { articlesApi, TOPIC_IMAGES, DEFAULT_IMAGE } from '../api/articles';
import { userApi } from '../api/userApi';

// 앱 진입 시 출석 1회 기록 (토큰 없으면 무시)
if (localStorage.getItem('curio_access_token')) {
  userApi.recordAttendance().catch(() => {});
}

// ── 토픽 코드 → 한글 메타 매핑 (API 명세 8.2절 카테고리 코드 기준) ──────────
const TOPIC_META = {
  ai:       { label: 'AI / 기술',     subs: ['머신러닝', '로보틱스', '반도체', '소프트웨어', '스타트업'] },
  economy:  { label: '경제',           subs: ['주식/증권', '부동산', '암호화폐', '글로벌경제', '산업/기업'] },
  sports:   { label: '스포츠',         subs: ['축구', '야구', '농구', '골프', '올림픽'] },
  politics: { label: '정치',           subs: ['국내정치', '국제외교', '선거', '법/제도'] },
  science:  { label: '과학',           subs: ['우주/천문', '생명과학', '환경', '물리학', '의학'] },
  health:   { label: '건강',           subs: ['의학', '영양', '운동', '정신건강'] },
  world:    { label: '세계',           subs: ['미국', '유럽', '아시아', '중동', '아프리카'] },
  society:  { label: '사회',           subs: ['교육', '노동', '복지', '환경', '젠더'] },
  culture:  { label: '문화',           subs: ['예술', '도서', '음식', '여행', '라이프스타일'] },
  entertain:{ label: '엔터테인먼트',    subs: ['영화', '음악', 'TV/드라마', 'K-POP', '게임'] },
};

// '전체' 칩은 항상 고정
const ALL_CAT = { id: 'all', label: '전체', subs: [] };

function FeedPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [activeSubTabs, setActiveSubTabs] = useState([]);
  const [chatArticle, setChatArticle] = useState(null);
  const [modalArticle, setModalArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);

  // 유저 관심사 기반 동적 카테고리
  const [categories, setCategories] = useState([ALL_CAT]);

  useEffect(() => {
    userApi.getMe()
      .then(res => {
        const topics = res?.data?.preferences?.topics ?? [];
        const subTopics = res?.data?.preferences?.sub_topics ?? [];
        if (topics.length > 0) {
          const cats = [
            ALL_CAT,
            ...topics
              .filter(t => TOPIC_META[t])
              .map(t => ({
                id: t,
                label: TOPIC_META[t].label,
                subs: subTopics.length > 0
                  ? TOPIC_META[t].subs.filter(s => subTopics.includes(s))
                  : TOPIC_META[t].subs,
              })),
          ];
          setCategories(cats);
        }
      })
      .catch(() => {
        // 실패 시 전체 카테고리 목록으로 폴백
        setCategories([
          ALL_CAT,
          ...Object.entries(TOPIC_META).map(([id, m]) => ({ id, ...m })),
        ]);
      });
  }, []);

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
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playingArticle, setPlayingArticle] = useState(null);
  const audioRef = useRef(null);
  const audioBlobUrlRef = useRef(null);
  const audioRequestIdRef = useRef(0); // race condition 방지: 최신 요청 ID 추적

  // 연속 재생용 ref (이벤트 리스너 내부에서 최신 상태 접근)
  const articlesRef = useRef([]);
  const playingArticleRef = useRef(null);
  const articleCardRefs = useRef({});
  const playNextArticleRef = useRef(null); // stale closure 방지

  useEffect(() => { articlesRef.current = articles; }, [articles]);
  useEffect(() => { playingArticleRef.current = playingArticle; }, [playingArticle]);

  // 오디오 재생 핸들러 — 기사 선택 시 TTS 로드 및 재생
  const handlePlayArticle = async (article) => {
    // 같은 기사면 재생/일시정지 토글
    if (playingArticle?.id === article.id) {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
      return;
    }

    // 다른 기사 선택 시 기존 오디오 정리 — 모든 핸들러 먼저 제거 후 정지
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }

    setPlayingArticle(article);
    setShowAudioPlayer(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    setAudioLoading(true);

    // 이 요청이 완료되기 전에 다른 기사가 선택되면 무시
    const requestId = ++audioRequestIdRef.current;

    try {
      const blobUrl = await articlesApi.getAudio(article.id);

      // 더 최신 요청이 있으면 이 결과는 버림 (race condition 방지)
      if (requestId !== audioRequestIdRef.current) {
        URL.revokeObjectURL(blobUrl);
        return;
      }

      audioBlobUrlRef.current = blobUrl;

      const audio = new Audio(blobUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
      };
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };
      audio.onended = () => {
        playNextArticleRef.current?.();
      };
      audio.onerror = () => {
        console.error('[TTS] 오디오 재생 오류');
        setIsPlaying(false);
        setPlayingArticle(null);
        setShowAudioPlayer(false);
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('[TTS] 오디오 로딩 실패:', err?.response?.status ?? err.message);
      // 요약 없는 기사(404)면 안내, 나머지는 조용히 실패
      if (err?.response?.status === 404) {
        alert('이 기사는 아직 AI 요약이 준비되지 않아 브리핑을 들을 수 없습니다.');
      }
      setPlayingArticle(null);
      setShowAudioPlayer(false);
    } finally {
      setAudioLoading(false);
    }
  };

  // playNextArticle은 handlePlayArticle 뒤에 정의 — ref로 항상 최신 버전 참조
  const playNextArticle = () => {
    const currentArticles = articlesRef.current;
    const currentPlaying = playingArticleRef.current;
    if (!currentPlaying || currentArticles.length === 0) return;

    const currentIdx = currentArticles.findIndex(a => a.id === currentPlaying.id);
    const nextArticle = currentArticles.slice(currentIdx + 1).find(a => a.ai_summary);

    if (nextArticle) {
      handlePlayArticle(nextArticle);
      setTimeout(() => {
        const cardEl = articleCardRefs.current[nextArticle.id];
        if (cardEl) cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };
  playNextArticleRef.current = playNextArticle;

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (delta) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audioDuration, audio.currentTime + delta));
  };

  const handleClosePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }
    setShowAudioPlayer(false);
    setIsPlaying(false);
    setPlayingArticle(null);
    setCurrentTime(0);
    setAudioDuration(0);
  };

  // 페이지 이탈 시 오디오 정리
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current);
    };
  }, []);

  const formatTime = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds)) return '00:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 기사 fetch (activeTab · activeSubTabs · page 변경 시)
  useEffect(() => {
    const fetchArticles = async () => {
      if (page === 1) setIsLoading(true);
      else setIsFetchingMore(true);
      setError(null);
      try {
        const params = {
          ...(activeTab !== 'all' && { topic: activeTab }),
          ...(activeSubTabs.length > 0 && { sub_tags: activeSubTabs.join(',') }),
          page,
          limit: 10,
        };
        const data = await articlesApi.getFeed(params);
        const fetched = data?.data?.articles ?? [];
        const hasNext = data?.data?.has_next ?? false;
        if (page === 1) setArticles(fetched);
        else setArticles(prev => [...prev, ...fetched]);
        setHasMore(hasNext);
      } catch (err) {
        console.error('[FeedPage] 기사 로딩 실패:', err.response?.status, err.message);
        setError(err.response?.status ?? 'unknown');
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    };

    fetchArticles();
  }, [activeTab, activeSubTabs, page]);

  // 무한 스크롤 IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore && !isLoading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, isLoading]);

  // ── 요약 누락 감지 → 60초 후 백그라운드 Re-fetch ──────────────────────────
  // 요약 없는 기사가 있으면 60초 후 조용히 최신 데이터를 병합한다.
  const bgRefetchDoneRef = useRef(false);
  useEffect(() => {
    bgRefetchDoneRef.current = false; // 탭 변경 시 재시도 허용
  }, [activeTab, activeSubTabs]);

  useEffect(() => {
    if (isLoading || bgRefetchDoneRef.current || articles.length === 0) return;
    const missingSummary = articles.some(a => !a.ai_summary);
    if (!missingSummary) return;

    bgRefetchDoneRef.current = true;
    const timer = setTimeout(async () => {
      try {
        const params = {
          ...(activeTab !== 'all' && { topic: activeTab }),
          ...(activeSubTabs.length > 0 && { sub_tags: activeSubTabs.join(',') }),
          page: 1,
          limit: articles.length,
        };
        const data = await articlesApi.getFeed(params);
        const fresh = data?.data?.articles ?? [];
        setArticles(prev =>
          prev.map(old => {
            const updated = fresh.find(u => u.id === old.id);
            return updated?.ai_summary && !old.ai_summary
              ? { ...old, ai_summary: updated.ai_summary }
              : old;
          })
        );
      } catch {
        // 재조회 실패 무시
      }
    }, 60_000);

    return () => clearTimeout(timer);
  }, [isLoading, articles, activeTab, activeSubTabs]);

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
          {!showAudioPlayer && playingArticle && (
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
          {showAudioPlayer && playingArticle && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0, marginBottom: 32 }}
              exit={{ opacity: 0, y: -12, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0c1a3a]" />
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />

                <div className="relative p-6 text-white">
                  {/* 상단: 레이블 + 닫기 */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-blue-300/80 uppercase">
                      <span className={`w-1.5 h-1.5 bg-blue-400 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} />
                      AI 브리핑
                    </span>
                    <button
                      onClick={handleClosePlayer}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 기사 제목 */}
                  <div className="mb-5">
                    <h3 className="text-base font-black tracking-tight mb-0.5 line-clamp-2 leading-snug">
                      {playingArticle.title}
                    </h3>
                    <p className="text-sm text-blue-200/60">{playingArticle.source?.name || playingArticle.source_name}</p>
                  </div>

                  {/* 파형 + 진행바 */}
                  <div className="mb-2">
                    <div className="flex items-end gap-0.5 h-8 mb-2 px-0.5">
                      {Array.from({ length: 48 }).map((_, i) => {
                        const progress = audioDuration > 0 ? currentTime / audioDuration : 0;
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
                    <div className="flex justify-between text-xs text-white/40 font-medium px-0.5">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(audioDuration)}</span>
                    </div>
                  </div>

                  {/* 컨트롤 */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="w-8 h-8" />

                    <div className="flex items-center gap-5">
                      <button
                        onClick={() => handleSeek(-10)}
                        className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition"
                      >
                        <SkipBack className="w-5 h-5 fill-current" />
                        <span className="text-[9px] font-bold">10</span>
                      </button>

                      <button
                        onClick={handlePlayPause}
                        disabled={audioLoading}
                        className="w-14 h-14 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-blue-900/50 disabled:opacity-60"
                      >
                        {audioLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        ) : (
                          <motion.div
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
                        )}
                      </button>

                      <button
                        onClick={() => handleSeek(10)}
                        className="flex flex-col items-center gap-0.5 text-white/50 hover:text-white transition"
                      >
                        <SkipForward className="w-5 h-5 fill-current" />
                        <span className="text-[9px] font-bold">10</span>
                      </button>
                    </div>

                    <div className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 카테고리 탭 */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.id === activeTab) return;
                  setActiveTab(cat.id);
                  setActiveSubTabs([]);
                  setPage(1);
                  setArticles([]);
                  setHasMore(true);
                  setError(null);
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
                  {categories.find(c => c.id === activeTab)?.subs.map(sub => {
                    const isActive = activeSubTabs.includes(sub);
                    return (
                      <button
                        key={sub}
                        onClick={() => {
                          setActiveSubTabs(prev =>
                            isActive ? prev.filter(s => s !== sub) : [...prev, sub]
                          );
                          setPage(1);
                          setArticles([]);
                          setHasMore(true);
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                          isActive
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                          : 'bg-transparent text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-500 dark:hover:text-indigo-400'
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
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : error ? (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="font-bold text-lg mb-1">뉴스를 불러오지 못했습니다</p>
              <p className="text-sm">오류 코드: {error} — 브라우저 콘솔을 확인해주세요.</p>
            </div>
          ) : articles.length > 0 ? (() => {
            const matchedArticles = articles.filter(a => a.is_matched);
            const hasMatched = matchedArticles.length > 0;

            // 매칭 기사 중 가장 많은 토픽을 "주 토픽"으로 선정
            let primaryTopic = null;
            if (hasMatched) {
              const counts = {};
              matchedArticles.forEach(a => { counts[a.topic] = (counts[a.topic] || 0) + 1; });
              primaryTopic = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
            }

            // 매칭 기사 + 주 토픽의 비매칭 기사만 표시
            const visibleArticles = hasMatched
              ? articles.filter(a => a.is_matched || a.topic === primaryTopic)
              : articles;

            let dividerInserted = false;
            return visibleArticles.map(article => {
              const showDivider = hasMatched && !dividerInserted && !article.is_matched;
              if (showDivider) dividerInserted = true;
              return (
                <div key={article.id}>
                  {showDivider && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">같은 주제의 다른 기사</span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    </div>
                  )}
                  <NewsCard
                    article={article}
                    onOpenModal={() => setModalArticle(article)}
                    onOpenChat={() => setChatArticle(article)}
                    onListen={() => handlePlayArticle(article)}
                    isPlayingThis={playingArticle?.id === article.id && isPlaying}
                    cardRef={el => { articleCardRefs.current[article.id] = el; }}
                  />
                </div>
              );
            });
          })() : (
            <div className="py-20 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
              <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
              <p className="font-bold text-lg mb-1">해당 카테고리의 뉴스가 없습니다</p>
              <p className="text-sm">다른 카테고리를 선택해보세요.</p>
            </div>
          )}

          {/* 무한 스크롤 센티넬 + 추가 로딩 표시 */}
          {!isLoading && (
            <div ref={sentinelRef} className="py-4 flex justify-center">
              {isFetchingMore && (
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              )}
              {!hasMore && articles.length > 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">모든 기사를 불러왔습니다.</p>
              )}
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

      {/* 기사 상세 모달 (체류 시간 측정) */}
      {modalArticle && (
        <ArticleModal
          article={modalArticle}
          onClose={() => setModalArticle(null)}
          onListen={() => handlePlayArticle(modalArticle)}
          isPlayingThis={playingArticle?.id === modalArticle.id && isPlaying}
        />
      )}
    </div>
  );
}

// 스켈레톤 카드 (로딩 플레이스홀더)
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 animate-pulse">
      <div className="h-48 sm:h-64 bg-slate-200 dark:bg-slate-800" />
      <div className="p-6 sm:p-8">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full mb-3 w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full mb-2 w-full" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full mb-6 w-5/6" />
        <div className="bg-blue-50/50 dark:bg-blue-950/40 rounded-2xl p-5 space-y-2 border border-blue-100/50 dark:border-blue-900/50">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-1/3 mb-3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-full" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-5/6" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-4/6" />
        </div>
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-4">
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="flex gap-2">
            <div className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 파티클 색상
const PARTICLE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#f97316'];

// 기사 카드 컴포넌트
function NewsCard({ article, onOpenModal, onOpenChat, onListen, isPlayingThis, cardRef }) {
  const [isLiked, setIsLiked] = useState(article.user_feedback === 'like');
  const [burst, setBurst] = useState(false);
  const [isSaved, setIsSaved] = useState(article.is_saved);
  const [saveBurst, setSaveBurst] = useState(false);

  const handleOpenArticle = async () => {
    const url = article.source?.url || article.original_url;
    if (!url) return;
    // 열람 기록 전송 (실패해도 무시)
    articlesApi.recordView(article.id, 0).catch(() => {});
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/40 transition duration-300"
    >
      <div className="relative h-48 sm:h-64 cursor-pointer" onClick={onOpenModal}>
        <img
          src={article.thumbnail_url || TOPIC_IMAGES[article.topic] || DEFAULT_IMAGE}
          alt={article.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={(e) => {
            // 이미지 로딩 실패 시 topic 기본 이미지로 교체 (재귀 방지)
            if (e.target.src !== DEFAULT_IMAGE) {
              e.target.src = TOPIC_IMAGES[article.topic] || DEFAULT_IMAGE;
            }
          }}
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-600">
          {article.source?.name || article.source}
        </div>
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {Math.round(article.relevance_score * 100)}% 관련도
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <h3
          className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          onClick={onOpenModal}
        >
          {article.title}
        </h3>

        <div className="bg-blue-50/50 dark:bg-blue-950/40 rounded-2xl p-5 mb-6 border border-blue-100/50 dark:border-blue-900/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-blue-600 font-bold text-sm uppercase tracking-wider">AI 3-Line Summary</span>
          </div>
          {article.ai_summary ? (
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-base font-medium">
              {article.ai_summary}
            </p>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 leading-relaxed text-sm">
              이 기사는 아직 요약이 준비되지 않았습니다.
            </p>
          )}
        </div>

        {article.ai_insight && (
          <div className="flex gap-3 mb-8">
            <div className="w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
            <div>
              <span className="text-indigo-600 font-bold text-xs uppercase">Personalized Insight</span>
              <p className="text-slate-700 dark:text-slate-300 text-base font-semibold mt-1">
                "{article.ai_insight}"
              </p>
            </div>
          </div>
        )}

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
            {article.ai_summary && (
              <button
                onClick={onListen}
                title="AI 브리핑 듣기"
                className={`p-3 rounded-2xl transition shadow-lg ${
                  isPlayingThis
                    ? 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-900/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 shadow-slate-200 dark:shadow-slate-900/50'
                }`}
              >
                <Headphones className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onOpenChat}
              className="p-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-600 transition shadow-lg shadow-slate-200 dark:shadow-slate-900/50"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={handleOpenArticle}
              className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-blue-900/50"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default FeedPage;
