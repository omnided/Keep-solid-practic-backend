import React from 'react';
import { useNavigate } from '@tanstack/react-router'; // Или '@tanstack/react-router', если используешь его
import { useBooks, useDeleteBook, useBookAverageRating, useExportBooksCsv } from '../features/books/api'; // Замени './api' на свой путь к хукам
import { Book } from '../features/books/types';
import { useAuthStore } from '../features/authStore';

// ==========================================
// 1. КОМПОНЕНТ КАРТОЧКИ КНИГИ
// ==========================================
export const BookCard: React.FC<{ 
  book: Book; 
  isAdmin: boolean; 
  onDelete: (e: React.MouseEvent, id: number) => void 
}> = ({ book, isAdmin, onDelete }) => {
  const navigate = useNavigate();
  
  // Хук рейтинга теперь легально работает внутри отдельного компонента
  const { data: rating, isLoading: isRatingLoading } = useBookAverageRating(book.id);

  return (
    <div 
      onClick={() => navigate({to:`/books/${book.id}`})}
      className="group cursor-pointer flex flex-col h-full"
    >
      {/* Обложка книги */}
      <div className="relative aspect-[2/3] w-full rounded-md shadow-[4px_4px_10px_rgba(0,0,0,0.15)] overflow-hidden bg-amber-100 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[4px_12px_20px_rgba(0,0,0,0.2)]">
        
        {/* ИСПРАВЛЕННАЯ ПРОВЕРКА: проверяем, что это массив и в нем есть элементы */}
        {book.photo && book.photo.length > 0 ? (
          <img 
            // Добавил небольшую защиту: если бэкенд вдруг отдаст строку, берем её, иначе первый элемент массива
            src={`http://localhost:8080${Array.isArray(book.photo) ? book.photo[0] : book.photo}`} 
            alt={book.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-amber-700 to-amber-900">
            <span className="text-white text-center font-serif font-bold text-lg drop-shadow-md line-clamp-4">
              {book.title}
            </span>
          </div>
        )}

        {/* Кнопка удаления поверх обложки (только для админа) */}
        {isAdmin && (
          <button 
            onClick={(e) => onDelete(e, book.id)}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
            title="Удалить книгу"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Текстовая информация под обложкой */}
      <div className="mt-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">
          {book.title}
        </h3>
        
        {/* Блок с годом и рейтингом */}
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-gray-500">{book.published_year} год</p>
          
          <div className="text-sm font-bold text-amber-600 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {isRatingLoading ? '...' : (rating ? Number(rating).toFixed(1) : '—')}
          </div>
        </div>
        
        {/* Теги жанров */}
        <div className="flex flex-wrap gap-1 mt-2 mb-2">
          {book.genres.slice(0, 3).map((genre, index) => (
            <span 
              key={index} 
              className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded-full uppercase tracking-wider"
            >
              {genre}
            </span>
          ))}
          {book.genres.length > 3 && (
            <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              +{book.genres.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. ГЛАВНАЯ СТРАНИЦА БИБЛИОТЕКИ
// ==========================================
export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  // Вызываем хуки получения книг и удаления
  const { data: books, isLoading, isError } = useBooks();
  const deleteMutation = useDeleteBook();
  const exportCsvMutation = useExportBooksCsv();
  // Логика isAdmin: берем из localStorage, токена или контекста твоего приложения
  // Временно ставлю парсинг из стораджа, подстрой под свою систему авторизации
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;

  // Единая функция удаления, которую мы передадим в карточки
  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите сжечь этот фолиант? Данные не восстановить.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center p-20 text-xl text-amber-900 font-serif">Протираем пыль с полок... Загрузка</div>;
  }

  if (isError || !books) {
    return <div className="text-center p-20 text-red-600 font-serif">Упс, полки обвалились. Не удалось загрузить книги.</div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8 md:p-12">
      
      {/* Шапка библиотеки */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 border-b-2 border-amber-900 pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif text-amber-900 font-bold tracking-tight">
            Каталог книг
          </h1>
          <p className="text-amber-700 mt-2">Найдено произведений: {books.length}</p>
        </div>

        {isAdmin && (
          <div className="mt-4 md:mt-0 flex gap-4">
            
            {/* КНОПКА ЭКСПОРТА CSV */}
            <button 
              onClick={() => exportCsvMutation.mutate()}
              disabled={exportCsvMutation.isPending}
              className="bg-white border-2 border-amber-700 text-amber-700 hover:bg-amber-50 disabled:opacity-50 font-semibold py-3 px-6 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
            >
              {exportCsvMutation.isPending ? (
                'Пишем свиток...'
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Скачать CSV
                </>
              )}
            </button>

            {/* Заодно поправил тут навигацию для строгого роутинга: { to: '/books/create' } */}
            <button 
              onClick={() => navigate({ to: '/books/create' })}
              className="bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200"
            >
              + Добавить фолиант
            </button>
          </div>
        )}
      </header>

      {/* Книжная полка (Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {books?.map((book) => (
          <BookCard 
            key={book.id} 
            book={book} 
            isAdmin={isAdmin} 
            onDelete={handleDeleteClick} 
          />
        ))}
      </div>
    </div>
  );
};