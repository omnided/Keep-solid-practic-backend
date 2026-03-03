import { createFileRoute } from "@tanstack/react-router";

// Компонент-сторінку можна визначити прямо тут або імпортувати з іншого файлу
// Для простоти визначимо його тут

import { LibraryPage } from "../../pages/LibraryPage"; // 

// Припускаємо, що компонент винесено
export const Route = createFileRoute("/books/books")({
  component: LibraryPage, // Вказуємо компонент для цього маршруту
});