import { create } from 'zustand';

// Zustand store for centralized state management

const useStore = create((set, get) => ({
  // Auth state
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),

  // Mock login function with hardcoded user/password
  login: async ({ email, password }) => {
    // Mock user data
    const mockUser = { username: 'testuser@example.com', name: 'Test User' };
    const mockPassword = 'password123';

    if (email === mockUser.username && password === mockPassword) {
      set({ user: mockUser, isAuthenticated: true });
      return { success: true };
    } else {
      return { success: false, error: 'Invalid email or password' };
    }
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

  // Add more slices for photos, files, passwords, etc. as needed
}));

export default useStore;
