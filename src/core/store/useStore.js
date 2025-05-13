// src/core/store/useStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getStorage as getPlatformStorage } from '../storage/storageInterface';
import authService from '../services/authService';
import { listNotes } from '../services/notesService';
import { listBookmarks } from '../services/bookmarkService';
import { listPasswords } from '../services/passwordService';
import { listCards } from '../services/digitalWalletService';
import { listVoiceMemos } from '../services/voiceMemoService';
import { getAllResumes } from '../services/resumeService'; // Assuming this is the correct list function
import { listDirectoryContents } from '../services/fileService';
import { listPhotos } from '../services/photoService';

export const useStore = create(
  persist(
    (set, get) => ({
      // === your existing state & actions below ===
      user: null,
      setUser: (user) => set({ user }),
      removeUser: () => set({ user: null }),

      theme: 'light',
      setTheme: (theme) => set({ theme }),

      // Data states
      notes: [],
      bookmarks: [],
      passwords: [],
      cards: [],
      voiceMemos: [],
      resumes: [],
      resumeData: null, // Single resume data for viewing/editing
      files: [], // For file manager (directory contents)
      photos: [],

      // --- Notes ---
      fetchNotes: async () => {
        try {
          const response = await listNotes();
          if (response && response.success && Array.isArray(response.data)) {
            set({ notes: response.data });
          } else {
            console.error('Failed to fetch notes or data is not an array:', response?.error || 'No error message');
            set({ notes: get().notes || [] }); // Keep existing or ensure it's an array on failure
          }
        } catch (error) {
          console.error('Error in fetchNotes store action:', error);
          set({ notes: get().notes || [] }); // Keep existing or ensure it's an array on error
        }
      },
      // TODO: Add createNote, updateNote, deleteNote actions (these would call notesService and then re-fetch or update state)

      // --- Bookmarks ---
      fetchBookmarks: async () => {
        try {
          const response = await listBookmarks();
          if (response && response.success && Array.isArray(response.data)) {
            set({ bookmarks: response.data });
          } else {
            console.error('Failed to fetch bookmarks or data is not an array:', response?.error || 'No error message');
            set({ bookmarks: get().bookmarks || [] });
          }
        } catch (error) {
          console.error('Error in fetchBookmarks store action:', error);
          set({ bookmarks: get().bookmarks || [] });
        }
      },
      // TODO: Add bookmark actions

      // --- Resumes ---
      fetchResumes: async () => {
        try {
          const response = await getAllResumes();
          if (response && response.success && Array.isArray(response.data)) {
            set({ resumes: response.data });
          } else {
            console.error('Failed to fetch resumes or data is not an array:', response?.error);
            set({ resumes: get().resumes || [] });
          }
        } catch (error) {
          console.error('Error in fetchResumes store action:', error);
          set({ resumes: get().resumes || [] });
        }
      },

      // Single resume data fetching
      fetchResumeData: async (resumeId) => {
        try {
          const { getResumeData } = await import('../services/resumeService');
          const response = await getResumeData(resumeId);
          if (response && response.success && response.data && response.data.resume) {
            set({ resumeData: response.data.resume });
          } else {
            console.error('Failed to fetch resume data:', response?.error);
            set({ resumeData: null });
            throw new Error(response?.error || 'Failed to fetch resume data');
          }
        } catch (error) {
          console.error('Error in fetchResumeData store action:', error);
          set({ resumeData: null });
          throw error;
        }
      },

      setResumeData: (resumeData) => {
        set({ resumeData });
      },
      // TODO: Add more resume actions

      // --- Files ---
      fetchFiles: async (path = "/") => { // Path might be relevant for file manager
        try {
          const response = await listDirectoryContents(path);
          // listDirectoryContents returns data in response.data.items
          if (response && response.success && response.data && Array.isArray(response.data.items)) {
            set({ files: response.data.items });
          } else {
            console.error('Failed to fetch files or data.items is not an array:', response?.error);
            set({ files: get().files || [] });
          }
        } catch (error) {
          console.error('Error in fetchFiles store action:', error);
          set({ files: get().files || [] });
        }
      },
      // TODO: Add file actions

      // --- Photos ---
      fetchPhotos: async () => {
        try {
          const response = await listPhotos();
          if (response && response.success && Array.isArray(response.data)) {
            set({ photos: response.data });
          } else {
            console.error('Failed to fetch photos or data is not an array:', response?.error);
            set({ photos: get().photos || [] });
          }
        } catch (error) {
          console.error('Error in fetchPhotos store action:', error);
          set({ photos: get().photos || [] });
        }
      },
      // TODO: Add photo actions

      // --- Passwords ---
      fetchPasswords: async () => {
        try {
          const response = await listPasswords();
          if (response && response.success && Array.isArray(response.data)) {
            set({ passwords: response.data });
          } else {
            console.error('Failed to fetch passwords or data is not an array:', response?.error || 'No error message');
            set({ passwords: get().passwords || [] });
          }
        } catch (error) {
          console.error('Error in fetchPasswords store action:', error);
          set({ passwords: get().passwords || [] });
        }
      },
      // TODO: Add password actions

      // --- Cards (Wallet) ---
      fetchCards: async () => {
        try {
          const response = await listCards();
          // digitalWalletService.listCards returns data in response.data.cards
          if (response && response.success && response.data && Array.isArray(response.data.cards)) {
            set({ cards: response.data.cards });
          } else {
            console.error('Failed to fetch cards or data.cards is not an array:', response?.error || 'No error message');
            set({ cards: get().cards || [] });
          }
        } catch (error) {
          console.error('Error in fetchCards store action:', error);
          set({ cards: get().cards || [] });
        }
      },
      // TODO: Add card actions

      // --- Voice Memos ---
      fetchVoiceMemos: async () => {
        try {
          const response = await listVoiceMemos();
          // voiceMemoService.listVoiceMemos returns data in response.data.memos
          if (response && response.success && response.data && Array.isArray(response.data.memos)) {
            set({ voiceMemos: response.data.memos });
          } else {
            console.error('Failed to fetch voice memos or data.memos is not an array:', response?.error || 'No error message');
            set({ voiceMemos: get().voiceMemos || [] });
          }
        } catch (error) {
          console.error('Error in fetchVoiceMemos store action:', error);
          set({ voiceMemos: get().voiceMemos || [] });
        }
      },
      // TODO: Add voice memo actions

      login: async (credentials) => {
        try {
          const response = await authService.login(credentials);
          if (response && response.success && response.data && response.data.user) {
            set({ user: response.data.user });
          }
          // Ensure the full response is returned for LoginPage to handle
          return response || { success: false, error: 'Login failed, no response from server.' };
        } catch (error) {
          console.error('Store login action error:', error);
          return { success: false, error: error.message || 'An unexpected error occurred during login.' };
        }
      },

      logout: async () => {
        await authService.logout();
        set({ user: null });
      },

      isAuthenticated: () => !!get().user, // Derived state: true if user exists, false otherwise

      // add other state slices/actions as needed
      // === end existing state & actions ===
    }),
    {
      name: 'app-storage', // key in storage
      getStorage: () => {
        const storage = getPlatformStorage();
        return {
          getItem: (key) => storage.get(key),
          setItem: (key, value) => storage.set(key, value),
          removeItem: (key) => storage.remove(key),
        };
      },
    }
  )
);

export default useStore;