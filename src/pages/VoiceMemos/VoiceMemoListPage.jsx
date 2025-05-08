import React, { useState, useEffect, useRef } from 'react';
import useStore from '../../store/useStore';
import {
  Mic, Play, Pause, Trash2, Download, Edit, MoreHorizontal,
  AudioWaveform, Search, Plus, Tag, StopCircle, Clock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Slider } from '../../components/ui/slider';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import {
  deleteVoiceMemo, listVoiceMemos, getVoiceMemoDetails,
  uploadVoiceMemo, updateVoiceMemoMetadata
} from '../../services/voiceMemoService';
import VoiceMemoRecordComponent from '../../components/voicememos/VoiceMemoRecordComponent';
import VoiceMemoPlaybackComponent from '../../components/voicememos/VoiceMemoPlaybackComponent';

const VoiceMemoListPage = () => {
  const { voiceMemos, fetchVoiceMemos, setVoiceMemos } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [memoDetails, setMemoDetails] = useState(null);
  const [isPlaying, setIsPlaying] = useState({});
  const [playbackProgress, setPlaybackProgress] = useState({});
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    tags: ''
  });

  // Refs for audio elements
  const audioRefs = useRef({});

  // Extract all unique tags from memos for filter
  const allTags = [...new Set(voiceMemos.flatMap(memo => memo.tags || []))];

  useEffect(() => {
    const loadVoiceMemos = async () => {
      setLoading(true);
      try {
        await fetchVoiceMemos();
      } catch (err) {
        setError('Failed to load voice memos. Please try again.');
        console.error('Error fetching voice memos:', err);
      }
      setLoading(false);
    };

    loadVoiceMemos();

    // Cleanup function to stop any playing audio when component unmounts
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio && !audio.paused) {
          audio.pause();
        }
      });
    };
  }, [fetchVoiceMemos]);

  const handlePlayPause = (memoId) => {
    // If there is currently playing audio and it's not the one we want to play/pause
    if (currentPlayingAudio && currentPlayingAudio !== memoId && audioRefs.current[currentPlayingAudio]) {
      audioRefs.current[currentPlayingAudio].pause();
      setIsPlaying(prev => ({ ...prev, [currentPlayingAudio]: false }));
    }

    const audio = audioRefs.current[memoId];
    if (audio) {
      if (isPlaying[memoId]) {
        audio.pause();
      } else {
        audio.play().catch(e => {
          console.error('Error playing audio:', e);
          setError('Failed to play audio. The audio file may be missing or corrupted.');
        });
      }
      setIsPlaying(prev => ({ ...prev, [memoId]: !prev[memoId] }));
      setCurrentPlayingAudio(memoId);
    }
  };

  const handleTimeUpdate = (memoId, e) => {
    const audio = e.target;
    if (audio && !isNaN(audio.duration)) {
      const progress = (audio.currentTime / audio.duration) * 100;
      setPlaybackProgress(prev => ({ ...prev, [memoId]: progress }));

      // When audio ends
      if (audio.ended) {
        setIsPlaying(prev => ({ ...prev, [memoId]: false }));
        setPlaybackProgress(prev => ({ ...prev, [memoId]: 0 }));
      }
    }
  };

  const handleSeek = (memoId, [value]) => {
    const audio = audioRefs.current[memoId];
    if (audio && !isNaN(audio.duration)) {
      audio.currentTime = (value / 100) * audio.duration;
      setPlaybackProgress(prev => ({ ...prev, [memoId]: value }));
    }
  };

  const handleDeleteMemo = async (memoId) => {
    if (window.confirm('Are you sure you want to delete this voice memo?')) {
      setLoading(true);
      try {
        // Stop playback if this memo is currently playing
        if (isPlaying[memoId] && audioRefs.current[memoId]) {
          audioRefs.current[memoId].pause();
          setIsPlaying(prev => ({ ...prev, [memoId]: false }));
        }

        const response = await deleteVoiceMemo(memoId);
        if (response.success) {
          setVoiceMemos(voiceMemos.filter(m => m.id !== memoId));
        } else {
          setError('Failed to delete voice memo: ' + response.error);
        }
      } catch (err) {
        setError('An error occurred while deleting the voice memo.');
        console.error('Delete voice memo error:', err);
      }
      setLoading(false);
    }
  };

  const handleMemoRecorded = (memo) => {
    setVoiceMemos([memo, ...voiceMemos]);
    setIsRecordDialogOpen(false);
  };

  const handleEditMemo = (memo) => {
    setSelectedMemo(memo.id);
    setEditFormData({
      title: memo.title || '',
      tags: memo.tags ? memo.tags.join(', ') : ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateMemo = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert tags from comma-separated string to array
      const tagsArray = editFormData.tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');

      const updateData = {
        title: editFormData.title,
        tags: tagsArray
      };

      const response = await updateVoiceMemoMetadata(selectedMemo, updateData);
      if (response.success) {
        // Update memo in local state
        setVoiceMemos(voiceMemos.map(m =>
          m.id === selectedMemo
            ? { ...m, title: response.data.memo.title, tags: response.data.memo.tags }
            : m
        ));
        setIsEditDialogOpen(false);
      } else {
        setError('Failed to update voice memo: ' + response.error);
      }
    } catch (err) {
      setError('An error occurred while updating the voice memo.');
      console.error('Update voice memo error:', err);
    }
    setLoading(false);
  };

  // Filter memos based on search query and active tag
  const filteredMemos = voiceMemos.filter(memo => {
    const matchesSearch = !searchQuery ||
      memo.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !activeTag ||
      (memo.tags && memo.tags.includes(activeTag));

    return matchesSearch && matchesTag;
  });

  // Format duration string (e.g. "2:30")
  const formatDuration = (durationValue) => {
    if (!durationValue && durationValue !== 0) return '--:--';

    // If already in mm:ss format, return as is
    if (typeof durationValue === 'string' && durationValue.includes(':')) return durationValue;

    // If it's a number (seconds), format it
    const totalSeconds = typeof durationValue === 'string' ? parseFloat(durationValue) : durationValue;
    if (isNaN(totalSeconds)) return '--:--';

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Voice Memos</h1>
          <p className="text-gray-600 mt-1">Record and manage your voice notes</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          onClick={() => setIsRecordDialogOpen(true)}
        >
          <Mic size={16} />
          Record New Memo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Left sidebar with filters */}
        <div className="md:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search memos..."
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="font-semibold text-gray-700 mb-2">Tags</h2>
            <div className="space-y-2">
              <div
                className={`cursor-pointer px-3 py-2 rounded-md ${!activeTag ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100'}`}
                onClick={() => setActiveTag(null)}
              >
                All Memos
              </div>
              {allTags.map(tag => (
                <div
                  key={tag}
                  className={`cursor-pointer px-3 py-2 rounded-md ${activeTag === tag ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-gray-100'}`}
                  onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                >
                  {tag}
                </div>
              ))}
              {allTags.length === 0 && (
                <div className="text-gray-500 text-sm italic">No tags found</div>
              )}
            </div>
          </div>
        </div>

        {/* Voice memos list */}
        <div className="md:col-span-3">
          {loading && voiceMemos.length === 0 ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading voice memos...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
          ) : filteredMemos.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">
                {searchQuery || activeTag ? 'No voice memos match your filters' : 'No voice memos yet'}
              </p>
              <Button
                variant="outline"
                className="border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                onClick={() => setIsRecordDialogOpen(true)}
              >
                Record your first voice memo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMemos.map((memo) => (
                <Card key={memo.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{memo.title}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditMemo(memo)}>
                            <Edit size={14} className="mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download size={14} className="mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteMemo(memo.id)}
                            className="text-red-600 hover:text-red-700 focus:text-red-700"
                          >
                            <Trash2 size={14} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-10 w-10 rounded-full p-0 ${isPlaying[memo.id] ? 'bg-indigo-100' : ''}`}
                          onClick={() => handlePlayPause(memo.id)}
                        >
                          {isPlaying[memo.id] ? <Pause size={16} /> : <Play size={16} />}
                        </Button>

                        <div className="flex-grow">
                          <Slider
                            value={[playbackProgress[memo.id] || 0]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(value) => handleSeek(memo.id, value)}
                            className="py-0"
                          />
                        </div>

                        <span className="text-xs text-gray-500 w-10 text-right">
                          {formatDuration(memo.duration)}
                        </span>
                      </div>

                      {/* Hidden audio element for playback */}
                      <audio
                        ref={el => { audioRefs.current[memo.id] = el; }}
                        src={memo.audioUrl || memo.fileUrl || `/media/voicememos/${memo.id}.mp3`}
                        onTimeUpdate={(e) => handleTimeUpdate(memo.id, e)}
                        onEnded={() => setIsPlaying(prev => ({ ...prev, [memo.id]: false }))}
                        preload="metadata"
                        className="hidden"
                      />

                      {memo.transcriptionStatus === 'completed' && memo.transcription && (
                        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                          <p className="text-xs font-medium text-gray-500 mb-1">Transcription</p>
                          {memo.transcription}
                        </div>
                      )}

                      {memo.transcriptionStatus === 'processing' && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <AudioWaveform size={12} className="animate-pulse" />
                          Transcription in progress...
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 flex justify-between items-center">
                    <div className="flex gap-2 flex-wrap">
                      {memo.tags && memo.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-indigo-50"
                          onClick={() => setActiveTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(memo.createdAt).toLocaleDateString()}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record Dialog */}
      <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Voice Memo</DialogTitle>
          </DialogHeader>

          <VoiceMemoRecordComponent
            onMemoRecorded={handleMemoRecorded}
            onCancel={() => setIsRecordDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Voice Memo</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateMemo}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={editFormData.tags}
                  onChange={(e) => setEditFormData({...editFormData, tags: e.target.value})}
                  placeholder="work, meeting, idea"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceMemoListPage;
