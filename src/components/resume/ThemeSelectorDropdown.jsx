import React from 'react';
import { Palette } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select';
import { resumeThemes } from './ResumeThemes';

/**
 * ThemeSelectorDropdown - A dropdown component for selecting resume themes in the view mode
 *
 * @param {Object} props
 * @param {string} props.selectedTheme - Currently selected theme ID
 * @param {Function} props.onChange - Callback when theme is changed
 */
const ThemeSelectorDropdown = ({ selectedTheme = 'modern', onChange }) => {
  const handleThemeChange = (themeId) => {
    if (onChange) {
      onChange(themeId);
    }
  };

  return (
    <div className="flex items-center">
      <Select value={selectedTheme} onValueChange={handleThemeChange}>
        <SelectTrigger className="w-[180px] bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-500">
          <div className="flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select theme" className="text-black dark:text-white" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-800 text-black dark:text-white">
          <SelectGroup>
            <SelectLabel className="text-gray-800 dark:text-gray-200">Resume Themes</SelectLabel>
            {Object.entries(resumeThemes).map(([id, theme]) => (
              <SelectItem key={id} value={id} className="cursor-pointer text-black dark:text-white">
                <div className="flex items-center">
                  <span
                    className="h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: theme.colors.primary }}
                  ></span>
                  {theme.name}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ThemeSelectorDropdown;
