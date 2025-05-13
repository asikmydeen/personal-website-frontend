import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllResumes, deleteResume, createNewResume } from '@core/services/resumeService';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Trash2, Edit, FileText, Plus, Copy, Eye, Download } from 'lucide-react';
import ThemeRadioSelector from '../../components/resume/ThemeRadioSelector';
import AnimatedModal from '../../components/animated/AnimatedModal';

const ResumeListPage = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newResumeData, setNewResumeData] = useState({
    name: '',
    title: '',
    theme: 'modern'
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const response = await getAllResumes();
      if (response.success) {
        setResumes(response.data || []);
      } else {
        setError(response.error || 'Failed to load resumes');
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching resumes.');
      console.error('Error fetching resumes:', err);
    }
    setLoading(false);
  };

  const handleCreateResume = async () => {
    setLoading(true);
    try {
      const response = await createNewResume({
        name: newResumeData.name || 'My Resume',
        title: newResumeData.title || 'Professional Title',
        theme: newResumeData.theme || 'modern'
      });

      if (response.success) {
        // Add the new resume to the list
        setResumes(prev => [...prev, response.data]);
        setIsCreateDialogOpen(false);
        setNewResumeData({ name: '', title: '', theme: 'modern' });

        // Optionally, redirect to the edit page for the new resume
        navigate(`/resume/edit/${response.data.id}`);
      } else {
        setError(response.error || 'Failed to create resume');
      }
    } catch (err) {
      setError('An unexpected error occurred while creating the resume.');
      console.error('Create resume error:', err);
    }
    setLoading(false);
  };

  const handleDeleteResume = async (resumeId) => {
    if (window.confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      setLoading(true);
      try {
        const response = await deleteResume(resumeId);
        if (response.success) {
          // Remove the deleted resume from the list
          setResumes(resumes.filter(resume => resume.id !== resumeId));
        } else {
          setError(response.error || 'Failed to delete resume');
        }
      } catch (err) {
        setError('An unexpected error occurred while deleting the resume.');
        console.error('Delete resume error:', err);
      }
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Resumes</h1>
          <p className="text-gray-600 mt-1">Create, manage, and export your resumes</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus size={16} />
          Create New Resume
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading && resumes.length === 0 ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">You don't have any resumes yet.</p>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create Your First Resume
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map(resume => (
            <Card key={resume.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex justify-between items-start">
                  <span className="truncate">{resume.name || "Untitled Resume"}</span>
                </CardTitle>
                <CardDescription>{resume.title || "No Title"}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm text-gray-500">
                  <div>Last Updated: {formatDate(resume.updatedAt || resume.createdAt)}</div>
                  <div>Theme: {resume.theme || "Default"}</div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => navigate(`/resume/${resume.id}`)}
                  >
                    <Eye size={16} className="mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-800"
                    onClick={() => navigate(`/resume/edit/${resume.id}`)}
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-800"
                    onClick={() => {
                      // This would be a real copy function in a production app
                      const newResumeName = `${resume.name || 'Resume'} (Copy)`;
                      setNewResumeData({
                        ...resume,
                        name: newResumeName,
                        id: undefined
                      });
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    <Copy size={16} className="mr-1" />
                    Duplicate
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-800"
                  onClick={() => handleDeleteResume(resume.id)}
                >
                  <Trash2 size={16} className="mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AnimatedModal
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        animationType="zoom"
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Create New Resume</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume-name">Resume Name</Label>
              <Input
                id="resume-name"
                placeholder="e.g., My Professional Resume"
                value={newResumeData.name}
                onChange={(e) => setNewResumeData({ ...newResumeData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume-title">Professional Title</Label>
              <Input
                id="resume-title"
                placeholder="e.g., Software Engineer"
                value={newResumeData.title}
                onChange={(e) => setNewResumeData({ ...newResumeData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Select Theme</Label>
              <ThemeRadioSelector
                selectedTheme={newResumeData.theme}
                onChange={(theme) => setNewResumeData({ ...newResumeData, theme })}
              />
            </div>
            <div className="pt-4 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleCreateResume}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Resume'}
              </Button>
            </div>
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
};

export default ResumeListPage;
