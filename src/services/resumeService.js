// /src/services/resumeService.js

import { get, post, put, del } from './apiService';

/**
 * Fetch resume data from the API
 * @param {string} resumeId - Optional resume ID (defaults to first resume if not provided)
 * @returns {Promise<object>} - { success: boolean, data: { resume } | error: string }
 */
export const getResumeData = async (resumeId) => {
  console.log("[ResumeService] Fetching resume data");

  try {
    // If resumeId is provided, fetch that specific resume
    if (resumeId) {
      const response = await get(`resume/${resumeId}`);
      if (response.success) {
        return {
          success: true,
          data: { resume: response.data }
        };
      }
      return response;
    }

    // Otherwise, fetch all resumes and use the first one
    const response = await get('resume');
    if (response.success && Array.isArray(response.data) && response.data.length > 0) {
      return {
        success: true,
        data: { resume: response.data[0] }
      };
    } else if (response.success) {
      return {
        success: false,
        error: 'No resume data found'
      };
    }
    return response;
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
    // If resumeId is provided, update that specific resume
    if (resumeId) {
      const response = await put(`resume/${resumeId}`, resumeData);
      if (response.success) {
        return {
          success: true,
          data: { resume: response.data }
        };
      }
      return response;
    }

    // Otherwise, get the first resume ID and update it
    const getResponse = await get('resume');
    if (getResponse.success && Array.isArray(getResponse.data) && getResponse.data.length > 0) {
      const firstResumeId = getResponse.data[0].id;
      const updateResponse = await put(`resume/${firstResumeId}`, resumeData);

      if (updateResponse.success) {
        return {
          success: true,
          data: { resume: updateResponse.data }
        };
      }
      return updateResponse;
    }

    // If no resume exists, create a new one
    const createResponse = await post('resume', {
      ...resumeData,
      userId: 'user1', // Default to user1 for testing
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
