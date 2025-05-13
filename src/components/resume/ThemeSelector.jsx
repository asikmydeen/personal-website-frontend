import React from 'react';
import { getAvailableThemes } from './ResumeThemes';
import { Button } from '../../components/ui/button';

const ThemeSelector = ({ selectedThemeId, onChange }) => {
  const themes = getAvailableThemes();

  return (
    <div className="theme-selector mb-6">
      <h3 className="text-lg font-medium text-gray-700 mb-3">Resume Theme</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {themes.map((theme) => (
          <Button
            key={theme.id}
            type="button"
            variant={theme.id === selectedThemeId ? "default" : "outline"}
            className={`relative flex flex-col items-center justify-center p-4 h-auto w-full gap-2 ${
              theme.id === selectedThemeId ? 'ring-2 ring-offset-2 ring-blue-500' : ''
            }`}
            onClick={() => onChange(theme.id)}
            style={{
              borderColor: theme.colors.border,
              backgroundColor: theme.id === selectedThemeId ? theme.colors.primary : theme.colors.background,
              color: theme.id === selectedThemeId ? 'white' : theme.colors.text,
            }}
          >
            <div className="theme-preview w-full h-12 mb-2 rounded" style={{
              backgroundColor: theme.colors.secondary,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: theme.styles.boxShadow,
              borderRadius: theme.styles.borderRadius
            }}>
              <div className="h-1 w-1/2 mt-2 ml-2" style={{ backgroundColor: theme.colors.primary }}></div>
              <div className="h-1 w-3/4 mt-1 ml-2" style={{ backgroundColor: theme.colors.accent }}></div>
              <div className="h-1 w-2/3 mt-1 ml-2" style={{ backgroundColor: theme.colors.accent, opacity: 0.5 }}></div>
            </div>
            <span className="font-medium text-sm">{theme.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
