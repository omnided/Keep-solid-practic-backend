import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../features/doctors/types';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
  token: string | null;
  user: User | null;
  isSessionExpired: boolean;
  // Actions
  setSessionExpired: (value: boolean) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isSessionExpired: false,
      setSessionExpired: (value) => set({ isSessionExpired: value }),
      setToken: (token: string) => {
        try {
          // 1. Декодируем токен
          const decoded = jwtDecode<User>(token);
          
          // 2. Сохраняем и токен, и данные юзера
          set({ token, user: decoded });
        } catch (error) {
          console.error("Failed to decode token:", error);
          set({ token: null, user: null });
        }
      },

      logout: () => {
        set({ token: null, user: null, isSessionExpired: false });
        // Опционально: очистить React Query кеш, если нужно
        // window.location.href = '/login'; // Жесткий редирект если надо
      },
    }),
    {
      name: 'polyclinic-auth', // Ключ в localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);