import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResumeData, updateResumeData, getResumeVersionHistory, revertToVersion } from '../../services/resumeService'; // Adjust path

const initialResumeState = {
  name: '',
  title: '',
  summary: '',
  contact: { email: '', phone: '', linkedin: '', github: '', website: '' },
  experience: [], // { id, company, role, period, responsibilities: [] }
  education: [],  // { id, institution, degree, period, details: '' }
  skills: [], // { id, name, level: '' (optional) }
  // projects: [], // { id, name, description, technologies: [], link: '' }
  // awards: [], // { id, name, date, by: ''}
  lastUpdated: null,
};

let expIdCounter = 0;
let eduIdCounter = 0;
let skillIdCounter = 0;

const ResumeEditPage = () => {
  const [resume, setResume] = useState(initialResumeState);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchResume = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getResumeData();
      if (response.success && response.data.resume) {
        // Initialize IDs for dynamic sections if not present from backend
        const resumeData = response.data.resume;
        const initializedResume = {
          ...initialResumeState, // Ensure all fields are present
          name: resumeData.name || '',
          title: resumeData.title || '',
          summary: resumeData.summary || '',
          contact: {
            email: resumeData.contact?.email || '',
            phone: resumeData.contact?.phone || '',
            linkedin: resumeData.contact?.linkedin || '',
            github: resumeData.contact?.github || '',
            website: resumeData.contact?.website || '',
          },
          experience: resumeData.experience?.map(exp => ({
            id: exp.id || `exp-${expIdCounter++}`,
            company: exp.company || '',
            role: exp.role || '',
            period: exp.period || '',
            responsibilities: exp.responsibilities || ['']
          })) || [],
          education: resumeData.education?.map(edu => ({
            id: edu.id || `edu-${eduIdCounter++}`,
            institution: edu.institution || '',
            degree: edu.degree || '',
            period: edu.period || '',
            details: edu.details || ''
          })) || [],
          skills: resumeData.skills?.map(skill => (
            typeof skill === 'string'
              ? {id: `skill-${skillIdCounter++}`, name: skill || ''}
              : { id: skill.id || `skill-${skillIdCounter++}`, name: skill.name || '' }
          )) || [],
          lastUpdated: resumeData.lastUpdated || null,
        };
        setResume(initializedResume);
      } else {
        setError(response.error || 'Failed to load resume data.');
        setResume(initialResumeState); // Fallback to initial state on error
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching resume data.');
      console.error('Fetch resume error:', err);
      setResume(initialResumeState);
    }
    setLoading(false);
  }, []);

  const fetchVersions = useCallback(async () => {
    // Fetch versions if needed, not critical for editing form itself
    // const versionsResponse = await getResumeVersionHistory();
    // if (versionsResponse.success) setVersions(versionsResponse.data.versions || []);
  }, []);

  useEffect(() => {
    fetchResume();
    fetchVersions();
  }, [fetchResume, fetchVersions]);

  const handleChange = (e, section, index, field, subField) => {
    const { value } = e.target;
    setResume(prev => {
      const newResume = { ...prev };
      if (section) {
        if (index !== undefined) { // Array item
          if (subField) { // E.g. contact.email
            newResume[section][index][field][subField] = value;
          } else if (field === 'responsibilities') { // Special case for experience responsibilities (array of strings)
            const responsibilities = [...newResume[section][index][field]];
            responsibilities[subField] = value; // Here subField is the index of responsibility
            newResume[section][index][field] = responsibilities;
          } else {
            newResume[section][index][field] = value;
          }
        } else { // Object like contact
          newResume[section][field] = value;
        }
      } else { // Top-level field
        newResume[field] = value;
      }
      return newResume;
    });
  };

  // Specific handler for top-level fields like name, title, summary
  const handleTopLevelChange = (e) => {
    const { name, value } = e.target;
    setResume(prev => ({ ...prev, [name]: value }));
  };

  // Specific handler for contact object fields
  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setResume(prev => ({ ...prev, contact: { ...prev.contact, [name]: value } }));
  };

  // Handlers for dynamic sections (experience, education, skills)
  const addSectionItem = (section) => {
    setResume(prev => {
      const newItem = section === 'experience' ? { id: `exp-${expIdCounter++}`, company: '', role: '', period: '', responsibilities: [''] }
                    : section === 'education' ? { id: `edu-${eduIdCounter++}`, institution: '', degree: '', period: '', details: '' }
                    : { id: `skill-${skillIdCounter++}`, name: '' }; // Skills are simpler, just a name
      return { ...prev, [section]: [...prev[section], newItem] };
    });
  };

  const removeSectionItem = (section, idToRemove) => {
    setResume(prev => ({ ...prev, [section]: prev[section].filter(item => item.id !== idToRemove) }));
  };

  const handleSectionItemChange = (e, section, id, field) => {
    const { value } = e.target;
    setResume(prev => ({
      ...prev,
      [section]: prev[section].map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleResponsibilityChange = (e, expId, respIndex) => {
    const { value } = e.target;
    setResume(prev => ({
        ...prev,
        experience: prev.experience.map(exp => {
            if (exp.id === expId) {
                const newResponsibilities = [...exp.responsibilities];
                newResponsibilities[respIndex] = value;
                return { ...exp, responsibilities: newResponsibilities };
            }
            return exp;
        })
    }));
  };

  const addResponsibility = (expId) => {
    setResume(prev => ({
        ...prev,
        experience: prev.experience.map(exp =>
            exp.id === expId ? { ...exp, responsibilities: [...exp.responsibilities, ''] } : exp
        )
    }));
  };

  const removeResponsibility = (expId, respIndex) => {
    setResume(prev => ({
        ...prev,
        experience: prev.experience.map(exp => {
            if (exp.id === expId) {
                return { ...exp, responsibilities: exp.responsibilities.filter((_, i) => i !== respIndex) };
            }
            return exp;
        })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Prepare data for API: remove temporary IDs if backend generates its own
      const apiResumeData = {
        ...resume,
        experience: resume.experience.map(({ id, ...rest }) => rest),
        education: resume.education.map(({ id, ...rest }) => rest),
        // Skills might be just an array of strings or objects, adapt as per backend
        skills: resume.skills.map(skill => skill.name), // Assuming backend expects array of skill names
      };
      const response = await updateResumeData(apiResumeData);
      if (response.success && response.data.resume) {
        alert('Resume updated successfully!');
        // Optionally refetch or update state with response.data.resume if it contains new IDs/timestamps
        fetchResume(); // Refetch to get any backend-generated IDs/timestamps
      } else {
        setError(response.error || 'Failed to update resume.');
      }
    } catch (err) {
      setError('An unexpected error occurred while saving the resume.');
      console.error('Save resume error:', err);
    }
    setSaving(false);
  };

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";
  const buttonClass = "px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
  const subSectionClass = "p-4 border border-gray-200 rounded-md space-y-3 mb-3";

  if (loading) {
    return <div className="p-4 text-center">Loading resume editor...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Edit Resume</h1>
        <button onClick={() => navigate('/resume')} className={`${buttonClass} bg-gray-200 text-gray-700 hover:bg-gray-300`}>View Resume</button>
      </div>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-lg p-6 space-y-6">
        {/* Basic Info */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="name" className={labelClass}>Full Name</label><input type="text" name="name" id="name" value={resume.name} onChange={handleTopLevelChange} className={inputClass} /></div>
            <div><label htmlFor="title" className={labelClass}>Professional Title</label><input type="text" name="title" id="title" value={resume.title} onChange={handleTopLevelChange} className={inputClass} /></div>
          </div>
          <div><label htmlFor="summary" className={labelClass}>Summary</label><textarea name="summary" id="summary" value={resume.summary} onChange={handleTopLevelChange} rows="4" className={inputClass}></textarea></div>
        </section>

        {/* Contact Info */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label htmlFor="email" className={labelClass}>Email</label><input type="email" name="email" id="email" value={resume.contact.email} onChange={handleContactChange} className={inputClass} /></div>
            <div><label htmlFor="phone" className={labelClass}>Phone</label><input type="tel" name="phone" id="phone" value={resume.contact.phone} onChange={handleContactChange} className={inputClass} /></div>
            <div><label htmlFor="linkedin" className={labelClass}>LinkedIn Profile URL</label><input type="url" name="linkedin" id="linkedin" value={resume.contact.linkedin} onChange={handleContactChange} className={inputClass} /></div>
            <div><label htmlFor="github" className={labelClass}>GitHub Profile URL</label><input type="url" name="github" id="github" value={resume.contact.github} onChange={handleContactChange} className={inputClass} /></div>
            <div><label htmlFor="website" className={labelClass}>Personal Website/Portfolio</label><input type="url" name="website" id="website" value={resume.contact.website} onChange={handleContactChange} className={inputClass} /></div>
          </div>
        </section>

        {/* Experience */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-700">Work Experience</h2>
            <button type="button" onClick={() => addSectionItem('experience')} className={`${buttonClass} bg-green-500 text-white hover:bg-green-600`}>+ Add Experience</button>
          </div>
          {resume.experience?.map((exp, index) => (
            <div key={exp.id} className={subSectionClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor={`exp-company-${exp.id}`} className={labelClass}>Company</label><input type="text" id={`exp-company-${exp.id}`} value={exp.company} onChange={(e) => handleSectionItemChange(e, 'experience', exp.id, 'company')} className={inputClass} /></div>
                <div><label htmlFor={`exp-role-${exp.id}`} className={labelClass}>Role/Title</label><input type="text" id={`exp-role-${exp.id}`} value={exp.role} onChange={(e) => handleSectionItemChange(e, 'experience', exp.id, 'role')} className={inputClass} /></div>
                <div><label htmlFor={`exp-period-${exp.id}`} className={labelClass}>Period (e.g., Jan 2020 - Present)</label><input type="text" id={`exp-period-${exp.id}`} value={exp.period} onChange={(e) => handleSectionItemChange(e, 'experience', exp.id, 'period')} className={inputClass} /></div>
              </div>
              <div>
                <label className={labelClass}>Responsibilities/Achievements</label>
                {exp.responsibilities?.map((resp, rIndex) => (
                    <div key={rIndex} className="flex items-center mt-1">
                        <input type="text" value={resp} onChange={(e) => handleResponsibilityChange(e, exp.id, rIndex)} className={`${inputClass} flex-grow`} placeholder={`Responsibility ${rIndex + 1}`} />
                        <button type="button" onClick={() => removeResponsibility(exp.id, rIndex)} className="ml-2 text-red-500 hover:text-red-700 text-sm">Remove</button>
                    </div>
                ))}
                <button type="button" onClick={() => addResponsibility(exp.id)} className="mt-2 text-sm text-blue-500 hover:text-blue-700">+ Add Responsibility</button>
              </div>
              <button type="button" onClick={() => removeSectionItem('experience', exp.id)} className={`${buttonClass} bg-red-500 text-white hover:bg-red-600 w-full mt-2`}>Remove This Experience</button>
            </div>
          ))}
        </section>

        {/* Education */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-700">Education</h2>
            <button type="button" onClick={() => addSectionItem('education')} className={`${buttonClass} bg-green-500 text-white hover:bg-green-600`}>+ Add Education</button>
          </div>
          {resume.education?.map((edu, index) => (
            <div key={edu.id} className={subSectionClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor={`edu-institution-${edu.id}`} className={labelClass}>Institution</label><input type="text" id={`edu-institution-${edu.id}`} value={edu.institution} onChange={(e) => handleSectionItemChange(e, 'education', edu.id, 'institution')} className={inputClass} /></div>
                <div><label htmlFor={`edu-degree-${edu.id}`} className={labelClass}>Degree/Certificate</label><input type="text" id={`edu-degree-${edu.id}`} value={edu.degree} onChange={(e) => handleSectionItemChange(e, 'education', edu.id, 'degree')} className={inputClass} /></div>
                <div><label htmlFor={`edu-period-${edu.id}`} className={labelClass}>Period (e.g., Aug 2016 - May 2020)</label><input type="text" id={`edu-period-${edu.id}`} value={edu.period} onChange={(e) => handleSectionItemChange(e, 'education', edu.id, 'period')} className={inputClass} /></div>
              </div>
              <div><label htmlFor={`edu-details-${edu.id}`} className={labelClass}>Additional Details (Optional)</label><textarea id={`edu-details-${edu.id}`} value={edu.details} onChange={(e) => handleSectionItemChange(e, 'education', edu.id, 'details')} rows="2" className={inputClass}></textarea></div>
              <button type="button" onClick={() => removeSectionItem('education', edu.id)} className={`${buttonClass} bg-red-500 text-white hover:bg-red-600 w-full mt-2`}>Remove This Education</button>
            </div>
          ))}
        </section>

        {/* Skills */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-700">Skills</h2>
            <button type="button" onClick={() => addSectionItem('skills')} className={`${buttonClass} bg-green-500 text-white hover:bg-green-600`}>+ Add Skill</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resume.skills?.map((skill, index) => (
              <div key={skill.id} className="flex items-center">
                <input type="text" value={skill.name} onChange={(e) => handleSectionItemChange(e, 'skills', skill.id, 'name')} className={`${inputClass} flex-grow`} placeholder="Skill (e.g., React)" />
                <button type="button" onClick={() => removeSectionItem('skills', skill.id)} className="ml-2 text-red-500 hover:text-red-700 text-sm">Remove</button>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-6 border-t border-gray-200 flex justify-end">
          <button type="submit" disabled={saving} className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 min-w-[120px]`}>
            {saving ? 'Saving...' : 'Save Resume'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeEditPage;
