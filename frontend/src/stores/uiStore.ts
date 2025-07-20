import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UIState {
  // Theme and appearance
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Notifications and alerts
  notifications: Notification[];
  
  // Modal and dialog states
  modals: Record<string, boolean>;
  
  // Navigation
  currentPage: string;
  breadcrumbs: BreadcrumbItem[];
  
  // Mobile responsiveness
  isMobile: boolean;
  screenSize: 'sm' | 'md' | 'lg' | 'xl';
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface UIActions {
  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  setLoadingState: (key: string, loading: boolean) => void;
  clearLoadingState: (key: string) => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Modal actions
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  
  // Navigation actions
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  
  // Responsive actions
  setIsMobile: (isMobile: boolean) => void;
  setScreenSize: (size: 'sm' | 'md' | 'lg' | 'xl') => void;
  
  // Reset
  reset: () => void;
}

export type UIStore = UIState & UIActions;

const initialState: UIState = {
  theme: 'auto',
  sidebarOpen: false,
  globalLoading: false,
  loadingStates: {},
  notifications: [],
  modals: {},
  currentPage: '',
  breadcrumbs: [],
  isMobile: false,
  screenSize: 'lg',
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Theme actions
      setTheme: (theme) => set({ theme }),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      // Loading actions
      setGlobalLoading: (globalLoading) => set({ globalLoading }),
      
      setLoadingState: (key, loading) => set((state) => ({
        loadingStates: { ...state.loadingStates, [key]: loading }
      })),
      
      clearLoadingState: (key) => set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [key]: _removed, ...rest } = state.loadingStates;
        return { loadingStates: rest };
      }),

      // Notification actions
      addNotification: (notification) => set((state) => ({
        notifications: [
          ...state.notifications,
          {
            ...notification,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
          }
        ]
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      
      clearNotifications: () => set({ notifications: [] }),

      // Modal actions
      openModal: (modalId) => set((state) => ({
        modals: { ...state.modals, [modalId]: true }
      })),
      
      closeModal: (modalId) => set((state) => ({
        modals: { ...state.modals, [modalId]: false }
      })),
      
      toggleModal: (modalId) => set((state) => ({
        modals: { ...state.modals, [modalId]: !state.modals[modalId] }
      })),

      // Navigation actions
      setCurrentPage: (currentPage) => set({ currentPage }),
      
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

      // Responsive actions
      setIsMobile: (isMobile) => set({ isMobile }),
      
      setScreenSize: (screenSize) => set({ screenSize }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        // Don't persist loading states, notifications, or modals
      }),
    }
  )
);
