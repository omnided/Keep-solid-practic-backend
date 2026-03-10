import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../features/authStore';
import { useFavoriteBooks, useDeleteFavoriteBook } from '../features/favorites/api'; // Импортируем хук удаления
import { BookCard } from './LibraryPage';

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  const { data: favoriteBooks, isLoading, isError } = useFavoriteBooks();
  
  const deleteFavoriteMutation = useDeleteFavoriteBook();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] p-8 md:p-12 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-serif text-amber-900 mb-4 font-bold">Доступ закрыт</h2>
        <p className="text-amber-700 mb-6 text-lg">Только зарегистрированные читатели имеют доступ к личной полке.</p>
        <button 
          onClick={() => navigate({ to: '/auth/login' })} 
          className="bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors"
        >
          Войти в систему
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center p-20 text-xl text-amber-900 font-serif">Сдуваем пыль с вашей личной полки... Загрузка</div>;
  }

  if (isError) {
    return <div className="text-center p-20 text-red-600 font-serif">Не удалось открыть личный архив. Попробуйте позже.</div>;
  }

  const handleRemoveFavorite = (e: React.MouseEvent, favoriteId: number) => {
    e.stopPropagation(); 
    
    if (window.confirm('Убрать книгу из избранного?')) {
      deleteFavoriteMutation.mutate(favoriteId);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8 md:p-12">
      
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b-2 border-amber-900 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif text-amber-900 font-bold tracking-tight">
            Мои избранные фолианты
          </h1>
          <p className="text-amber-700 mt-2 font-medium">
            {favoriteBooks?.length ? `Сохранено произведений: ${favoriteBooks.length}` : 'Ваша личная полка'}
          </p>
        </div>
        
        <button 
          onClick={() => navigate({ to: '/books/books' })}
          className="mt-4 md:mt-0 bg-white border-2 border-amber-700 text-amber-700 hover:bg-amber-50 font-semibold py-3 px-6 rounded-lg shadow-sm transition-all duration-200"
        >
          Вернуться в каталог
        </button>
      </header>

      {(!favoriteBooks || favoriteBooks.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 bg-amber-50/50 rounded-xl border border-dashed border-amber-300 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-amber-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h2 className="text-2xl font-serif text-amber-900 font-bold mb-2">Здесь пока пусто</h2>
          <p className="text-gray-600 max-w-md text-center mb-6 text-lg">
            Вы еще не добавили ни одной книги в избранное. Отправляйтесь в каталог и найдите то, что придется вам по душе!
          </p>
          <button 
            onClick={() => navigate({ to: '/books/books' })}    
            className="bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all"
          >
            Искать книги
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {favoriteBooks.map((favoriteItem: any) => {
            const targetBook = favoriteItem.book || favoriteItem; 
            
            return (
              <div key={favoriteItem.id} className="relative group">
                
                <BookCard 
                  book={targetBook}     
                  isAdmin={false}       
                  onDelete={() => {}} 
                />

                {/* КНОПКА УДАЛЕНИЯ ИЗ ИЗБРАННОГО */}
                <button
                  onClick={(e) => handleRemoveFavorite(e, favoriteItem.id)}
                  className="absolute top-2 left-2 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md z-10"
                  title="Убрать из избранного"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
              </div>
            );
          })}
        </div>
      )}
    </div> 
  );
};