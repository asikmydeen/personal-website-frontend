/**
 * Resume theme definitions
 * Each theme contains styling properties that will be applied to the resume
 */

export const resumeThemes = {
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, contemporary design with a minimalist approach',
    colors: {
      primary: '#2563eb', // Blue
      secondary: '#e2e8f0', // Light gray
      text: '#1e293b', // Dark blue-gray
      background: '#ffffff', // White
      accent: '#3b82f6', // Lighter blue
      border: '#cbd5e1', // Light gray-blue
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    styles: {
      borderRadius: '0.5rem',
      sectionSpacing: '1.5rem',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      headingStyle: 'text-2xl font-semibold text-blue-600 border-b border-blue-200 pb-2 mb-4',
      subHeadingStyle: 'text-lg font-medium text-gray-800',
    }
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Traditional design with a formal business appearance',
    colors: {
      primary: '#334155', // Slate gray
      secondary: '#f1f5f9', // Very light gray
      text: '#0f172a', // Very dark blue-gray
      background: '#ffffff', // White
      accent: '#64748b', // Medium gray
      border: '#e2e8f0', // Light gray
    },
    fonts: {
      heading: "'Georgia', serif",
      body: "'Arial', sans-serif",
    },
    styles: {
      borderRadius: '0.25rem',
      sectionSpacing: '2rem',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      headingStyle: 'text-xl font-bold text-slate-700 border-b-2 border-slate-300 pb-2 mb-4',
      subHeadingStyle: 'text-base font-semibold text-slate-800',
    }
  },

  creative: {
    id: 'creative',
    name: 'Creative',
    description: 'Vibrant and distinctive design for creative professionals',
    colors: {
      primary: '#8b5cf6', // Violet
      secondary: '#f3e8ff', // Light violet
      text: '#581c87', // Dark purple
      background: '#ffffff', // White
      accent: '#c4b5fd', // Light purple
      border: '#ddd6fe', // Very light purple
    },
    fonts: {
      heading: "'Poppins', sans-serif",
      body: "'Open Sans', sans-serif",
    },
    styles: {
      borderRadius: '1rem',
      sectionSpacing: '1.75rem',
      boxShadow: '0 10px 15px -3px rgb(139 92 246 / 0.1)',
      headingStyle: 'text-2xl font-bold text-violet-600 border-l-4 border-violet-400 pl-3 mb-4',
      subHeadingStyle: 'text-lg font-semibold text-violet-800',
    }
  },

  academic: {
    id: 'academic',
    name: 'Academic',
    description: 'Structured and formal design for educational or research contexts',
    colors: {
      primary: '#0c4a6e', // Dark blue
      secondary: '#f0f9ff', // Very light blue
      text: '#0f172a', // Very dark blue-gray
      background: '#ffffff', // White
      accent: '#0ea5e9', // Sky blue
      border: '#bae6fd', // Light blue
    },
    fonts: {
      heading: "'Times New Roman', serif",
      body: "'Cambria', serif",
    },
    styles: {
      borderRadius: '0',
      sectionSpacing: '2.25rem',
      boxShadow: 'none',
      headingStyle: 'text-xl font-bold text-sky-900 pb-1 mb-4 border-b border-sky-300',
      subHeadingStyle: 'text-base font-bold text-sky-800',
    }
  },

  executive: {
    id: 'executive',
    name: 'Executive',
    description: 'Elegant and sophisticated design with a premium feel',
    colors: {
      primary: '#78350f', // Dark brown
      secondary: '#fef3c7', // Very light yellow
      text: '#1c1917', // Nearly black
      background: '#fffbeb', // Cream white
      accent: '#d97706', // Amber
      border: '#fde68a', // Light yellow
    },
    fonts: {
      heading: "'Playfair Display', serif",
      body: "'Libre Baskerville', serif",
    },
    styles: {
      borderRadius: '0.125rem',
      sectionSpacing: '2rem',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
      headingStyle: 'text-2xl font-semibold text-amber-800 border-b border-amber-300 pb-2 mb-4',
      subHeadingStyle: 'text-lg font-medium text-amber-900',
    }
  }
};

/**
 * Get all available resume themes
 * @returns {Array} Array of theme objects
 */
export const getAvailableThemes = () => {
  return Object.values(resumeThemes);
};

/**
 * Get a specific theme by ID
 * @param {string} themeId - ID of the theme to retrieve
 * @returns {object} Theme object or default theme if not found
 */
export const getThemeById = (themeId) => {
  return resumeThemes[themeId] || resumeThemes.modern; // Default to modern if theme not found
};

/**
 * Generate CSS variables for a theme
 * @param {object} theme - Theme object
 * @returns {object} CSS variables as a style object
 */
export const getThemeVariables = (theme) => {
  return {
    '--resume-primary': theme.colors.primary,
    '--resume-secondary': theme.colors.secondary,
    '--resume-text': theme.colors.text,
    '--resume-background': theme.colors.background,
    '--resume-accent': theme.colors.accent,
    '--resume-border': theme.colors.border,
    '--resume-heading-font': theme.fonts.heading,
    '--resume-body-font': theme.fonts.body,
    '--resume-border-radius': theme.styles.borderRadius,
    '--resume-section-spacing': theme.styles.sectionSpacing,
    '--resume-box-shadow': theme.styles.boxShadow,
  };
};
