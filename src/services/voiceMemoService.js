// /src/services/voiceMemoService.js

const API_BASE_URL = "/api/v1"; // Or process.env.REACT_APP_API_URL

/**
 * Placeholder for listing voice memos
 * @param {object} filters (optional, e.g., category, tags, date)
 * @returns {Promise<object>} - { success: boolean, data: { memos: [] } | error: string }
 */
export const listVoiceMemos = async (filters) => {
  console.log("[VoiceMemoService] Listing voice memos with filters:", filters);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    success: true,
    data: {
      memos: [
        { id: "memo1", title: "Meeting Idea", duration: "2:30", createdAt: "2023-04-20", tags: ["work", "idea"] },
        { id: "memo2", title: "Grocery Reminder", duration: "0:45", createdAt: "2023-04-22", tags: ["personal"] },
      ]
    }
  };
};

/**
 * Placeholder for uploading/creating a new voice memo
 * @param {Blob} audioBlob - The recorded audio data
 * @param {object} metadata - { title (optional), tags (optional), category (optional) }
 * @returns {Promise<object>} - { success: boolean, data: { memo: {} } | error: string }
 */
export const uploadVoiceMemo = async (audioBlob, metadata) => {
  console.log("[VoiceMemoService] Uploading voice memo:", metadata?.title || "Untitled", "Metadata:", metadata);
  // In a real app, this would involve FormData and sending the blob to the server
  // The server would then likely use AWS Transcribe.
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { 
    success: true, 
    data: { 
      memo: { 
        id: "newMemoXYZ", 
        title: metadata?.title || "Untitled Memo", 
        duration: "1:15", // Simulated duration
        createdAt: new Date().toISOString(), 
        tags: metadata?.tags || [],
        transcriptionStatus: "processing" // Transcription might be asynchronous
      }
    }
  };
};

/**
 * Placeholder for getting voice memo details, including transcription if available
 * @param {string} memoId
 * @returns {Promise<object>} - { success: boolean, data: { memo: {} } | error: string }
 */
export const getVoiceMemoDetails = async (memoId) => {
  console.log("[VoiceMemoService] Getting details for voice memo:", memoId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Simulate fetching memo, transcription might be ready or still processing
  const transcription = Math.random() > 0.5 ? "This is a sample transcription of the voice memo." : null;
  const status = transcription ? "completed" : "processing";
  return {
    success: true,
    data: {
      memo: {
        id: memoId,
        title: "Meeting Idea",
        duration: "2:30",
        createdAt: "2023-04-20",
        tags: ["work", "idea"],
        audioUrl: `${API_BASE_URL}/voice-memos/${memoId}/audio`,
        transcription: transcription,
        transcriptionStatus: status
      }
    }
  };
};

/**
 * Placeholder for deleting a voice memo
 * @param {string} memoId
 * @returns {Promise<object>} - { success: boolean | error: string }
 */
export const deleteVoiceMemo = async (memoId) => {
  console.log("[VoiceMemoService] Deleting voice memo:", memoId);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

/**
 * Placeholder for updating voice memo metadata (e.g., title, tags)
 * @param {string} memoId
 * @param {object} updateData - { title (optional), tags (optional) }
 * @returns {Promise<object>} - { success: boolean, data: { memo: {} } | error: string }
 */
export const updateVoiceMemoMetadata = async (memoId, updateData) => {
  console.log("[VoiceMemoService] Updating metadata for memo:", memoId, "Data:", updateData);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { 
    success: true, 
    data: { 
      memo: { 
        id: memoId, 
        title: updateData.title || "Existing Title", 
        tags: updateData.tags || [], 
        // other fields remain unchanged or are fetched from backend
      }
    }
  };
};

