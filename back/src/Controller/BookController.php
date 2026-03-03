<?php

namespace App\Controller;

use App\Repository\BookRepository;
use App\Repository\GenresRepository;
use App\Repository\AuthorRepository;
use App\Repository\ReviewRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/books')] // Базовый URL для всех методов в этом классе
class BookController extends AbstractController
{
    public function __construct(
        private BookRepository $bookRepository,
        private GenresRepository $genresRepository,
        private AuthorRepository $authorRepository,
        private ReviewRepository $reviewRepository

    ) {}

    // ТЗ: "список всех доступных - не требует логин"
    #[Route('', methods: ['GET'])]
    public function list(): JsonResponse
{
    // Получаем массив книг
    $books = $this->bookRepository->findAll();
    
    // Создаем JSON-ответ
    $response = $this->json($books);
    
    // ПРИНУДИТЕЛЬНО ДОБАВЛЯЕМ CORS ЗАГОЛОВОК
    $response->headers->set('Access-Control-Allow-Origin', '*');
    
    return $response;
}

    #[Route('/genres', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function listGenres(): JsonResponse
    {
        $books = $this->genresRepository->findAll();
        return $this->json($books); // Фреймворк сам превратит массив SQL в красивый JSONшщ
    }

    #[Route('/authors', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function listAuthors(): JsonResponse
    {
        $books = $this->authorRepository->findAll();
        return $this->json($books); // Фреймворк сам превратит массив SQL в красивый JSONшщ
    }

    #[Route('/{id}', methods: ['GET'])]
    public function getBookById(int $id): JsonResponse
    {
        $book = $this->bookRepository->findById($id);
        
        if (!$book) {
            return $this->json(['error' => 'Книга не найдена'], 404);
        }

        return $this->json($book)->setEncodingOptions(JSON_UNESCAPED_UNICODE);
    }

    // ТЗ: "удаление книги - требует логин + роль админа"

    #[Route('/{id}', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')] // <-- Магия защиты!
    public function delete(int $id): JsonResponse
    {

        if (!$this->bookRepository->findById($id)) {
            return $this->json(['message' => 'Книга не найдена'], 404);
        }
        // Каскадное удаление (ON DELETE CASCADE) в твоей базе само удалит 
        // связи с авторами, жанрами и избранным. Нам нужно удалить только саму книгу!
        $this->bookRepository->delete($id);


        return $this->json(['message' => 'Книга удалена']);
    }

    // ТЗ: "получение информации по отдельной книге - не требует логина"
    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $book = $this->bookRepository->findById($id);
        
        if (!$book) {
            return $this->json(['error' => 'Книга не найдена'], 404);
        }

        return $this->json($book);
    }

    #[Route('/{id}/photo', methods: ['DELETE'])] 
    #[IsGranted('ROLE_ADMIN')] 
    public function deletePhoto(int $id, Request $request): JsonResponse
{
    // Так как это DELETE запрос, данные обычно передаются в JSON теле
    $data = json_decode($request->getContent(), true);
    $photoUrl = $data['url'] ?? null;

    if (!$photoUrl) {
        return $this->json(['error' => 'URL фото не передан'], 400);
    }

    // 1. Удаляем запись из базы данных
    $this->bookRepository->deletePhoto($id, $photoUrl);

    // 2. Удаляем файл физически с диска (чтобы не засорять сервер)
    $filePath = $this->getParameter('kernel.project_dir') . '/public' . $photoUrl;
    if (file_exists($filePath)) {
        unlink($filePath);
    }

    return $this->json(['message' => 'Фотография успешно удалена!']);
}

    #[Route('/{id}/photo', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function uploadPhoto(int $id, Request $request): JsonResponse
    {
        // Проверяем, существует ли вообще такая книга
        $book = $this->bookRepository->findById($id);
        if (!$book) {
            return $this->json(['error' => 'Книга не найдена'], 404);
        }

        // 1. Достаем файл по ключу 'photo'
        $file = $request->files->get('photo');

        if (!$file) {
            return $this->json(['error' => 'Пожалуйста, прикрепите файл'], 400);
        }

        // 2. Безопасность: проверяем расширение
        $extension = $file->guessExtension();
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

        if (!in_array($extension, $allowedExtensions)) {
            return $this->json([
                'error' => 'Недопустимый формат файла. Разрешены: ' . implode(', ', $allowedExtensions)
            ], 400);
        }

        // 3. Генерируем имя и определяем папку (сохраняем в отдельную папку books)
        $newFilename = uniqid('book_') . '.' . $extension;
        $destination = $this->getParameter('kernel.project_dir') . '/public/uploads/books';

        try {
            // ФИЗИЧЕСКИ перемещаем файл
            $file->move($destination, $newFilename);
            
            // Путь для сохранения в БД
            $publicUrl = '/uploads/books/' . $newFilename;

            // ЗДЕСЬ НУЖНО СОХРАНИТЬ В БАЗУ!
            // Если у тебя есть BookPhotoRepository, сделай так:
            $this->bookRepository->addPhoto($id, $publicUrl);

            return $this->json([
                'message' => 'Обложка успешно загружена!',
                'url' => $publicUrl
            ], 201);

        } catch (\Exception $e) {
            return $this->json(['error' => 'Ошибка: ' . $e->getMessage()], 500);
        }
    }

    // ТЗ: "добавление новой книги - требует логин + роль админа"
    #[Route('', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')] // <-- Магия защиты!
    public function create(Request $request): JsonResponse
{
    // Получаем JSON, который прислал клиент
    $data = json_decode($request->getContent(), true);

    if (empty($data['title'])) {
        return $this->json(['error' => 'Поле title обязательно'], 400);
    }

    // Извлекаем массивы строк (жанры) и объектов (авторы)
    // Обрати внимание: ключи теперь соответствуют новому формату
    $genreNames = $data['genreNames'] ?? [];
    $authors = $data['authors'] ?? [];

    // Защита "от дурака": проверяем, что нам прислали именно массивы
    if (!is_array($genreNames) || !is_array($authors)) {
        return $this->json(['error' => 'Поля genreNames и authors должны быть массивами'], 400);
    }

    try {
        // Передаем все 5 аргументов в наш обновленный транзакционный метод
        $newBookId = $this->bookRepository->create(
            $data['title'],
            $data['description'] ?? null,
            $data['published_year'] ?? null,
            $genreNames,
            $authors
        );

        return $this->json([
            'message' => 'Фолиант успешно добавлен со всеми связями!',
            'id' => $newBookId
        ], 201);

    } catch (\Exception $e) {
        // Так как мы теперь создаем связи "на лету", ошибка здесь означает 
        // реальную проблему с базой данных (например, отвалилось соединение или нарушена структура)
        return $this->json([
            'error' => 'Ошибка при сохранении фолианта в архивах.',
            // 'debug' => $e->getMessage() // Раскомментируй, чтобы видеть точную причину, если что-то сломается
        ], 500);
    }
    }    

    #[Route('/export/csv', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')] // <-- Только для админов!
    public function exportCsv(): Response
    {
        // 1. Получаем все книги из базы
        $books = $this->bookRepository->findAll();

        // 2. Открываем временный поток в памяти для записи CSV
        $fp = fopen('php://memory', 'w');

        // 3. Пишем заголовки колонок
        fputcsv($fp, ['ID', 'Название', 'Описание', 'Год издания', 'Дата добавления'], ';');

        // 4. Записываем каждую книгу как отдельную строку
        foreach ($books as $book) {
            $formattedDate = $book['created_at'] 
                ? date('Y-m-d', strtotime($book['created_at'])) 
                : 'Нет данных';
            fputcsv($fp, [
                $book['id'],
                $book['title'],
                $book['description'],
                $book['published_year'],
                $formattedDate
            ], ';'); // Используем точку с запятой, так как русскому Excel с ней проще
        }

        // 5. Читаем всё, что записали, в переменную
        rewind($fp);
        $csvContent = stream_get_contents($fp);
        fclose($fp);

        $csvContent = mb_convert_encoding($csvContent, 'Windows-1251', 'UTF-8');
        // 6. Формируем ответ, который заставит браузер (или Postman) скачать файл
        $response = new Response($csvContent);
        $response->headers->set('Content-Type', 'text/csv; charset=windows-1251');
        $response->headers->set('Content-Disposition', 'attachment; filename="books_export.csv"');

        return $response;
    }
    
    #[Route('/{id}/rating', methods: ['GET'])]
    public function getAverageRating(int $id): JsonResponse // Изменили float на JsonResponse
{
    $average = $this->reviewRepository->getAverageRatingForBook($id);
    
    $rating = $average !== null ? (float) $average : 0.0;

    // Оборачиваем цифру в правильный JSON-ответ
    return $this->json($rating); 
}

}