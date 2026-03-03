import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router'; 
import { useAuthStore } from '../../features/authStore'; 
import { useUserInfo } from '../../features/users/api'; 
import { useQueryClient } from '@tanstack/react-query'; // Для сброса кэша

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Извлекаем функцию выхода и объект пользователя из стора
  const { logout, user: authUser, token } = useAuthStore(); 
  
  const userId = authUser?.id || null;
  const { data: userInfo, isLoading, isError } = useUserInfo(userId);

  // Считаем авторизованным, если есть токен
  const isAuthenticated = !!token;

  const handleLogout = () => {
    logout?.(); 
    // Обязательно очищаем кэш React Query
    queryClient.clear();
    navigate({ to: '/' });
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-amber-200 shadow-sm px-6 py-4 flex justify-between items-center transition-all">
      
      {/* Логотип (Левая часть) */}
      <Link 
        to="/books/books" 
        className="flex items-center gap-2 text-amber-900 hover:text-amber-700 transition-colors group"
      >
        <svg 
          className="w-8 h-8 transform group-hover:-translate-y-1 transition-transform duration-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="text-2xl font-serif font-bold tracking-tight hidden sm:block">
          Библиотека
        </span>
      </Link>

      {/* Зона аккаунта (Правая часть) */}
      <div className="flex items-center gap-4">
        {isLoading && userId ? (
          /* Состояние загрузки */
          <div className="flex items-center gap-4 animate-pulse">
            <div className="h-4 w-24 bg-amber-200 rounded hidden sm:block"></div>
            <div className="w-10 h-10 rounded-full bg-amber-200"></div>
          </div>
        ) : isAuthenticated ? (
          /* Авторизован */
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* ---> НОВАЯ КНОПКА ИЗБРАННОГО <--- */}
            {/* Замени '/favorites' на свой реальный путь к странице избранного, если он отличается */}
            <Link 
              to="/books/favorite" 
              className="flex items-center gap-1.5 text-amber-800 hover:text-red-500 transition-colors group"
              title="Мои избранные фолианты"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <span className="hidden md:block font-medium text-sm">Избранное</span>
            </Link>

            {/* Разделитель */}
            <div className="w-px h-6 bg-amber-200 hidden sm:block"></div>

            {/* Имя и кнопка Выйти */}
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-bold text-gray-800">
                {userInfo?.name || userInfo?.username || 'Читатель'}
              </span>
              <button 
                onClick={handleLogout}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Выйти
              </button>
            </div>

            {/* Аватарка */}
            <Link 
              to="/profile" 
              className="w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-700 overflow-hidden cursor-pointer hover:ring-2 hover:ring-amber-400 hover:border-transparent transition-all shadow-sm"
              title="Перейти в профиль"
            >
              {userInfo?.root ? (
                <img 
                  src={`http://localhost:8080${userInfo.root}`} 
                  alt="Аватар" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <svg className="w-full h-full text-amber-700/50 mt-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </Link>
          </div>
        ) : (
          /* Гость */
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              to="/auth/login" 
              className="text-sm sm:text-base text-amber-900 hover:bg-amber-100 font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors"
            >
              Войти
            </Link>
            <Link 
              to="/auth/register" 
              className="text-sm sm:text-base bg-amber-700 hover:bg-amber-800 text-white font-medium py-2 px-3 sm:px-4 rounded-lg shadow-sm transition-colors"
            >
              Регистрация
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};