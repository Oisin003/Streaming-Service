import React from "react";
import { useTheme } from "../ThemeContext.jsx";

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-switcher"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'}`}></i>
    </button>
  );
}
