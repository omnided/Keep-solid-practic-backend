import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useRegister } from '../features/register/api';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { mutate: register, isPending, isError } = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && email && password) {
      register({ username, email, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-amber-100 p-8">
        
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-amber-900">Регистрация</h2>
          <p className="text-sm text-gray-500 mt-2">Присоединяйтесь к нашему клубу читателей</p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Поле: Никнейм */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
              Никнейм
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              placeholder="Придумайте никнейм"
            />
          </div>

          {/* Поле: Почта */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Электронная почта
            </label>
            <input
              id="email"
              type="email"
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

          {/* Ошибка регистрации */}
          {isError && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              Ошибка регистрации. Возможно, ник или почта уже заняты.
            </div>
          )}

          {/* Кнопка отправки */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isPending ? 'Создаем профиль...' : 'Зарегистрироваться'}
          </button>
        </form>

        {/* Ссылка на вход */}
        <div className="mt-8 text-center text-sm text-gray-600">
          Уже есть аккаунт?{' '}
          <Link to="/auth/login" className="font-semibold text-amber-700 hover:text-amber-900 hover:underline">
            Войти в систему
          </Link>
        </div>

      </div>
    </div>
  );
};