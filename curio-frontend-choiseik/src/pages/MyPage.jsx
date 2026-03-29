// src/pages/MyPage.jsx
import { useState, useCallback } from 'react';
import { 
  BookOpen, Calendar, Flame, Award, ChevronLeft, Bell, 
  Moon, LogOut, UserMinus, AlertTriangle, Tag, Clock, Trash2, ExternalLink, Settings, X, Check, Headphones
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// import apiClient from '../api/client'; // 백엔드 연결 시 사용

// [API 명세 8.2] 카테고리 리스트 (온보딩 및 환경설정 재사용)
export const TOPIC_LIST = [
  { id: 'ai', label: 'AI / 기술', icon: '💻' },
  { id: 'economy', label: '경제', icon: '📈' },
  { id: 'sports', label: '스포츠', icon: '⚽' },
  { id: 'culture', label: '문화', icon: '🎨' },
  { id: 'politics', label: '정치', icon: '🏛️' },
  { id: 'science', label: '과학', icon: '🔬' },
  { id: 'health', label: '건강', icon: '🏥' },
  { id: 'global', label: '국제', icon: '🌍' },
  { id: 'society', label: '사회', icon: '🤝' },
  { id: 'entertainment', label: '연예', icon: '🎬' },
];

function MyPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 상태 관리
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  
  // ★ [추가] 환경설정 편집 모달 상태
  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState(false);
  const [isDigestModalOpen, setIsDigestModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('전체');
  const [selectedDate, setSelectedDate] = useState('전체');

  // ★ [추가] 실제 사용자 설정 상태 (API 연결 전 임시 데이터)
  const [userSettings, setUserSettings] = useState({
    selectedTopics: ['ai', 'economy', 'sports'], // 선택된 ID 배열
    digestFrequency: 'daily', // 'daily' | 'weekly'
    digestTime: '08:00', // '08:00' | '18:00'
  });

  // [Mock 데이터] 대시보드 통계
  const mockStats = {
    reading: {
      total_articles: 127,
      this_week_articles: 12,
      top_categories: [
        { topic: "ai", count: 54, label: "AI / 기술", icon: "💻" },
        { topic: "economy", count: 38, label: "경제", icon: "📈" },
        { topic: "sports", count: 15, label: "스포츠", icon: "⚽" }
      ]
    },
    attendance: { total_days: 42, current_streak: 14, longest_streak: 21 }
  };

  // ★ [수정] 북마크 데이터를 상태(state)로 관리하여 삭제 기능 구현 (image_6.png 관련)
  const [bookmarks, setBookmarks] = useState([
    { id: 1, title: "오픈AI, 새로운 추론 모델 'o1' 전격 공개", source: "TechCrunch", tags: ["AI관련", "트렌드"], saved_at: "2026-03-22" },
    { id: 2, title: "하반기 금리 인하 기대감에 증시 반등", source: "Bloomberg", tags: ["경제공부"], saved_at: "2026-03-21" },
    { id: 3, title: "전고체 배터리 상용화 앞당겨지나... 핵심 기술 확보", source: "MIT Tech Review", tags: ["트렌드", "과학"], saved_at: "2026-03-20" }
  ]);
  const allTags = ['전체', ...new Set(bookmarks.flatMap(b => b.tags))];
  const filteredBookmarks = selectedTag === '전체' ? bookmarks : bookmarks.filter(b => b.tags.includes(selectedTag));

  // [Mock 데이터] 읽은 기사 기록
  const mockHistory = [
    { id: 101, title: "엔비디아 차세대 칩 공개, 성능 30% 향상", source: "The Verge", viewed_at: "2026-03-23 09:15", read_time: 4, date: "2026-03-23" },
    { id: 102, title: "미국 CPI 예상치 하회, 인플레 둔화 신호", source: "WSJ", viewed_at: "2026-03-23 08:30", read_time: 3, date: "2026-03-23" },
    { id: 103, title: "K-컬처 글로벌 확산 속도, 올해 최고치 경신", source: "Korea Herald", viewed_at: "2026-03-22 21:05", read_time: 5, date: "2026-03-22" }
  ];
  const allDates = ['전체', ...new Set(mockHistory.map(h => h.date))];
  const filteredHistory = selectedDate === '전체' ? mockHistory : mockHistory.filter(h => h.date === selectedDate);

  // 이벤트 핸들러

  // ★ [추가] 북마크 삭제 핸들러 (image_6.png 관련)
  const handleDeleteBookmark = (id) => {
    if (window.confirm('정말 북마크를 삭제하시겠습니까? 데이터는 복구할 수 없습니다.')) {
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
      alert('북마크가 삭제되었습니다.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('정말 로그아웃 하시겠습니까?')) {
      localStorage.removeItem('curio_access_token');
      navigate('/');
    }
  };

  const handleWithdraw = () => {
    alert('회원 탈퇴가 완료되었습니다.');
    localStorage.removeItem('curio_access_token');
    setIsWithdrawModalOpen(false);
    navigate('/');
  };

  // 선택된 관심 카테고리 ID를 레이블로 변환하는 유틸리티 함수
  const getSelectedTopicLabels = () => {
    return userSettings.selectedTopics
      .map(topicId => TOPIC_LIST.find(t => t.id === topicId)?.label)
      .filter(Boolean)
      .join(', ');
  };

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
          <div className="w-10"></div> 
        </div>
        
        {/* 탭 네비게이션 */}
        <div className="max-w-[1400px] mx-auto px-10 flex gap-10 overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: '대시보드' },
            { id: 'bookmarks', label: '북마크' },
            { id: 'history', label: '읽은 기사' },
            { id: 'settings', label: '환경설정' }
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

      {/* 탭 1. 대시보드 */}
      {activeTab === 'dashboard' && (
        <main className="max-w-[1400px] mx-auto px-10 py-12 grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-10 animate-slide-up">
          <section className="space-y-10">
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <BookOpen className="w-7 h-7 text-blue-600" />
                나의 읽기 통계
              </h2>
              
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-10 rounded-[32px] shadow-sm border transition-colors duration-300`}>
                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="bg-blue-600 p-8 rounded-3xl text-white">
                    <p className="text-base font-bold mb-2">총 읽은 기사</p>
                    <p className="text-6xl font-black tracking-tight">{mockStats.reading.total_articles}<span className="text-2xl font-normal ml-1">개</span></p>
                  </div>
                  <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'} p-8 rounded-3xl transition-colors duration-300`}>
                    <p className={`text-base font-bold mb-2 transition ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>이번 주 읽은 기사</p>
                    <p className="text-6xl font-black tracking-tight">{mockStats.reading.this_week_articles}<span className={`text-2xl font-normal ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>개</span></p>
                  </div>
                </div>
                
                <div>
                  <p className={`text-base font-bold mb-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>가장 많이 읽은 카테고리 (Top 3)</p>
                  <div className="space-y-4">
                    {mockStats.reading.top_categories.map((cat, idx) => (
                      <div key={cat.topic} className={`flex items-center justify-between px-6 py-4 rounded-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-600'}`}>
                            {idx + 1}
                          </span>
                          <span className="text-3xl">{cat.icon}</span>
                          <span className="text-lg font-bold">{cat.label}</span>
                        </div>
                        <span className="text-lg font-bold text-blue-500">{cat.count}회</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Calendar className="w-7 h-7 text-indigo-500" />
              출석 현황
            </h2>
            
            <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-10 rounded-[32px] shadow-sm border space-y-6 transition-colors duration-300`}>
              <div className={`flex flex-col items-center justify-center p-8 rounded-2xl text-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4"><Calendar className="w-7 h-7" /></div>
                <p className="text-sm font-bold text-slate-500 mb-1">총 출석일</p>
                <p className="text-3xl font-black tracking-tight">{mockStats.attendance.total_days}일</p>
              </div>
              <div className={`flex flex-col items-center justify-center p-8 rounded-2xl text-center border transition-colors duration-300 ${isDarkMode ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-100 hover:border-orange-200'}`}>
                <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4"><Flame className="w-7 h-7" /></div>
                <p className="text-sm font-bold text-orange-500 mb-1">현재 연속 출석</p>
                <p className="text-3xl font-black text-orange-500 tracking-tight">{mockStats.attendance.current_streak}일</p>
              </div>
              <div className={`flex flex-col items-center justify-center p-8 rounded-2xl text-center transition-colors duration-300 ${isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4"><Award className="w-7 h-7" /></div>
                <p className="text-sm font-bold text-amber-500 mb-1">최장 연속 기록</p>
                <p className="text-3xl font-black text-amber-500 tracking-tight">{mockStats.attendance.longest_streak}일</p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* 탭 2. 북마크 (image_6.png 관련) */}
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

          {/* 북마크 리스트 (삭제 기능 추가) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookmarks.map(bookmark => (
              <div key={bookmark.id} className={`p-6 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    {bookmark.source}
                  </span>
                  {/* ★ 휴지통 아이콘 삭제 이벤트 바인딩 */}
                  <button 
                    onClick={() => handleDeleteBookmark(bookmark.id)} 
                    className="text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-bold mb-4 line-clamp-2">{bookmark.title}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {bookmark.tags.map(tag => (
                    <span key={tag} className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">#{tag}</span>
                  ))}
                </div>
                <p className={`text-xs font-medium text-right ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>저장일: {bookmark.saved_at}</p>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* 탭 3. 읽은 기사 */}
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

          {/* 읽은 기사 리스트 */}
          <div className="space-y-4">
            {filteredHistory.map(history => (
              <div key={history.id} className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{history.source}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                      {history.viewed_at.split(' ')[1]}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">{history.title}</h3>
                </div>
                <button className="p-3 text-slate-400 hover:text-blue-600 transition">
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* 탭 4. 환경설정 (수정/변경 기능 추가) (image_7.png 관련) */}
      {activeTab === 'settings' && (
        <main className="max-w-3xl mx-auto px-10 py-12 animate-slide-up space-y-8 pb-32">
          
          {/* 뉴스레터 설정 영역 */}
          <section className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-8 rounded-3xl shadow-sm border transition-colors duration-300`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              뉴스레터 설정
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-slate-200/50">
                <div>
                  <p className="font-bold text-lg">관심 카테고리 관리</p>
                  {/* ★ 상태 데이터를 사용하여 동적으로 표시 */}
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>선택된 관심사: {getSelectedTopicLabels()}</p>
                </div>
                {/* ★ "수정하기" 버튼 클릭 시 관심사 편집 모달 열기 (image_7.png 관련) */}
                <button 
                  onClick={() => setIsTopicsModalOpen(true)}
                  className="px-5 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition"
                >
                  수정하기
                </button>
              </div>
              
              <div className="flex items-center justify-between py-4 border-b border-slate-200/50">
                <div>
                  <p className="font-bold text-lg">발송 주기 및 시간</p>
                  {/* ★ 상태 데이터를 사용하여 동적으로 표시 */}
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{userSettings.digestFrequency === 'daily' ? '매일' : '매주'} 오전 {userSettings.digestTime} 발송</p>
                </div>
                {/* ★ "변경" 버튼 클릭 시 발송 설정 모달 열기 (image_7.png 관련) */}
                <button 
                  onClick={() => setIsDigestModalOpen(true)}
                  className="px-5 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition"
                >
                  변경
                </button>
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="font-bold text-lg">다크 모드 (UC-13)</p>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>어두운 테마로 화면을 표시합니다</p>
                </div>
                {/* 다크모드 토글 스위치 */}
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}>
                    {isDarkMode && <Moon className="w-4 h-4 text-blue-600" />}
                  </div>
                </button>
              </div>
            </div>
          </section>

          {/* 계정 관리 영역 */}
          <section className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} p-8 rounded-3xl shadow-sm border transition-colors duration-300`}>
            <h3 className="text-xl font-bold mb-6 text-slate-400 flex items-center gap-2">
              계정 관리
            </h3>
            
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

        </main>
      )}

      {/* 회원 탈퇴 확인 모달 */}
      {isWithdrawModalOpen && (
        <WithdrawModal isDarkMode={isDarkMode} onClose={() => setIsWithdrawModalOpen(false)} onWithdraw={handleWithdraw} />
      )}

      {/* ★ [추가] 관심 카테고리 편집 모달 */}
      <TopicSettingsModal 
        isDarkMode={isDarkMode}
        isOpen={isTopicsModalOpen}
        onClose={() => setIsTopicsModalOpen(false)}
        selectedTopics={userSettings.selectedTopics}
        onSave={(newTopics) => {
          setUserSettings(prev => ({ ...prev, selectedTopics: newTopics }));
          alert('관심 카테고리가 업데이트되었습니다.');
        }}
      />

      {/* ★ [추가] 발송 주기/시간 편집 모달 */}
      <DigestSettingsModal 
        isDarkMode={isDarkMode}
        isOpen={isDigestModalOpen}
        onClose={() => setIsDigestModalOpen(false)}
        frequency={userSettings.digestFrequency}
        time={userSettings.digestTime}
        onSave={(newFrequency, newTime) => {
          setUserSettings(prev => ({ ...prev, digestFrequency: newFrequency, digestTime: newTime }));
          alert('발송 설정이 변경되었습니다.');
        }}
      />
    </div>
  );
}


// --- 공통 모달 컴포넌트들 ---

// 회원 탈퇴 모달
function WithdrawModal({ isDarkMode, onClose, onWithdraw }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4">
      <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} w-full max-w-lg p-8 rounded-[32px] sm:rounded-[40px] shadow-2xl animate-slide-up relative`}>
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-2xl font-black mb-4">정말 탈퇴하시겠습니까?</h3>
        <p className={`text-base leading-relaxed mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
          탈퇴 시 사용자의 모든 데이터(북마크, 읽은 기록, 관심사 등)가 즉시 삭제되며 복구할 수 없습니다. 계속 진행하시겠습니까?
        </p>
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className={`flex-1 py-4 font-bold rounded-2xl transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            취소하기
          </button>
          <button 
            onClick={onWithdraw}
            className="flex-1 py-4 font-bold bg-red-500 text-white rounded-2xl hover:bg-red-600 transition shadow-lg shadow-red-200/50"
          >
            탈퇴하기
          </button>
        </div>
      </div>
    </div>
  );
}


// ★ [추가] 관심 카테고리 편집 모달 컴포넌트
function TopicSettingsModal({ isDarkMode, isOpen, onClose, selectedTopics, onSave }) {
  // 모달 내부에서 임시로 관리할 상태
  const [tempSelectedTopics, setTempSelectedTopics] = useState(selectedTopics);

  // 모달이 열릴 때마다 부모의 상태로 초기화
  useState(() => {
    if (isOpen) {
      setTempSelectedTopics(selectedTopics);
    }
  }, [isOpen, selectedTopics]);

  // 토픽 클릭 핸들러 (토글 방식)
  const toggleTopic = (topicId) => {
    if (tempSelectedTopics.includes(topicId)) {
      setTempSelectedTopics(tempSelectedTopics.filter(id => id !== topicId));
    } else {
      setTempSelectedTopics([...tempSelectedTopics, topicId]);
    }
  };

  const handleSave = () => {
    if (tempSelectedTopics.length === 0) {
      alert('최소 1개의 카테고리를 선택해야 합니다.');
      return;
    }
    onSave(tempSelectedTopics);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} w-full max-w-4xl p-10 rounded-[40px] shadow-2xl animate-slide-up relative`}>
        {/* 우측 상단 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100/50 transition">
          <X className="w-7 h-7" />
        </button>

        {/* 헤더 영역 */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Tag className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black mb-3">관심 카테고리 편집</h2>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            변경하고 싶은 관심 분야를 선택해주세요 (최소 1개)
          </p>
        </div>

        {/* 카테고리 그리드 UI (온보딩화면 재사용) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-12">
          {TOPIC_LIST.map((topic) => {
            const isSelected = tempSelectedTopics.includes(topic.id);
            return (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
                className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-200 relative ${
                  isSelected 
                    ? `border-blue-500 shadow-md ${isDarkMode ? 'bg-slate-700/50 text-white' : 'bg-blue-50 text-blue-700'}` 
                    : `border-slate-100 bg-white ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'text-slate-600'} hover:border-blue-200 hover:bg-slate-50`
                }`}
              >
                {/* 선택 표시 아이콘 */}
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

        {/* 하단 버튼 영역 */}
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className={`flex-1 py-4 font-bold rounded-2xl transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            취소하기
          </button>
          <button 
            onClick={handleSave}
            className={`flex-1 py-4 font-bold rounded-2xl transition shadow-lg ${tempSelectedTopics.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200/50' : `bg-slate-300 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} cursor-not-allowed`}`}
            disabled={tempSelectedTopics.length === 0}
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}


// ★ [추가] 발송 주기/시간 편집 모달 컴포넌트
function DigestSettingsModal({ isDarkMode, isOpen, onClose, frequency, time, onSave }) {
  // 모달 내부에서 임시로 관리할 상태
  const [tempFrequency, setTempFrequency] = useState(frequency);
  const [tempTime, setTempTime] = useState(time);

  // 모달이 열릴 때마다 부모의 상태로 초기화
  useState(() => {
    if (isOpen) {
      setTempFrequency(frequency);
      setTempTime(time);
    }
  }, [isOpen, frequency, time]);

  const handleSave = () => {
    onSave(tempFrequency, tempTime);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} w-full max-w-2xl p-10 rounded-[40px] shadow-2xl animate-slide-up relative`}>
        {/* 우측 상단 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100/50 transition">
          <X className="w-7 h-7" />
        </button>

        {/* 헤더 영역 */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Bell className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black mb-3">발송 설정 변경</h2>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            뉴스레터 발송 주기와 시간을 변경할 수 있습니다.
          </p>
        </div>

        {/* 설정 그리드 UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* 발송 주기 설정 (라디오 버튼 UI) */}
          <div className={`${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'} p-8 rounded-3xl border`}>
            <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${tempFrequency === 'daily' ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
              발송 주기
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {[ { id: 'daily', label: '매일' }, { id: 'weekly', label: '매주' } ].map(option => (
                <button 
                  key={option.id}
                  onClick={() => setTempFrequency(option.id)}
                  className={`py-4 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2 ${tempFrequency === option.id ? 'border-blue-500 bg-white text-blue-700 shadow' : `bg-white ${isDarkMode ? 'bg-slate-600 border-slate-500 text-slate-300' : 'text-slate-600 border-slate-100 hover:border-blue-100'}`}`}
                >
                  {tempFrequency === option.id && <Check className="w-5 h-5" />}
                  {option.label}
                </button>
              ))}
            </div>
            {tempFrequency === 'weekly' && (
              <p className="text-xs text-blue-600 font-medium mt-3 text-center">* 매주 월요일 오전에 발송됩니다.</p>
            )}
          </div>

          {/* 발송 시간 설정 (셀렉트 박스 UI) */}
          <div className={`${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-100'} p-8 rounded-3xl border`}>
            <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${tempTime ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
              발송 시간
            </h4>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-400 ml-1">오전</label>
              <select 
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className={`w-full p-4 rounded-xl border-2 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'border-slate-100 text-slate-700'}`}
              >
                <option value="06:00">06:00</option>
                <option value="07:00">07:00</option>
                <option value="08:00">08:00 (추천)</option>
                <option value="09:00">09:00</option>
              </select>
              <label className="block text-sm font-bold text-slate-400 ml-1 mt-4">오후</label>
              <select 
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className={`w-full p-4 rounded-xl border-2 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'border-slate-100 text-slate-700'}`}
              >
                <option value="18:00">18:00</option>
                <option value="19:00">19:00</option>
                <option value="20:00">20:00</option>
              </select>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className={`flex-1 py-4 font-bold rounded-2xl transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            취소하기
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-4 font-bold bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200/50"
          >
            변경 완료
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyPage;