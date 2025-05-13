import React, { useEffect, useState } from 'react';
import { resumeThemes } from './ResumeThemes';
import { Palette } from 'lucide-react';

/**
 * ThemeRadioSelector - A radio button group component for selecting resume themes in the view mode
 *
 * @param {Object} props
 * @param {string} props.selectedTheme - Currently selected theme ID
 * @param {Function} props.onChange - Callback when theme is changed
 */
const ThemeRadioSelector = ({ selectedTheme = 'modern', onChange }) => {
  // Track if we're in dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode on component mount and when it changes
  useEffect(() => {
    const checkDarkMode = () => {
      // Check if dark mode is active using window.matchMedia
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches ||
                     document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Initial check
    checkDarkMode();

    // Set up listeners for changes in color scheme preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e) => {
      setIsDarkMode(e.matches);
    };

    darkModeMediaQuery.addEventListener('change', listener);

    // Also check when DOM changes - might have theme toggle class changes
    const observer = new MutationObserver(() => {
      checkDarkMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Clean up listeners
    return () => {
      darkModeMediaQuery.removeEventListener('change', listener);
      observer.disconnect();
    };
  }, []);

  const handleThemeChange = (themeId) => {
    if (onChange) {
      onChange(themeId);
    }
  };

  return (
    <div className="flex items-center">
      <div className="flex items-center p-2 rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700">
        <Palette className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
        <div className="flex flex-wrap gap-2">
          {Object.entries(resumeThemes).map(([id, theme]) => (
            <div
              key={id}
              onClick={() => handleThemeChange(id)}
              className={`
                flex items-center px-3 py-1.5 rounded-full text-sm cursor-pointer
                ${selectedTheme === id
                  ? 'ring-2 ring-offset-1 ring-blue-500'
                  : 'hover:opacity-90'}
              `}
              style={{
                // Use theme's own colors, but lighten/darken as needed for visibility
                backgroundColor: theme.colors.secondary,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                boxShadow: selectedTheme === id ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
              }}
              title={`${theme.name} theme: ${theme.description}`}
            >
              <div
                className="h-4 w-4 rounded-full mr-2"
                style={{
                  backgroundColor: theme.colors.primary,
                  border: '1px solid rgba(0,0,0,0.1)'
                }}
              />
              <span style={{ color: theme.colors.text }} className="font-medium">
                {theme.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeRadioSelector;
