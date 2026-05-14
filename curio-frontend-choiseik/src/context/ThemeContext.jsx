// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('curio_dark_mode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('curio_dark_mode', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const syncThemeFromServer = (serverDarkMode) => {
    setIsDarkMode(serverDarkMode);
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
