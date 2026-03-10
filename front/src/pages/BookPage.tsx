import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../features/authStore';
import { 
  useBook, 
  useDeleteBook, 
  useUploadBookPhoto,
  useBookAverageRating,
  useDeleteBookPhoto
} from '../features/books/api'; 
import { useAddFavoriteBook } from '../features/favorites/api';
import { useReviewsForBook, useCreateReview } from '../features/reviews/api';

export const BookPage: React.FC = () => {
  const { id } = useParams({ strict: false }); 
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');

  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5); 
  const [hoverRating, setHoverRating] = useState(0); 
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const [isFavorited, setIsFavorited] = useState(false); 
  const [isAnimating, setIsAnimating] = useState(false); 

  const { data: book, isLoading: isBookLoading } = useBook(Number(id));
  const { data: reviews, isLoading: isReviewsLoading } = useReviewsForBook(Number(id));
  const { data: averageRating, isLoading: isRatingLoading } = useBookAverageRating(Number(id));
  
  const deleteMutation = useDeleteBook();
  const uploadPhotoMutation = useUploadBookPhoto();
  const addReviewMutation = useCreateReview();
  const deletePhotoMutation = useDeleteBookPhoto();
  const addFavoriteMutation = useAddFavoriteBook();

  if (isBookLoading) return <div className="text-center p-20 text-xl text-amber-900 font-serif">Листаем страницы... Загрузка</div>;
  if (!book) return <div className="text-center p-20 text-red-600 font-serif">Книга не найдена или сожжена инквизицией.</div>;
  
  const photos: string[] = book.photo || [];

  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));

  const handleDelete = () => {
    if (window.confirm('Точно сжечь фолиант?')) {
      deleteMutation.mutate(book.id, {
        onSuccess: () => navigate({ to: '/books/books' })
      });
    }
  };

  const handleDeleteCurrentPhoto = () => {
    if (photos.length === 0) return;
    const currentPhotoUrl = photos[currentPhotoIndex];
    if (!currentPhotoUrl) return;
    
    if (window.confirm('Точно удалить эту обложку?')) {
      deletePhotoMutation.mutate(
        { bookId: book.id, url: currentPhotoUrl }, 
        {
          onSuccess: () => {
            setCurrentPhotoIndex(0);
          }
        }
      );
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('photo', file);
      uploadPhotoMutation.mutate({ id: book.id, formData });
    }
  };

  const handleFavoriteClick = () => {
    if (!user || isFavorited) return; 

    addFavoriteMutation.mutate(book.id, {
      onSuccess: () => {
        setIsAnimating(true);
        setTimeout(() => {
          setIsAnimating(false);
          setIsFavorited(true);
        }, 400);
      },
      onError: () => {
        alert('Не удалось добавить в избранное. Инквизиция против!');
      }
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !user || rating === 0) return; 
    
    addReviewMutation.mutate({ 
      id: book.id, 
      newReview: {
        user_id: user.id,
        rating: rating,
        comment: reviewText 
      }
    }, {
      onSuccess: () => {
        setReviewText(''); 
        setRating(5); 
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8 md:p-12">
      <button onClick={() => navigate({ to: '/books/books' })} className="text-amber-700 hover:text-amber-900 mb-6 flex items-center gap-2 font-semibold">
        ← Назад к полкам
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* ЛЕВАЯ КОЛОНКА: Фото и админка */}
        <div className="flex flex-col gap-4">
          
          {/* ГАЛЕРЕЯ ОБЛОЖЕК */}
          <div className="flex flex-col gap-3">
            <div className="aspect-[2/3] w-full rounded-lg shadow-xl overflow-hidden bg-amber-100 relative group">
              {photos.length > 0 ? (
                <>
                  <img src={`http://localhost:8080${photos[currentPhotoIndex]}`} alt={book.title} className="w-full h-full object-cover transition-all duration-300" />
                  
                  {/* КНОПКА УДАЛЕНИЯ ТЕКУЩЕГО ФОТО (ТОЛЬКО ДЛЯ АДМИНА) */}
                  {isAdmin && (
                    <button 
                      onClick={handleDeleteCurrentPhoto}
                      disabled={deletePhotoMutation.isPending}
                      className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
                      title="Удалить это фото"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  {/* Кнопки Влево/Вправо */}
                  {photos.length > 1 && (
                    <>
                      <button onClick={prevPhoto} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button onClick={nextPhoto} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-amber-700 to-amber-900">
                  <span className="text-white text-center font-serif font-bold text-2xl drop-shadow-md">{book.title}</span>
                </div>
              )}
            </div>

            {/* Миниатюры */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {photos.map((photoUrl, index) => (
                  <button 
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`flex-shrink-0 w-16 h-24 rounded-md overflow-hidden border-2 transition-all ${currentPhotoIndex === index ? 'border-amber-600 opacity-100 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={`http://localhost:8080${photoUrl}`} className="w-full h-full object-cover" alt="thumbnail" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Панель администратора */}
          {isAdmin && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex flex-col gap-3">
              <p className="text-xs font-bold text-red-800 uppercase tracking-wider text-center">Панель администратора</p>
              
              <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 text-sm py-2 px-4 rounded text-center hover:bg-gray-50 transition">
                <span>Добавить обложку</span>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </label>

              <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded transition">
                Удалить книгу
              </button>
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА: Инфа и отзывы */}
        <div className="md:col-span-2 flex flex-col">
          
          {/* ЗАГОЛОВОК И КНОПКА ИЗБРАННОГО */}
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-4xl md:text-5xl font-serif text-amber-900 font-bold tracking-tight">{book.title}</h1>
            
            {/* ПОКАЗЫВАЕМ ТОЛЬКО АВТОРИЗОВАННЫМ И ЕСЛИ ЕЩЕ НЕ В ИЗБРАННОМ */}
            {user && !isFavorited && (
              <button 
                onClick={handleFavoriteClick}
                disabled={addFavoriteMutation.isPending}
                className="mt-1 focus:outline-none flex-shrink-0 group"
                title="Добавить в избранное"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`w-10 h-10 transition-all duration-300 ease-in-out ${
                    isAnimating 
                      ? 'scale-150 text-red-500 fill-red-500'
                      : 'scale-100 text-gray-400 fill-transparent hover:text-red-400 hover:scale-110'
                  }`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            )}
          </div>
          
          {/* СТРОКА С АВТОРАМИ */}
          {book.authors && book.authors.length > 0 && (
            <p className="text-xl text-gray-700 mt-2 font-medium italic">
              {book.authors.join(', ')}
            </p>
          )}

          {/* СТРОКА С ГОДОМ И РЕЙТИНГОМ */}
          <div className="flex items-center gap-6 mt-3">
            <p className="text-lg text-gray-500">{book.published_year} год</p>
            
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
              <span className="font-bold text-amber-700 text-lg">
                {isRatingLoading ? '...' : (averageRating ? Number(averageRating).toFixed(1) : '—')}
              </span>
            </div>
          </div>

          {/* СТРОКА С ЖАНРАМИ */}
          <div className="flex flex-wrap gap-2 mt-5">
            {book.genres?.map((genre, i) => (
              <span key={i} className="text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full uppercase tracking-wider">
                {genre}
              </span>
            ))}
          </div>

          <p className="text-gray-800 text-lg leading-relaxed mt-6 whitespace-pre-line">
            {book.description || "Описание пока не добавлено."}
          </p>

          <hr className="my-10 border-amber-900/20" />

          {/* СЕКЦИЯ ОТЗЫВОВ */}
          <section>
            <h2 className="text-2xl font-serif text-amber-900 font-bold mb-6">Мнения читателей</h2>

            {/* Форма отзыва (только если авторизован) */}
            {user ? (
              <form onSubmit={handleReviewSubmit} className="mb-8 bg-white p-4 rounded-lg shadow-sm border border-amber-100">
                
                {/* ВЫБОР ОЦЕНКИ ЗВЕЗДАМИ */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-gray-700">Ваша оценка:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button" 
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-colors duration-150"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="currentColor" 
                          className={`w-8 h-8 ${
                            star <= (hoverRating || rating) 
                              ? "text-amber-500" 
                              : "text-gray-300"
                          }`}
                        >
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <textarea 
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Поделитесь своими мыслями о книге..."
                  className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none h-24"
                />
                <div className="mt-2 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={!reviewText.trim() || addReviewMutation.isPending} 
                    className="bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-md transition-colors"
                  >
                    {addReviewMutation.isPending ? 'Отправка...' : 'Оставить отзыв'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-amber-50 rounded-lg text-amber-800 text-sm">
                Войдите в систему, чтобы оставить свой отзыв.
              </div>
            )}

            {/* Список отзывов */}
            <div className="flex flex-col gap-4">
              {isReviewsLoading ? (
                <p className="text-gray-500 italic">Читаем свитки...</p>
              ) : reviews && reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-gray-900 mr-2">{review.username}</span>
                        
                        <div className="inline-flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg 
                              key={star}
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="currentColor" 
                              className={`w-4 h-4 ${star <= review.rating ? "text-amber-500" : "text-gray-300"}`}
                            >
                              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700 mt-1">{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-white/50 border border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">Пока никто не оставил отзыв. Станьте первым!</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};