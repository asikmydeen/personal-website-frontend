import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportResumeToPdf } from '../../services/resumeService'; // Keep for export usage
import ReactMarkdown from 'react-markdown';
import useStore from '../../store/useStore';
import { Edit, FileDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import CollapsibleTags from '../../components/ui/collapsible-tags';

const ResumeViewPage = () => {
  const resume = useStore(state => state.resumeData);
  const fetchResumeData = useStore(state => state.fetchResumeData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        await fetchResumeData();
      } catch (err) {
        setError('An unexpected error occurred while fetching resume data.');
        console.error('Fetch resume error:', err);
      }
      setLoading(false);
    };
    loadData();
  }, [fetchResumeData]);

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
    return <div className="p-4 text-center">No resume data found. <button onClick={() => navigate('/resume/edit')} className="text-indigo-600 hover:underline">Create one now?</button></div>;
  }

  const { name, title, summary, contact, experience, education, skills } = resume;

  const sectionTitleClass = "text-xl sm:text-2xl font-semibold text-indigo-700 border-b-2 border-indigo-200 pb-1 sm:pb-2 mb-3 sm:mb-4";
  const listItemClass = "mb-3 sm:mb-4";
  const subHeadingClass = "text-base sm:text-lg font-semibold text-gray-800";
  const dateClass = "text-xs sm:text-sm text-gray-500 italic";

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-8 bg-white shadow-lg sm:shadow-2xl rounded-lg my-4 sm:my-8 print:shadow-none print:my-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-8 print:hidden">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 md:mb-0">{name || 'Your Name'}</h1>
        <div className="flex space-x-2">
          <Button
            onClick={() => navigate('/resume/edit')}
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
      <p className="text-lg sm:text-xl text-gray-600 mb-4 sm:mb-6 text-center md:text-left print:text-left">{title || 'Your Professional Title'}</p>

      {/* Contact Section */}
      {contact && (
        <div className="mb-6 sm:mb-8 text-center md:text-left print:text-left">
          <div className="flex flex-wrap justify-center md:justify-start text-xs sm:text-sm text-gray-700">
            {contact.email && <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 mr-3 mb-1">{contact.email}</a>}
            {contact.phone && <span className="mr-3 mb-1">{contact.phone}</span>}
            {contact.linkedin && <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 mr-3 mb-1">LinkedIn</a>}
            {contact.github && <a href={contact.github} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 mr-3 mb-1">GitHub</a>}
            {contact.website && <a href={contact.website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 mb-1">Portfolio</a>}
          </div>
        </div>
      )}

      {/* Summary Section */}
      {summary && (
        <section className="mb-6 sm:mb-8">
          <h2 className={sectionTitleClass}>Summary</h2>
          <div className="prose prose-xs sm:prose-sm max-w-none text-gray-700 text-sm sm:text-base">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </section>
      )}

      {/* Experience Section */}
      {experience && experience.length > 0 && (
        <section className="mb-6 sm:mb-8">
          <h2 className={sectionTitleClass}>Experience</h2>
          {experience.map((exp, index) => (
            <div key={exp.id || index} className={listItemClass}>
              <h3 className={subHeadingClass}>{exp.role || 'Role'} at {exp.company || 'Company'}</h3>
              <p className={dateClass}>{exp.period || 'Date Range'}</p>
              {exp.responsibilities && exp.responsibilities.length > 0 && (
                <ul className="list-disc list-inside text-gray-700 mt-1 sm:mt-2 space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                  {exp.responsibilities.map((resp, rIndex) => <li key={rIndex}>{resp}</li>)}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education Section */}
      {education && education.length > 0 && (
        <section className="mb-6 sm:mb-8">
          <h2 className={sectionTitleClass}>Education</h2>
          {education.map((edu, index) => (
            <div key={edu.id || index} className={listItemClass}>
              <h3 className={subHeadingClass}>{edu.degree || 'Degree'} - {edu.institution || 'Institution'}</h3>
              <p className={dateClass}>{edu.period || 'Date Range'}</p>
              {edu.details && <p className="text-gray-700 mt-1 text-xs sm:text-sm">{edu.details}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <section>
          <h2 className={sectionTitleClass}>Skills</h2>
          <CollapsibleTags
            tags={skills}
            initialVisibleCount={6}
            getTagLabel={(skill) => typeof skill === 'string' ? skill : skill.name}
            className="mt-2"
          />
        </section>
      )}

      {resume.lastUpdated &&
        <p className="text-xs text-gray-400 mt-8 sm:mt-12 text-center print:hidden">
          Last updated: {new Date(resume.lastUpdated).toLocaleString()}
        </p>
      }
    </div>
  );
};

export default ResumeViewPage;
