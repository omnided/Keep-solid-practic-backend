import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreateBook, useUploadBookPhoto } from '../features/books/api';

export const CreateBookPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Мутации
  const createMutation = useCreateBook();
  const uploadPhotoMutation = useUploadBookPhoto();

  // Локальный стейт формы
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publishedYear, setPublishedYear] = useState<string>('');
  
  // Жанры теперь просто строка (пользователь вводит через запятую)
  const [genresInput, setGenresInput] = useState('');
  
  // Авторы теперь массив объектов, по умолчанию одно пустое поле
  const [authors, setAuthors] = useState([{ first_name: '', last_name: '' }]);
  
  const [photo, setPhoto] = useState<File | null>(null);

  // --- Управление полями авторов ---
  const handleAddAuthor = () => {
    setAuthors([...authors, { first_name: '', last_name: '' }]);
  };

  const handleRemoveAuthor = (index: number) => {
    setAuthors(authors.filter((_, i) => i !== index));
  };

  const handleAuthorChange = (index: number, field: 'first_name' | 'last_name', value: string) => {
    setAuthors(prevAuthors => prevAuthors.map((author, i) => 
      i === index ? { ...author, [field]: value } : author
    ));
  };

  // --- Главный обработчик сохранения ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Превращаем строку "Фантастика, Драма " в чистый массив ["Фантастика", "Драма"]
    const genreNames = genresInput
      .split(',')
      .map(g => g.trim())
      .filter(g => g.length > 0); // Убираем пустые строки, если человек поставил лишнюю запятую

    // Отфильтровываем совсем пустые поля авторов, чтобы не слать мусор на бэкенд
    const validAuthors = authors.filter(a => a.first_name.trim() || a.last_name.trim());

    // ШАГ 1: Создаем книгу
    createMutation.mutate({
      title,
      description,
      published_year: Number(publishedYear),
      genreNames,       // Отправляем новый формат жанров
      authors: validAuthors // Отправляем новый формат авторов
    }, {
      onSuccess: (responseData: any) => { // Принимаем ответ от сервера
        // Достаем ID, независимо от того, вернул ли бэкенд просто число или объект {id: 5, message: '...'}
        const createdBookId = typeof responseData === 'number' ? responseData : responseData.id;

        // ШАГ 2: Если есть фото, загружаем его для нового ID
        if (photo && createdBookId) {
          const formData = new FormData();
          formData.append('photo', photo);
          
          uploadPhotoMutation.mutate(
            { id: createdBookId, formData },
            {
              onSuccess: () => navigate({ to: `/books/${createdBookId}` })
            }
          );
        } else {
          // Если фото нет, просто переходим на страницу книги
          navigate({ to: `/books/${createdBookId}` });
        }
      },
      onError: () => alert('Ошибка при публикации фолианта. Возможно, такой свиток уже существует или связь с архивом утеряна.')
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8 md:p-12">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => window.history.back()} className="text-amber-700 hover:text-amber-900 mb-6 flex items-center gap-2 font-semibold">
          ← Назад
        </button>

        <h1 className="text-4xl font-serif text-amber-900 font-bold mb-8">Издать новый фолиант</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-amber-100 flex flex-col gap-6">
          
          {/* НАЗВАНИЕ И ГОД */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Название книги *</label>
              <input 
                type="text" required value={title} onChange={e => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" 
                placeholder="Например: 1984"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Год издания *</label>
              <input 
                type="number" required value={publishedYear} onChange={e => setPublishedYear(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" 
                placeholder="1949"
              />
            </div>
          </div>

          {/* ЖАНРЫ (СТРОКА ЧЕРЕЗ ЗАПЯТУЮ) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Жанры (через запятую)</label>
            <input 
              type="text" value={genresInput} onChange={e => setGenresInput(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" 
              placeholder="Антиутопия, Фантастика, Драма"
            />
            <p className="text-xs text-gray-500 mt-1">Новые жанры будут созданы автоматически, если их еще нет в базе.</p>
          </div>

          {/* ДИНАМИЧЕСКИЙ БЛОК АВТОРОВ */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-gray-700">Авторы книги</label>
              <button 
                type="button" 
                onClick={handleAddAuthor}
                className="text-amber-700 hover:text-amber-900 text-sm font-semibold flex items-center gap-1"
              >
                + Добавить соавтора
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {authors.map((author, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value={author.first_name} 
                    onChange={e => handleAuthorChange(index, 'first_name', e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500 outline-none text-sm" 
                    placeholder="Имя (Джордж)"
                  />
                  <input 
                    type="text" 
                    value={author.last_name} 
                    onChange={e => handleAuthorChange(index, 'last_name', e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500 outline-none text-sm" 
                    placeholder="Фамилия (Оруэлл)"
                  />
                  
                  {/* Кнопка удаления (показываем, только если авторов больше одного) */}
                  {authors.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveAuthor(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Удалить автора"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ОПИСАНИЕ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Описание *</label>
            <textarea 
              required value={description} onChange={e => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500 outline-none h-32 resize-y" 
              placeholder="О чем эта книга..."
            />
          </div>

          {/* ЗАГРУЗКА ФОТО */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Обложка книги</label>
            <div className="border-2 border-dashed border-amber-200 bg-amber-50/50 rounded-lg p-6 text-center hover:bg-amber-50 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*"
                onChange={e => setPhoto(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {photo ? (
                <div className="flex flex-col items-center gap-2 text-amber-800 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Выбран файл: {photo.name}</span>
                  <span className="text-xs text-amber-600 underline">Нажмите, чтобы заменить</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Нажмите или перетащите картинку сюда</span>
                </div>
              )}
            </div>
          </div>

          <hr className="border-amber-100 my-2" />

          {/* КНОПКА ОТПРАВКИ */}
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={createMutation.isPending || uploadPhotoMutation.isPending}
              className="bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 px-8 rounded-lg shadow-md disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending || uploadPhotoMutation.isPending ? 'Публикация...' : 'Сохранить книгу'}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};