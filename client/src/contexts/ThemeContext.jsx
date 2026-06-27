import { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext();

export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("shopsphere_theme") || "system";
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("shopsphere_theme", newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    
    const updateTheme = () => {
      let isDark = false;
      if (theme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = theme === "dark";
      }

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    updateTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => updateTheme();
      mediaQuery.addEventListener("change", handler);
      return () => {
        mediaQuery.removeEventListener("change", handler);
      };
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
