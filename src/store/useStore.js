import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Zustand store for centralized state management

const useStore = create(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        set({ user: null, isAuthenticated: false });
        // Clear any other sensitive data if needed
      },

      // Use real authentication service
      login: async (credentials) => {
        const { login } = await import('../services/authService');
        const response = await login(credentials);

        if (response.success && response.data) {
          set({ user: response.data.user, isAuthenticated: true });
        }

        return response;
      },

  // Resume state
  resumeData: null,
  setResumeData: (data) => set({ resumeData: data }),

  // Example async action to fetch resume data using service
  fetchResumeData: async () => {
    const { getResumeData } = await import('../services/resumeService');
    const response = await getResumeData();
    if (response.success) {
      get().setResumeData(response.data.resume);
    }
  },

  // Notes state
  notes: [],
  setNotes: (notes) => set({ notes }),
  fetchNotes: async (filters = {}) => {
    const { listNotes } = await import('../services/notesService');
    const response = await listNotes(filters);
    if (response.success) {
      // API returns data array directly (not nested in .notes)
      get().setNotes(response.data);
    }
    return response;
  },

  // Bookmarks state
  bookmarks: [],
  setBookmarks: (bookmarks) => set({ bookmarks }),
  fetchBookmarks: async (filters = {}) => {
    const { listBookmarks } = await import('../services/bookmarkService');
    const response = await listBookmarks(filters);
    if (response.success) {
      // API returns data array directly (not nested in .bookmarks)
      get().setBookmarks(response.data);
    }
    return response;
  },

  // Passwords state
  passwords: [],
  setPasswords: (passwords) => set({ passwords }),
  fetchPasswords: async (filters = {}) => {
    const { listPasswords } = await import('../services/passwordService');
    const response = await listPasswords(filters);
    if (response.success) {
      // Update format to match what the component expects
      // Check if the response data is an array (API data) or has a passwords property (mock data)
      const passwordsArray = Array.isArray(response.data) ? response.data :
                            (response.data && response.data.passwords ? response.data.passwords : []);

      const formattedPasswords = passwordsArray.map(password => ({
        ...password,
        // Ensure consistent naming and defaults for required fields
        id: password.id || `temp-${Date.now()}`,
        serviceName: password.serviceName || password.name || '',
        username: password.username || '',
        website: password.website || password.url || '',
        lastUpdated: password.updatedAt || password.lastUpdated || password.createdAt || new Date().toISOString()
      }));
      get().setPasswords(formattedPasswords);
    }
    return response;
  },

  // Digital Wallet state
  cards: [],
  setCards: (cards) => set({ cards }),
  fetchCards: async (filters = {}) => {
    const { listCards } = await import('../services/digitalWalletService');
    const response = await listCards(filters);
    if (response.success) {
      // Format card data to handle differences between API and UI expectations
      const cardsData = response.data.cards || response.data || [];
      const formattedCards = cardsData.map(card => {
        // Ensure consistent naming and defaults for all required fields
        return {
          id: card.id,
          cardholderName: card.cardholderName,
          cardType: card.issuer || card.cardType || 'Card',
          lastFourDigits: card.lastFourDigits ||
                         (card.cardNumber ? card.cardNumber.slice(-4) : '0000'),
          expiryDate: card.expiryDate ||
                     (card.expiryMonth && card.expiryYear ?
                      `${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}` : '12/99'),
          // Include any other fields the UI might need
          color: card.color || "#FF5722",
        };
      });
      get().setCards(formattedCards);
    }
    return response;
  },

  // Voice Memos state
  voiceMemos: [],
  setVoiceMemos: (memos) => set({ voiceMemos: memos }),
  fetchVoiceMemos: async (filters = {}) => {
    const { listVoiceMemos } = await import('../services/voiceMemoService');
    const response = await listVoiceMemos(filters);
    if (response.success) {
      // Make sure we're using the correct data format returned from the API
      get().setVoiceMemos(response.data.memos);
    } else {
      console.error("Failed to fetch voice memos:", response.error);
    }
    return response;
  }
    }),
    {
      name: 'personalpod-storage', // Name for the storage
      getStorage: () => localStorage, // Use localStorage for persistence
    }
  )
);

export default useStore;
