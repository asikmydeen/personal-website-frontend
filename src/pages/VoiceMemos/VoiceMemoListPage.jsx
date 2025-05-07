import React, { useState, useEffect, useCallback } from 'react';
import { listVoiceMemos, deleteVoiceMemo } from '../../services/voiceMemoService'; // Adjust path
import VoiceMemoRecordComponent from '../../components/voicememos/VoiceMemoRecordComponent'; // Adjust path
import VoiceMemoPlaybackComponent from '../../components/voicememos/VoiceMemoPlaybackComponent'; // Adjust path

const formatDuration = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const VoiceMemoListPage = () => {
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedMemoForPlayback, setSelectedMemoForPlayback] = useState(null);

  const fetchMemos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listVoiceMemos();
      if (response.success && response.data.voiceMemos) {
        setMemos(response.data.voiceMemos);
      } else {
        setError(response.error || 'Failed to load voice memos.');
        setMemos([]);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching voice memos.');
      console.error('Fetch voice memos error:', err);
      setMemos([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  const handleRecordingComplete = (newMemo) => {
    setShowRecordModal(false);
    fetchMemos(); // Refresh list
  };

  const handleDeleteMemo = async (memoId, memoTitle) => {
    if (window.confirm(`Are you sure you want to delete the voice memo "${memoTitle || 'this memo'}"?`)) {
      setLoading(true);
      try {
        const response = await deleteVoiceMemo(memoId);
        if (response.success) {
          fetchMemos(); // Refresh the list
        } else {
          setError(response.error || 'Failed to delete voice memo.');
        }
      } catch (err) {
        setError('An unexpected error occurred during deletion.');
        console.error('Delete voice memo error:', err);
      }
      setLoading(false);
    }
  };

  if (loading && memos.length === 0) {
    return <div className="p-4 text-center">Loading voice memos...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Voice Memos</h1>
        <button 
          onClick={() => setShowRecordModal(true)}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
          Record New Memo
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">Error: {error}</div>}

      {showRecordModal && (
        <VoiceMemoRecordComponent 
          onClose={() => setShowRecordModal(false)}
          onRecordingComplete={handleRecordingComplete}
        />
      )}

      {selectedMemoForPlayback && (
        <VoiceMemoPlaybackComponent 
            memo={selectedMemoForPlayback} 
            onClose={() => setSelectedMemoForPlayback(null)} 
        />
      )}

      {memos.length > 0 ? (
        <div className="space-y-4">
          {memos.map(memo => (
            <div key={memo.id} className="bg-white shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow flex justify-between items-center">
              <div>
                <h2 
                    className="text-lg font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer truncate"
                    title={memo.title || 'Untitled Memo'}
                    onClick={() => setSelectedMemoForPlayback(memo)}
                >
                    {memo.title || 'Untitled Memo'}
                </h2>
                <p className="text-sm text-gray-500">
                  Recorded: {new Date(memo.createdAt).toLocaleDateString()} - Duration: {formatDuration(memo.durationSeconds)}
                </p>
                {memo.transcription && <p className="text-xs text-gray-600 mt-1 italic truncate" title={memo.transcription}>Transcription: {memo.transcription}</p>}
              </div>
              <div className="flex-shrink-0 ml-4 space-x-2">
                <button 
                    onClick={() => setSelectedMemoForPlayback(memo)} 
                    className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded"
                >
                    Play
                </button>
                <button 
                    onClick={() => handleDeleteMemo(memo.id, memo.title)} 
                    className="text-sm bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded"
                >
                    Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && <p className="text-center text-gray-500 py-10 text-lg">No voice memos recorded yet. Click 'Record New Memo' to start!</p>
      )}
    </div>
  );
};

export default VoiceMemoListPage;

