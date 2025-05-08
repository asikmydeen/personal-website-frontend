import React, { useState, useRef, useEffect } from "react";
import { uploadVoiceMemo } from "../../services/voiceMemoService";

const VoiceMemoRecordComponent = ({ onClose, onMemoRecorded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup timer on unmount
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      // Stop media recorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError("");
    setAudioURL("");
    setAudioBlob(null);
    setTitle("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" }); // or audio/wav, audio/ogg etc.
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please check permissions.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) {
      setError("No recording available to upload.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const memoTitle = title || `Voice Memo ${new Date().toLocaleString()}`;
      const response = await uploadVoiceMemo(audioBlob, { title: memoTitle });
      if (response.success && response.data.memo) {
        onMemoRecorded(response.data.memo);
      } else {
        setError(response.error || "Failed to upload voice memo.");
      }
    } catch (err) {
      setError("An unexpected error occurred during upload.");
      console.error("Upload error:", err);
    }
    setUploading(false);
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center p-4 z-[60]">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">Record Voice Memo</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl">&times;</button>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-100 p-3 rounded-md">{error}</p>}

        <div className="text-center">
          {!isRecording && !audioURL && (
            <button
              onClick={startRecording}
              className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg transition-transform hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          {isRecording && (
            <button
              onClick={stopRecording}
              className="w-20 h-20 bg-gray-700 hover:bg-gray-800 text-white rounded-full flex items-center justify-center mx-auto shadow-lg transition-transform hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {isRecording && (
          <p className="text-center text-2xl font-mono text-gray-700">{formatTime(timer)}</p>
        )}

        {audioURL && !isRecording && (
          <div className="space-y-3">
            <audio src={audioURL} controls className="w-full" />
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title (Optional)</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={`Voice Memo ${new Date().toLocaleDateString()}`}
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Recording"}
            </button>
            <button
              onClick={startRecording} // Allow re-recording
              className="w-full px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Record Again
            </button>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceMemoRecordComponent;
