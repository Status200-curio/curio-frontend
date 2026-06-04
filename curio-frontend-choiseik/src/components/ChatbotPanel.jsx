// src/components/ChatbotPanel.jsx
import { useState, useRef, useEffect, useCallback } from 'react'; // useCallback: scrollToBottom에서 사용
import { Send, X, Bot, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { useDwellTime } from '../hooks/useDwellTime';
import { articlesApi } from '../api/articles';

const MAX_TURNS = 10; // 세션당 최대 대화 턴 수

// 마크다운 → JSX 변환 (굵기, 줄바꿈만 처리)
function renderMarkdown(text) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return <span key={i}>{parts}{i < text.split('\n').length - 1 && <br />}</span>;
  });
}

function ChatbotPanel({ article, onClose }) {
  // 💡 수정 포인트: 교수님 피드백 반영을 위해 기사 제목을 굵은 글씨로 지정하고 줄바꿈(\n)을 통해 가독성 확보
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `📌 **[대상 기사]**\n${article.title.replace(/"/g, "'")}\n\n안녕하세요! 위 기사에 대해 궁금한 점을 무엇이든 물어보세요.`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 첫 토큰 대기
  const [isStreaming, setIsStreaming] = useState(false); // 토큰 수신 중
  const [sessionId, setSessionId] = useState(null);
  const [toast, setToast] = useState(null);  // 에러 토스트 메시지

  const messagesEndRef = useRef(null);

  // 유저 메시지 수 = 대화 턴 수
  const turnCount = messages.filter(m => m.role === 'user').length;
  const isMaxTurns = turnCount >= MAX_TURNS;

  // ── 체류 시간 측정 (article.id를 전달해야 함 — 함수 아님)
  useDwellTime(article?.id);

  // ── 자동 스크롤 ─────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── 토스트 자동 닫기 (4초) ──────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // ── 메시지 전송 ─────────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading || isStreaming || isMaxTurns) return;

    setInputValue('');

    // 유저 메시지 + 빈 어시스턴트 메시지 자리 추가
    setMessages(prev => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ]);
    setIsLoading(true);

    const token = localStorage.getItem('curio_access_token');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          article_id: article.id,
          session_id: sessionId,
          message: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`서버 오류 (HTTP ${response.status})`);
      }

      // 응답 헤더에서 session_id 수신
      const newSessionId = response.headers.get('X-Session-Id');
      if (newSessionId) setSessionId(newSessionId);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let lineBuffer = ''; // 네트워크 청크가 줄 중간에 잘릴 경우 대비

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuffer += decoder.decode(value, { stream: true });

        // 완전한 줄만 처리, 나머지는 버퍼에 유지
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const raw = trimmed.slice(5).trim();
          // [DONE] 또는 빈 값이면 스트리밍 종료
          if (!raw || raw === '[DONE]') {
            setIsStreaming(false);
            continue;
          }

          // 토큰 텍스트를 메시지에 누적
          setIsLoading(false);
          setIsStreaming(true);
          setMessages(prev => {
            const updated = [...prev];
            const last = { ...updated[updated.length - 1] };
            last.content += raw;
            updated[updated.length - 1] = last;
            return updated;
          });
        }
      }
    } catch (err) {
      console.error('[ChatbotPanel] 오류:', err.message);
      setToast('AI 서비스에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');

      // 내용 없는 어시스턴트 자리 제거
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  if (!article) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col transition-colors duration-300">

        {/* ── 헤더 ─────────────────────────────────────────────────────────── */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Curio AI 챗봇</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{article.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 턴 카운터 */}
            <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{turnCount}/{MAX_TURNS}</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ── 에러 토스트 ──────────────────────────────────────────────────── */}
        {toast && (
          <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl flex items-start gap-2 text-sm text-red-700 dark:text-red-400 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{toast}</span>
          </div>
        )}

        {/* ── 메시지 목록 ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-950">
          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            const isEmptyBot = msg.role === 'assistant' && !msg.content;

            if (isEmptyBot && isLoading) {
              // 첫 토큰 대기 중 — 로딩 버블
              return (
                <div key={idx} className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-sm">답변을 생성하고 있습니다...</span>
                  </div>
                </div>
              );
            }

            if (!msg.content) return null; // 내용 없는 빈 버블 숨김

            return (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-blue-200 dark:shadow-blue-900/40'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl rounded-tl-sm shadow-sm'
                  }`}>
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                  {/* 스트리밍 커서 */}
                  {isStreaming && isLast && msg.role === 'assistant' && (
                    <span className="inline-block w-0.5 h-3.5 bg-slate-400 dark:bg-slate-500 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ── 입력창 ───────────────────────────────────────────────────────── */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          {isMaxTurns ? (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-2">
              최대 대화 횟수({MAX_TURNS}턴)에 도달했습니다. 새 기사에서 새 대화를 시작해보세요.
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isLoading || isStreaming}
                placeholder="기사에 대해 질문해보세요"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-5 py-3 text-sm dark:text-slate-200 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 transition"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading || isStreaming}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition shadow-md shadow-blue-200 dark:shadow-blue-900/50"
              >
                {isLoading || isStreaming
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <Send className="w-5 h-5" />
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatbotPanel;