import React from 'react';
import { Tooltip } from 'antd';
import { useTheme } from '../../providers/ThemeProvider';
import './ThemeSwitcher.styles.css';
import { motion } from 'framer-motion';

const ThemeSwitcher = ({ style }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const switcherVariants = {
    light: {
      backgroundColor: '#f0f0f0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    dark: {
      backgroundColor: '#333',
      boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1)'
    }
  };

  const iconVariants = {
    light: { rotate: 0 },
    dark: { rotate: 360 },
  };

  return (
    <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <motion.div
        className="theme-switcher-container"
        style={style}
        onClick={toggleTheme}
        role="button"
        tabIndex={0}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className={`theme-switcher ${isDark ? 'dark' : 'light'}`}
          variants={switcherVariants}
          animate={isDark ? 'dark' : 'light'}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.div
            className="icon sun-moon-icon"
            variants={iconVariants}
            animate={isDark ? 'dark' : 'light'}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            {isDark ? (
              // Moon icon
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
              </motion.svg>
            ) : (
              // Sun icon
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2"></path>
                <path d="M12 20v2"></path>
                <path d="m4.93 4.93 1.41 1.41"></path>
                <path d="m17.66 17.66 1.41 1.41"></path>
                <path d="M2 12h2"></path>
                <path d="M20 12h2"></path>
                <path d="m6.34 17.66-1.41 1.41"></path>
                <path d="m19.07 4.93-1.41 1.41"></path>
              </motion.svg>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </Tooltip>
  );
};

export default ThemeSwitcher;
