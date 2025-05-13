import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { exportResumeToPdf, updateResumeData } from '../../services/resumeService';
import ReactMarkdown from 'react-markdown';
import useStore from '../../store/useStore';
import { Edit, FileDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import ResumeCollapsibleTags from '../../components/resume/ResumeCollapsibleTags';
import { getThemeById } from '../../components/resume/ResumeThemes';
import ThemeRadioSelector from '../../components/resume/ThemeRadioSelector';
import '../../styles/resume-theme.css';

const ResumeViewPage = () => {
  const resume = useStore(state => state.resumeData);
  const fetchResumeData = useStore(state => state.fetchResumeData);
  const setResumeData = useStore(state => state.setResumeData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('modern');
  const [savingTheme, setSavingTheme] = useState(false);
  const navigate = useNavigate();
  const { resumeId } = useParams();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        await fetchResumeData(resumeId);
      } catch (err) {
        setError('An unexpected error occurred while fetching resume data.');
        console.error('Fetch resume error:', err);
      }
      setLoading(false);
    };
    loadData();
  }, [fetchResumeData]);

  useEffect(() => {
    if (resume?.theme) {
      setSelectedTheme(resume.theme);
    }
  }, [resume]);

  const handleThemeChange = async (themeId) => {
    if (!resume || themeId === resume.theme) return;

    // Update local state immediately for responsive UI
    setSelectedTheme(themeId);

    // Update in-memory resume data
    const updatedResume = {
      ...resume,
      theme: themeId
    };
    setResumeData(updatedResume);

    // Save to backend
    try {
      setSavingTheme(true);
      await updateResumeData(updatedResume, resume.id);
    } catch (err) {
      console.error('Error saving theme:', err);
      // Could add error handling here if needed
    } finally {
      setSavingTheme(false);
    }
  };

  const handleExportPDF = async () => {
    alert('Placeholder: PDF export functionality would be triggered here. This typically involves a backend service to generate the PDF.');
    // Example of calling a service, though the actual PDF generation is backend
    // const response = await exportResumeToPdf(resume.id); // Assuming resume has an ID
    // if (response.success && response.data.pdfUrl) {
    //   window.open(response.data.pdfUrl, '_blank');
    // } else {
    //   alert(response.error || 'Could not export to PDF.');
    // }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading resume...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!resume) {
    return <div className="p-4 text-center">No resume data found. <button onClick={() => navigate('/resume')} className="text-indigo-600 hover:underline">Return to resume list</button></div>;
  }

  const { name, title, summary, contact, experience, education, skills } = resume;

  const sectionTitleClass = "text-xl sm:text-2xl font-semibold text-indigo-700 border-b-2 border-indigo-200 pb-1 sm:pb-2 mb-3 sm:mb-4";
  const listItemClass = "mb-3 sm:mb-4";
  const subHeadingClass = "text-base sm:text-lg font-semibold text-gray-800";
  const dateClass = "text-xs sm:text-sm text-gray-500 italic";

  // Get the selected theme or default to 'modern'
  const theme = getThemeById(resume.theme || 'modern');

  // Generate CSS variables from the theme
  const themeStyles = {
    '--resume-primary': theme.colors.primary,
    '--resume-secondary': theme.colors.secondary,
    '--resume-text': theme.colors.text,
    '--resume-background': theme.colors.background,
    '--resume-accent': theme.colors.accent,
    '--resume-border': theme.colors.border,
    '--resume-heading-font': theme.fonts.heading,
    '--resume-body-font': theme.fonts.body,
  };

  // Apply theme-specific classes
  const themedSectionTitleClass = theme.styles.headingStyle;
  const themedSubHeadingClass = theme.styles.subHeadingStyle;

  // Function to safely render HTML content
  const renderHTML = (content) => {
    return { __html: content };
  };

  return (
    <div className="px-4 sm:px-6 md:px-8">
      <div
        className="resume-container w-full max-w-full p-3 sm:p-4 md:p-8 shadow-lg sm:shadow-2xl rounded-lg my-4 sm:my-8 print:shadow-none print:my-0"
        style={{
          ...themeStyles,
          fontFamily: 'var(--resume-body-font)',
          color: 'var(--resume-text)',
          backgroundColor: 'var(--resume-background) !important',
          borderRadius: theme.styles.borderRadius,
          boxShadow: theme.styles.boxShadow,
          // Force theme colors regardless of dark/light mode
          '--tw-prose-body': 'var(--resume-text)',
          '--tw-prose-headings': 'var(--resume-primary)',
          '--tw-prose-links': 'var(--resume-accent)',
          '--tw-prose-bold': 'var(--resume-text)',
          '--tw-prose-counters': 'var(--resume-primary)',
          '--tw-prose-bullets': 'var(--resume-primary)',
          '--tw-prose-quotes': 'var(--resume-text)',
          '--tw-prose-code': 'var(--resume-text)',
          '--tw-prose-hr': 'var(--resume-border)',
          '--tw-prose-th-borders': 'var(--resume-border)',
          '--tw-prose-td-borders': 'var(--resume-border)',
        }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-8 print:hidden">
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-0"
          style={{
            color: 'var(--resume-primary)',
            fontFamily: 'var(--resume-heading-font)'
          }}
        >
          {name || 'Your Name'}
        </h1>
        <div className="flex items-center space-x-3">
          <ThemeRadioSelector
            selectedTheme={selectedTheme}
            onChange={handleThemeChange}
          />
          <div className="flex space-x-2">
            <Button
              onClick={() => navigate(`/resume/edit/${resumeId}`)}
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              title="Edit Resume"
            >
              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Edit Resume</span>
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              title="Export to PDF"
            >
              <FileDown className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Export to PDF</span>
            </Button>
          </div>
        </div>
      </div>
      <p
        className="text-lg sm:text-xl mb-4 sm:mb-6 text-center md:text-left print:text-left"
        style={{
          color: 'var(--resume-accent)',
          fontFamily: 'var(--resume-heading-font)'
        }}
      >
        {title || 'Your Professional Title'}
      </p>

      {/* Contact Section */}
      {contact && (
        <div className="mb-6 sm:mb-8 text-center md:text-left print:text-left">
          <div className="flex flex-wrap justify-center md:justify-start text-xs sm:text-sm" style={{ color: 'var(--resume-text)' }}>
            {contact.email &&
              <a
                href={`mailto:${contact.email}`}
                className="mr-3 mb-1"
                style={{ color: 'var(--resume-text)', textDecoration: 'underline' }}
                onMouseOver={(e) => e.target.style.color = 'var(--resume-primary)'}
                onMouseOut={(e) => e.target.style.color = 'var(--resume-text)'}
              >
                {contact.email}
              </a>
            }
            {contact.phone && <span className="mr-3 mb-1">{contact.phone}</span>}
            {contact.linkedin &&
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mr-3 mb-1"
                style={{ color: 'var(--resume-text)', textDecoration: 'underline' }}
                onMouseOver={(e) => e.target.style.color = 'var(--resume-primary)'}
                onMouseOut={(e) => e.target.style.color = 'var(--resume-text)'}
              >
                LinkedIn
              </a>
            }
            {contact.github &&
              <a
                href={contact.github}
                target="_blank"
                rel="noopener noreferrer"
                className="mr-3 mb-1"
                style={{ color: 'var(--resume-text)', textDecoration: 'underline' }}
                onMouseOver={(e) => e.target.style.color = 'var(--resume-primary)'}
                onMouseOut={(e) => e.target.style.color = 'var(--resume-text)'}
              >
                GitHub
              </a>
            }
            {contact.website &&
              <a
                href={contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-1"
                style={{ color: 'var(--resume-text)', textDecoration: 'underline' }}
                onMouseOver={(e) => e.target.style.color = 'var(--resume-primary)'}
                onMouseOut={(e) => e.target.style.color = 'var(--resume-text)'}
              >
                Portfolio
              </a>
            }
          </div>
        </div>
      )}

      {/* Summary Section */}
      {summary && (
        <section className="mb-6 sm:mb-8" style={{ marginBottom: 'var(--resume-section-spacing)' }}>
          <h2 className={themedSectionTitleClass} style={{ fontFamily: 'var(--resume-heading-font)' }}>Summary</h2>
          <div className="prose prose-xs sm:prose-sm max-w-none text-sm sm:text-base"
               style={{ color: 'var(--resume-text)' }}
               dangerouslySetInnerHTML={renderHTML(summary)} />
        </section>
      )}

      {/* Experience Section */}
      {experience && experience.length > 0 && (
        <section className="mb-6 sm:mb-8" style={{ marginBottom: 'var(--resume-section-spacing)' }}>
          <h2 className={themedSectionTitleClass} style={{ fontFamily: 'var(--resume-heading-font)' }}>Experience</h2>
          {experience.map((exp, index) => (
            <div key={exp.id || index} className={listItemClass}>
              <h3 className={themedSubHeadingClass} style={{ fontFamily: 'var(--resume-heading-font)' }}>
                {exp.role || 'Role'} at {exp.company || 'Company'}
              </h3>
              <p className={dateClass} style={{ color: 'var(--resume-accent)' }}>{exp.period || 'Date Range'}</p>
              {exp.responsibilities && exp.responsibilities.length > 0 && (
                <div className="mt-2 space-y-2">
                  {exp.responsibilities.map((resp, rIndex) => (
                    <div
                      key={rIndex}
                      className="ml-4 text-xs sm:text-sm"
                      style={{ color: 'var(--resume-text)' }}
                      dangerouslySetInnerHTML={renderHTML(resp)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education Section */}
      {education && education.length > 0 && (
        <section className="mb-6 sm:mb-8" style={{ marginBottom: 'var(--resume-section-spacing)' }}>
          <h2 className={themedSectionTitleClass} style={{ fontFamily: 'var(--resume-heading-font)' }}>Education</h2>
          {education.map((edu, index) => (
            <div key={edu.id || index} className={listItemClass}>
              <h3 className={themedSubHeadingClass} style={{ fontFamily: 'var(--resume-heading-font)' }}>
                {edu.degree || 'Degree'} - {edu.institution || 'Institution'}
              </h3>
              <p className={dateClass} style={{ color: 'var(--resume-accent)' }}>{edu.period || 'Date Range'}</p>
              {edu.details && (
                <div
                  className="mt-1 text-xs sm:text-sm"
                  style={{ color: 'var(--resume-text)' }}
                  dangerouslySetInnerHTML={renderHTML(edu.details)}
                />
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <section>
          <h2 className={themedSectionTitleClass} style={{ fontFamily: 'var(--resume-heading-font)' }}>Skills</h2>
          <ResumeCollapsibleTags
            tags={skills}
            initialVisibleCount={8}
            getTagLabel={(skill) => typeof skill === 'string' ? skill : skill.name}
            className="mt-2"
            style={{
              '--tag-bg': 'var(--resume-secondary)',
              '--tag-text': 'var(--resume-text)',
              '--tag-border': 'var(--resume-border)',
            }}
          />
        </section>
      )}

      {resume.lastUpdated &&
        <p className="text-xs mt-8 sm:mt-12 text-center print:hidden" style={{ color: 'var(--resume-border)' }}>
          Last updated: {new Date(resume.lastUpdated).toLocaleString()}
        </p>
      }
      </div>
    </div>
  );
};

export default ResumeViewPage;
