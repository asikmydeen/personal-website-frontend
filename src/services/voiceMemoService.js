// src/services/voiceMemoService.js

// Change to absolute URL to ensure we're hitting the json-server directly
const API_BASE_URL = "http://localhost:3001/api/v1"; // Using the correct json-server port

/**
 * Get a list of voice memos
 * @param {object} filters (optional, e.g., category, tags, date)
 * @returns {Promise<object>} - { success: boolean, data: { memos: [] } | error: string }
 */
export const listVoiceMemos = async (filters) => {
  console.log("[VoiceMemoService] Listing voice memos with filters:", filters);

  try {
    // We're using the route defined in routes.json that maps to /voiceMemos
    const response = await fetch(`${API_BASE_URL}/voice-memos`);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const memos = await response.json();
    return {
      success: true,
      data: {
        memos: memos
      }
    };
  } catch (error) {
    console.error("Error fetching voice memos:", error);
    return {
      success: false,
      error: `Failed to fetch voice memos: ${error.message}`
    };
  }
};

/**
 * Upload/create a new voice memo
 * @param {Blob} audioBlob - The recorded audio data
 * @param {object} metadata - { title (optional), tags (optional), category (optional) }
 * @returns {Promise<object>} - { success: boolean, data: { memo: {} } | error: string }
 */
export const uploadVoiceMemo = async (audioBlob, metadata) => {
  console.log("[VoiceMemoService] Uploading voice memo:", metadata?.title || "Untitled", "Metadata:", metadata);

  try {
    // In a real app with file uploads, we'd use FormData to send the audio blob
    // For this mock version, we'll create a data URL to simulate storage

    // Creating a data URL from the blob (this would normally be stored on a server)
    const reader = new FileReader();
    const audioUrlPromise = new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(audioBlob);
    });
    const audioUrl = await audioUrlPromise;

    // Calculate duration (approximate) based on blob size
    // This is just an estimation for demo purposes
    const durationSeconds = Math.round(audioBlob.size / 15000); // Rough estimate

    // Create the new memo object
    const newMemo = {
      userId: "user1", // Would normally get from auth context
      title: metadata?.title || `Voice Memo ${new Date().toLocaleString()}`,
      description: metadata?.description || "",
      fileUrl: audioUrl.substring(0, 100) + "...", // Store just part of the URL in JSON for demo
      duration: durationSeconds,
      tags: metadata?.tags || [],
      createdAt: new Date().toISOString(),
      transcription: null,
      transcriptionStatus: "pending"
    };

    const response = await fetch(`${API_BASE_URL}/voice-memos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newMemo)
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const savedMemo = await response.json();

    // Simulate starting transcription (would be done server-side)
    // We'll update the memo after a short delay to simulate transcription completing
    setTimeout(() => {
      updateTranscription(savedMemo.id);
    }, 3000);

    return {
      success: true,
      data: {
        memo: savedMemo
      }
    };
  } catch (error) {
    console.error("Error uploading voice memo:", error);
    return {
      success: false,
      error: `Failed to upload voice memo: ${error.message}`
    };
  }
};

/**
 * Helper function to simulate transcription being completed
 * @param {string} memoId
 */
const updateTranscription = async (memoId) => {
  try {
    // First get the current memo
    const getResponse = await fetch(`${API_BASE_URL}/voice-memos/${memoId}`);
    if (!getResponse.ok) return;

    const memo = await getResponse.json();

    // Update with a transcription
    const updatedMemo = {
      ...memo,
      transcription: "This is an automatically generated transcription of the voice memo content.",
      transcriptionStatus: "completed"
    };

    await fetch(`${API_BASE_URL}/voice-memos/${memoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedMemo)
    });

    console.log("[VoiceMemoService] Transcription completed for:", memoId);
  } catch (error) {
    console.error("Error updating transcription:", error);
  }
};

/**
 * Get voice memo details, including transcription if available
 * @param {string} memoId
 * @returns {Promise<object>} - { success: boolean, data: { voiceMemo: {} } | error: string }
 */
export const getVoiceMemoDetails = async (memoId) => {
  console.log("[VoiceMemoService] Getting details for voice memo:", memoId);

  try {
    const response = await fetch(`${API_BASE_URL}/voice-memos/${memoId}`);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const voiceMemo = await response.json();
    return {
      success: true,
      data: {
        voiceMemo
      }
    };
  } catch (error) {
    console.error("Error fetching voice memo details:", error);
    return {
      success: false,
      error: `Failed to fetch voice memo details: ${error.message}`
    };
  }
};

/**
 * Delete a voice memo
 * @param {string} memoId
 * @returns {Promise<object>} - { success: boolean | error: string }
 */
export const deleteVoiceMemo = async (memoId) => {
  console.log("[VoiceMemoService] Deleting voice memo:", memoId);

  try {
    const response = await fetch(`${API_BASE_URL}/voice-memos/${memoId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting voice memo:", error);
    return {
      success: false,
      error: `Failed to delete voice memo: ${error.message}`
    };
  }
};

/**
 * Update voice memo metadata (e.g., title, tags)
 * @param {string} memoId
 * @param {object} updateData - { title (optional), tags (optional) }
 * @returns {Promise<object>} - { success: boolean, data: { memo: {} } | error: string }
 */
export const updateVoiceMemoMetadata = async (memoId, updateData) => {
  console.log("[VoiceMemoService] Updating metadata for memo:", memoId, "Data:", updateData);

  try {
    // First get the current memo
    const getResponse = await fetch(`${API_BASE_URL}/voice-memos/${memoId}`);

    if (!getResponse.ok) {
      throw new Error(`HTTP error ${getResponse.status}`);
    }

    const currentMemo = await getResponse.json();

    // Update only the fields specified in updateData
    const updatedMemo = {
      ...currentMemo,
      ...(updateData.title && { title: updateData.title }),
      ...(updateData.tags && { tags: updateData.tags }),
      updatedAt: new Date().toISOString()
    };

    const response = await fetch(`${API_BASE_URL}/voice-memos/${memoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedMemo)
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const savedMemo = await response.json();
    return {
      success: true,
      data: {
        memo: savedMemo
      }
    };
  } catch (error) {
    console.error("Error updating voice memo metadata:", error);
    return {
      success: false,
      error: `Failed to update voice memo metadata: ${error.message}`
    };
  }
};
