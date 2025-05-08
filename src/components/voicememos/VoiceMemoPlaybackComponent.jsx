import React, { useState, useEffect, useRef } from "react";
import { getVoiceMemoDetails } from "../../services/voiceMemoService";

const VoiceMemoPlaybackComponent = ({ memo, onClose }) => {
  const [memoDetails, setMemoDetails] = useState(memo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    // If only partial memo data is passed, fetch full details including transcription
    if (memo && memo.id && !memo.transcription) { // Assuming transcription indicates full details
      setLoading(true);
      setError("");
      getVoiceMemoDetails(memo.id)
        .then(response => {
          if (response.success && response.data.voiceMemo) {
            setMemoDetails(response.data.voiceMemo);
          } else {
            setError(response.error || "Failed to load memo details.");
          }
        })
        .catch(err => {
          setError("An unexpected error occurred.");
          console.error("Fetch memo details error:", err);
        })
        .finally(() => setLoading(false));
    } else {
      setMemoDetails(memo);
    }
  }, [memo]);

  useEffect(() => {
    // Autoplay when modal opens and audio source is ready
    if (audioRef.current && memoDetails?.url) {
        // audioRef.current.play().catch(e => console.warn("Audio autoplay prevented:", e));
    }
  }, [memoDetails?.url]);

  if (!memoDetails) return null; // Or a loading/error state if memo is expected

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center p-4 z-[70]">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800 truncate" title={memoDetails.title || "Voice Memo Playback"}>
            {memoDetails.title || "Voice Memo Playback"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
        </div>

        {loading && <p className="text-center text-gray-600">Loading details...</p>}
        {error && <p className="text-red-600 text-sm bg-red-100 p-3 rounded-md">{error}</p>}

        {!loading && memoDetails.url && (
          <audio ref={audioRef} src={memoDetails.url} controls className="w-full mt-2" />
        )}

        {memoDetails.transcription && (
          <div className="mt-4">
            <h4 className="text-md font-semibold text-gray-700 mb-1">Transcription:</h4>
            <div className="p-3 bg-gray-50 rounded-md max-h-60 overflow-y-auto text-sm text-gray-600 whitespace-pre-wrap">
              {memoDetails.transcription}
            </div>
          </div>
        )}
        {!loading && !memoDetails.transcription && memoDetails.id && (
            <p className="text-sm text-gray-500 italic mt-2">No transcription available for this memo.</p>
        )}

        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceMemoPlaybackComponent;
