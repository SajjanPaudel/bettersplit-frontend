import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const theme = {
    background: isDark ? 'bg-[#141417]' : 'bg-gray-50',
    card: isDark ? 'bg-[#0c111c]' : 'bg-white',
    cardHover: isDark ? 'hover:bg-[#ffffff08]' : 'hover:bg-gray-50',
    text: isDark ? 'text-gray-400' : 'text-gray-500',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-500',
    textSubtitle: isDark ? 'text-gray-300' : 'text-gray-400',
    border: isDark ? 'border-[#ffffff0a]' : 'border-gray-200',
    input: isDark ? 'bg-[#ffffff0a]' : 'bg-white',
    inputBorder: isDark ? 'border-[#ffffff1a]' : 'border-gray-300',
    inputFocus: isDark ? 'focus:border-[#ffffff33]' : 'focus:border-blue-500',
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);