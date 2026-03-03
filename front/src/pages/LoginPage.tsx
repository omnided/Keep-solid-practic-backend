import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useLogin } from '../features/register/api'; // Подставь правильный путь к своему хуку

export const LoginPage: React.FC = () => {
  // Меняем username на email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { mutate: login, isPending, isError } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      // Отправляем данные на бэкенд. 
      // Привязываем email к ключу username, так как стандартный JWT Symfony ждет именно его
      login({ email, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-amber-100 p-8">
        
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-amber-900">Вход в библиотеку</h2>
          <p className="text-sm text-gray-500 mt-2">Предъявите ваш читательский билет</p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Поле: Почта */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Электронная почта
            </label>
            <input
              id="email"
              type="email" // Меняем тип на email для валидации браузером
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              placeholder="ваша@почта.ру"
            />
          </div>

          {/* Поле: Пароль */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {/* Ошибка авторизации */}
          {isError && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              Неверная почта или пароль. Попробуйте снова.
            </div>
          )}

          {/* Кнопка отправки */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? 'Входим...' : 'Войти'}
          </button>
        </form>

        {/* Ссылка на регистрацию */}
        <div className="mt-8 text-center text-sm text-gray-600">
          Ещё нет аккаунта?{' '}
          <Link to="/auth/register" className="font-semibold text-amber-700 hover:text-amber-900 hover:underline">
            Оформить читательский билет
          </Link>
        </div>

      </div>
    </div>
  );
};