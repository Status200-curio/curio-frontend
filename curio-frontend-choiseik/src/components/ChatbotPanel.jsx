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
  const messagesEndRef = useRef(null);

  // ★ 체류 시간 측정 훅 적용: 패널이 닫힐 때 이 함수가 자동으로 실행됩니다.
  const handleRecordDwellTime = useCallback(async (dwellTimeSeconds) => {
    console.log(`[체류 시간 측정] 기사 ID: ${article.id}, 머문 시간: ${dwellTimeSeconds}초`);
    
    // --- [Mock 로직: 백엔드 API 연결 시 주석 해제] ---
    /*
    try {
      await articlesApi.recordView(article.id, dwellTimeSeconds);
      console.log('체류 시간 데이터 전송 성공');
    } catch (error) {
      console.error('체류 시간 데이터 전송 실패:', error);
    }
    */
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

    // --- [테스트를 위한 Mock 스트리밍 로직] ---
    setTimeout(() => {
      const mockResponse = `네, 질문하신 내용에 대한 답변입니다. 이 기사(${article.title})의 핵심은 사용자의 데이터를 기반으로 초개인화를 이뤄낸다는 점입니다. 추가로 궁금한 점이 있으신가요?`;
      let currentIndex = 0;
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const streamInterval = setInterval(() => {
        if (currentIndex < mockResponse.length) {
          const char = mockResponse[currentIndex];
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = { ...newMessages[newMessages.length - 1] };
            lastMsg.content += char;
            newMessages[newMessages.length - 1] = lastMsg;
            return newMessages;
          });
          currentIndex++;
        } else {
          clearInterval(streamInterval);
          setIsTyping(false);
        }
      }, 30);
    }, 600);
    return;
    // --- [테스트를 위한 Mock 로직 끝] ---
  };

  if (!article) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-left">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Curio AI 챗봇</h3>
              <p className="text-xs text-slate-500 line-clamp-1">{article.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-blue-200' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm shadow-sm'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">답변을 생성하고 있습니다...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              placeholder="기사에 대해 질문해보세요"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 transition"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || isTyping}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-md shadow-blue-200"
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