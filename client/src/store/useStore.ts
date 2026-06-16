import { create } from 'zustand';
import { User, Activity, Tip } from '../types';
import { api } from '../lib/api';

interface AppState {
  user: User | null;
  activities: Activity[];
  insights: Tip[] | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; country?: string; monthlyTarget?: number }) => Promise<void>;
  fetchActivities: () => Promise<void>;
  logActivity: (data: { category: string; subType: string; quantity: number; unit: string; date: string; notes?: string; origin?: string; destination?: string }) => Promise<void>;
  deleteActivity: (id: number) => Promise<void>;
  fetchInsights: (force?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  activities: [],
  insights: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await api.getProfile();
      set({ user, isLoading: false });
    } catch (err: any) {
      set({ user: null, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await api.updateProfile(data);
      set({ user: updatedUser, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  fetchActivities: async () => {
    set({ isLoading: true, error: null });
    try {
      const activities = await api.getActivities();
      set({ activities, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  logActivity: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newActivity = await api.logActivity(data);
      set((state) => ({
        activities: [newActivity, ...state.activities],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteActivity: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteActivity(id);
      set((state) => ({
        activities: state.activities.filter((act) => act.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  fetchInsights: async (force?: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.generateInsights(force);
      set({ insights: res.tips, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore
    }
    set({ user: null, activities: [], insights: null, error: null });
  },
}));
