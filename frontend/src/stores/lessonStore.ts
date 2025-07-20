import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  difficulty_level: number;
  estimated_time?: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  is_published: boolean;
  author_id: string;
}

export interface LessonProgress {
  lesson_id: string;
  user_id: string;
  progress_percentage: number;
  completed_at?: string;
  time_spent: number;
  last_accessed: string;
}

export interface LessonState {
  // Lesson data
  lessons: Lesson[];
  currentLesson: Lesson | null;
  
  // Progress tracking
  progress: Record<string, LessonProgress>;
  
  // Filters and search
  searchQuery: string;
  selectedTags: string[];
  difficultyFilter: number | null;
  sortBy: 'title' | 'difficulty' | 'created_at' | 'progress';
  sortOrder: 'asc' | 'desc';
  
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  
  // Loading states
  isLoading: boolean;
  isLoadingLesson: boolean;
  
  // Cache
  lastFetch: number | null;
  cacheExpiry: number; // 5 minutes
}

export interface LessonActions {
  // Lesson management
  setLessons: (lessons: Lesson[]) => void;
  addLesson: (lesson: Lesson) => void;
  updateLesson: (id: string, updates: Partial<Lesson>) => void;
  removeLesson: (id: string) => void;
  setCurrentLesson: (lesson: Lesson | null) => void;
  
  // Progress management
  setProgress: (progress: Record<string, LessonProgress>) => void;
  updateProgress: (lessonId: string, progress: Partial<LessonProgress>) => void;
  
  // Filters and search
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setDifficultyFilter: (difficulty: number | null) => void;
  setSortBy: (sortBy: LessonState['sortBy']) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  
  // Pagination
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setTotalItems: (total: number) => void;
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setLoadingLesson: (loading: boolean) => void;
  
  // Cache management
  updateLastFetch: () => void;
  isCacheValid: () => boolean;
  
  // Utility actions
  clearFilters: () => void;
  reset: () => void;
}

export type LessonStore = LessonState & LessonActions;

const initialState: LessonState = {
  lessons: [],
  currentLesson: null,
  progress: {},
  searchQuery: '',
  selectedTags: [],
  difficultyFilter: null,
  sortBy: 'title',
  sortOrder: 'asc',
  currentPage: 1,
  itemsPerPage: 12,
  totalItems: 0,
  isLoading: false,
  isLoadingLesson: false,
  lastFetch: null,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
};

export const useLessonStore = create<LessonStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Lesson management
      setLessons: (lessons) => set({ lessons }),
      
      addLesson: (lesson) => set((state) => ({
        lessons: [...state.lessons, lesson]
      })),
      
      updateLesson: (id, updates) => set((state) => ({
        lessons: state.lessons.map(lesson => 
          lesson.id === id ? { ...lesson, ...updates } : lesson
        )
      })),
      
      removeLesson: (id) => set((state) => ({
        lessons: state.lessons.filter(lesson => lesson.id !== id)
      })),
      
      setCurrentLesson: (currentLesson) => set({ currentLesson }),

      // Progress management
      setProgress: (progress) => set({ progress }),
      
      updateProgress: (lessonId, progressUpdate) => set((state) => ({
        progress: {
          ...state.progress,
          [lessonId]: {
            ...state.progress[lessonId],
            ...progressUpdate,
          }
        }
      })),

      // Filters and search
      setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
      
      setSelectedTags: (selectedTags) => set({ selectedTags, currentPage: 1 }),
      
      addTag: (tag) => set((state) => ({
        selectedTags: [...state.selectedTags, tag],
        currentPage: 1
      })),
      
      removeTag: (tag) => set((state) => ({
        selectedTags: state.selectedTags.filter(t => t !== tag),
        currentPage: 1
      })),
      
      setDifficultyFilter: (difficultyFilter) => set({ difficultyFilter, currentPage: 1 }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      setSortOrder: (sortOrder) => set({ sortOrder }),

      // Pagination
      setCurrentPage: (currentPage) => set({ currentPage }),
      
      setItemsPerPage: (itemsPerPage) => set({ itemsPerPage, currentPage: 1 }),
      
      setTotalItems: (totalItems) => set({ totalItems }),

      // Loading states
      setLoading: (isLoading) => set({ isLoading }),
      
      setLoadingLesson: (isLoadingLesson) => set({ isLoadingLesson }),

      // Cache management
      updateLastFetch: () => set({ lastFetch: Date.now() }),
      
      isCacheValid: () => {
        const { lastFetch, cacheExpiry } = get();
        return lastFetch !== null && (Date.now() - lastFetch) < cacheExpiry;
      },

      // Utility actions
      clearFilters: () => set({
        searchQuery: '',
        selectedTags: [],
        difficultyFilter: null,
        currentPage: 1,
      }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'lesson-storage',
      partialize: (state) => ({
        progress: state.progress,
        searchQuery: state.searchQuery,
        selectedTags: state.selectedTags,
        difficultyFilter: state.difficultyFilter,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        itemsPerPage: state.itemsPerPage,
        // Don't persist lessons, loading states, or cache data
      }),
    }
  )
);
