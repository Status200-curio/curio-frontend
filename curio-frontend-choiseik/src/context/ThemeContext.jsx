// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

function applyDarkClass(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 1순위: localStorage 저장값, 없으면 다크모드 기본값
    const saved = localStorage.getItem('curio_dark_mode');
    const initial = saved !== null ? saved === 'true' : true; // 기본값: 다크모드
    applyDarkClass(initial);
    return initial;
  });

  // isDarkMode 변경 시 html 클래스 + localStorage 동기화
  useEffect(() => {
    applyDarkClass(isDarkMode);
    localStorage.setItem('curio_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  /** 토글 (localStorage만 — DB 저장은 호출부에서 담당) */
  const toggleTheme = () => setIsDarkMode(prev => !prev);

  /** 서버 응답값으로 테마 덮어쓰기 */
  const syncThemeFromServer = (serverDarkMode) => {
    setIsDarkMode(Boolean(serverDarkMode));
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, syncThemeFromServer }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
