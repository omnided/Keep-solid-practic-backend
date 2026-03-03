import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Header } from '../components/header/header'; // Укажи правильный путь к твоей шапке

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* 1. Наша шапка всегда будет висеть сверху на всех страницах */}
      <Header />
      
      {/* 2. Outlet — это "окно", куда TanStack Router будет подставлять 
             сами страницы (библиотеку, логин, профиль и т.д.) в зависимости от URL */}
      <main>
        <Outlet />
      </main>
    </div>
  ),
});
