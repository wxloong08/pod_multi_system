import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIStoreState {
    // Sidebar state
    sidebarCollapsed: boolean;
    mobileSidebarOpen: boolean;

    // Theme
    theme: 'light' | 'dark' | 'system';

    // Notification
    notifications: Array<{
        id: string;
        type: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message?: string;
        timestamp: number;
    }>;

    // Actions
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setMobileSidebarOpen: (open: boolean) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    addNotification: (notification: Omit<UIStoreState['notifications'][0], 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
}

export const useUIStore = create<UIStoreState>()(
    devtools(
        persist(
            (set) => ({
                sidebarCollapsed: false,
                mobileSidebarOpen: false,
                theme: 'system',
                notifications: [],

                toggleSidebar: () => {
                    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
                },

                setSidebarCollapsed: (collapsed) => {
                    set({ sidebarCollapsed: collapsed });
                },

                setMobileSidebarOpen: (open) => {
                    set({ mobileSidebarOpen: open });
                },

                setTheme: (theme) => {
                    set({ theme });
                },

                addNotification: (notification) => {
                    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
                    set((state) => ({
                        notifications: [
                            { ...notification, id, timestamp: Date.now() },
                            ...state.notifications,
                        ].slice(0, 10),
                    }));
                },

                removeNotification: (id) => {
                    set((state) => ({
                        notifications: state.notifications.filter((n) => n.id !== id),
                    }));
                },

                clearNotifications: () => {
                    set({ notifications: [] });
                },
            }),
            {
                name: 'pod-ui-store',
                partialize: (state) => ({
                    sidebarCollapsed: state.sidebarCollapsed,
                    theme: state.theme,
                }),
            }
        ),
        { name: 'UIStore' }
    )
);
