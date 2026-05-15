// src/components/ChatbotPanel.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Bot, Loader2 } from 'lucide-react';
import { useDwellTime } from '../hooks/useDwellTime'; // ★ 커스텀 훅 불러오기
import { articlesApi } from '../api/articles'; // ★ API 모듈 불러오기

function ChatbotPanel({ article, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `안녕하세요! "${article.title}" 기사에 대해 무엇이든 물어보세요.` }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // ★ 체류 시간 측정 훅 적용: 패널이 닫힐 때 이 함수가 자동으로 실행됩니다.
  const handleRecordDwellTime = useCallback(async (dwellTimeSeconds) => {
    try {
      await articlesApi.recordView(article.id, dwellTimeSeconds);
    } catch (error) {
      console.error('체류 시간 데이터 전송 실패:', error);
    }
  }, [article.id]);

  // 커스텀 훅에 콜백 함수 전달 (컴포넌트 라이프사이클 관리)
  useDwellTime(handleRecordDwellTime);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // SSE 스트리밍으로 백엔드 챗봇 연결
    const token = localStorage.getItem('curio_access_token');
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          article_id: article.id,
          session_id: sessionId,
          message: userMessage,
        }),
      });

      // 새 세션 ID는 응답 헤더에서 받거나, done 이벤트의 payload에서 처리
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === 'token') {
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = { ...newMessages[newMessages.length - 1] };
                lastMsg.content += parsed.content;
                newMessages[newMessages.length - 1] = lastMsg;
                return newMessages;
              });
            } else if (parsed.type === 'done') {
              if (parsed.session_id) setSessionId(parsed.session_id);
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message);
            }
          } catch {
            // JSON 파싱 실패 시 무시
          }
        }
      }
    } catch (error) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' };
        return newMessages;
      });
      console.error('챗봇 API 오류:', error);
    } finally {
      setIsTyping(false);
    }
  };

  if (!article) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-left transition-colors duration-300">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Curio AI 챗봇</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{article.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 dark:bg-slate-950">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-blue-200 dark:shadow-blue-900/50'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl rounded-tl-sm shadow-sm'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">답변을 생성하고 있습니다...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              placeholder="기사에 대해 질문해보세요"
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-5 py-3 text-sm dark:text-slate-200 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition shadow-md shadow-blue-200 dark:shadow-blue-900/50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPanel;
