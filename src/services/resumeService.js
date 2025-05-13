// /src/services/resumeService.js

import { get, post, put, del } from './apiService';

/**
 * Fetch all resumes
 * @returns {Promise<object>} - { success: boolean, data: Array<resume> | error: string }
 */
export const getAllResumes = async () => {
  console.log("[ResumeService] Fetching all resumes");
  try {
    const response = await get('resume');

    if (response.success && Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data
      };
    } else if (response.success) {
      // Return empty array if the response is successful but not an array
      return {
        success: true,
        data: []
      };
    }
    return response;
  } catch (error) {
    console.error("Error fetching all resumes:", error);
    return {
      success: false,
      error: error.message || 'Failed to fetch all resumes'
    };
  }
};

/**
 * Create a new resume
 * @param {object} resumeData - Resume data to create
 * @returns {Promise<object>} - { success: boolean, data: resume | error: string }
 */
export const createNewResume = async (resumeData = {}) => {
  console.log("[ResumeService] Creating new resume");
  try {
    const newResume = {
      name: resumeData.name || "Your Name",
      title: resumeData.title || "Your Professional Title",
      summary: resumeData.summary || "",
      contact: resumeData.contact || {
        email: "",
        phone: "",
        linkedin: "",
        github: "",
        website: ""
      },
      experience: resumeData.experience || [],
      education: resumeData.education || [],
      skills: resumeData.skills || [],
      theme: resumeData.theme || "modern",
      userId: "user1", // Default user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const response = await post('resume', newResume);
    return response;
  } catch (error) {
    console.error("Error creating new resume:", error);
    return {
      success: false,
      error: error.message || 'Failed to create new resume'
    };
  }
};

/**
 * Fetch resume data from the API
 * @param {string} resumeId - Optional resume ID (defaults to first resume if not provided)
 * @returns {Promise<object>} - { success: boolean, data: { resume } | error: string }
 */
export const getResumeData = async (resumeId) => {
  console.log("[ResumeService] Fetching resume data");

  try {
    // Fetch from the direct endpoint without user expansion to avoid server errors
    // If resumeId is provided, fetch that specific resume
    if (resumeId) {
      try {
        const response = await get(`resume/${resumeId}`);
        if (response.success) {
          return {
            success: true,
            data: { resume: response.data }
          };
        }
        return response;
      } catch (err) {
        console.error(`Error fetching resume with ID ${resumeId}:`, err);
        // Fall through to try fetching all resumes as fallback
      }
    }

    // Otherwise, fetch all resumes and use the first one
    try {
      // Use the direct endpoint without _expand to avoid the server error
      const response = await get('resume');

      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        return {
          success: true,
          data: { resume: response.data[0] }
        };
      } else if (response.success) {
        // Create a default resume if none exists
        const newResume = {
          name: "Your Name",
          title: "Your Professional Title",
          summary: "",
          contact: {
            email: "",
            phone: "",
            linkedin: "",
            github: "",
            website: ""
          },
          experience: [],
          education: [],
          skills: [],
          theme: "modern",
          userId: "user1", // Default user
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save the default resume
        const createResponse = await post('resume', newResume);
        if (createResponse.success) {
          return {
            success: true,
            data: { resume: createResponse.data }
          };
        }

        return {
          success: false,
          error: 'Failed to create default resume'
        };
      }
      return response;
    } catch (err) {
      console.error("Error fetching all resumes:", err);
      throw err;
    }
  } catch (error) {
    console.error("Error fetching resume data:", error);
    return {
      success: false,
      error: error.message || 'Failed to fetch resume data'
    };
  }
};

/**
 * Update resume data via API
 * @param {object} resumeData - Resume data to update
 * @param {string} resumeId - Optional resume ID (if omitted, updates first resume)
 * @returns {Promise<object>} - { success: boolean, data: { resume } | error: string }
 */
export const updateResumeData = async (resumeData, resumeId) => {
  console.log("[ResumeService] Updating resume data:", resumeData);

  try {
    // Ensure theme is included in the data
    const dataToSave = {
      ...resumeData,
      theme: resumeData.theme || 'modern', // Default theme if not provided
      updatedAt: new Date().toISOString()
    };

    // If resumeId is provided, update that specific resume
    if (resumeId) {
      const response = await put(`resume/${resumeId}`, dataToSave);
      if (response.success) {
        return {
          success: true,
          data: { resume: response.data }
        };
      }
      return response;
    }

    // Otherwise, get the first resume ID and update it
    try {
      const getResponse = await get('resume');

      if (getResponse.success && Array.isArray(getResponse.data) && getResponse.data.length > 0) {
        const firstResumeId = getResponse.data[0].id;
        const updateResponse = await put(`resume/${firstResumeId}`, dataToSave);

        if (updateResponse.success) {
          return {
            success: true,
            data: { resume: updateResponse.data }
          };
        }
        return updateResponse;
      }
    } catch (error) {
      console.log("Error fetching existing resumes, will create a new one:", error);
      // Continue to create a new resume
    }

    // If no resume exists or couldn't fetch, create a new one
    const createResponse = await post('resume', {
      ...dataToSave,
      userId: 'user1', // Default to user1 for testing
      createdAt: new Date().toISOString()
    });

    if (createResponse.success) {
      return {
        success: true,
        data: { resume: createResponse.data }
      };
    }
    return createResponse;
  } catch (error) {
    console.error("Error updating resume data:", error);
    return {
      success: false,
      error: error.message || 'Failed to update resume data'
    };
  }
};

/**
 * Fetch resume version history
 * @param {string} resumeId - Optional resume ID
 * @returns {Promise<object>} - { success: boolean, data: { versions } | error: string }
 */
export const getResumeVersionHistory = async (resumeId) => {
  console.log("[ResumeService] Fetching resume version history");
  // Note: Currently, version history is not supported by the API
  // This is a placeholder that returns mock data
  // In a real implementation, this would call a specific API endpoint

  return {
    success: true,
    data: {
      versions: [
        { versionId: "v3", timestamp: "2023-05-01T10:00:00Z", summary: "Updated skills section" },
        { versionId: "v2", timestamp: "2023-04-15T14:30:00Z", summary: "Added new project experience" },
      ]
    }
  };
};

/**
 * Revert to a specific resume version
 * @param {string} versionId - Version ID to revert to
 * @param {string} resumeId - Optional resume ID
 * @returns {Promise<object>} - { success: boolean, data: { resume } | error: string }
 */
export const revertToVersion = async (versionId, resumeId) => {
  console.log("[ResumeService] Reverting to resume version:", versionId);
  // Note: Currently, version history is not supported by the API
  // This is a placeholder that returns current data

  return getResumeData(resumeId);
};

/**
 * Trigger PDF export of the resume
 * @param {string} resumeId - Optional resume ID
 * @returns {Promise<object>} - { success: boolean, data: { downloadUrl } | error: string }
 */
export const exportResumeToPdf = async (resumeId) => {
  console.log("[ResumeService] Requesting PDF export for resume");
  // Note: Currently, PDF export is not supported by the API
  // This is a placeholder that returns a mock download URL

  return {
    success: true,
    data: {
      downloadUrl: `/api/v1/resume/${resumeId || 'resume1'}/export/pdf?token=tempPdfToken`
    }
  };
};

/**
 * Delete a resume
 * @param {string} resumeId - ID of resume to delete
 * @returns {Promise<object>} - { success: boolean, data: {} | error: string }
 */
export const deleteResume = async (resumeId) => {
  console.log("[ResumeService] Deleting resume:", resumeId);

  try {
    const response = await del(`resume/${resumeId}`);
    return response;
  } catch (error) {
    console.error("Error deleting resume:", error);
    return {
      success: false,
      error: error.message || 'Failed to delete resume'
    };
  }
};
