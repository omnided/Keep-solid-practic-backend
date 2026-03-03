<?php

namespace App\Repository;

use Doctrine\DBAL\Connection;

class BookRepository
{
    public function __construct(
        private Connection $connection // Подключаем DBAL
    ) {}

    // 1. Получить все книги (для всех)
    public function findAll(): array
    {
        $sql = '
        SELECT
            b.id, 
            JSON_AGG(DISTINCT bp.root) AS photo,
            b.title, 
            b.published_year,
            b.description,
            b.created_at,
            -- Вся магия здесь: сворачиваем названия жанров в JSON-массив
            JSON_AGG(DISTINCT g.name) AS genres
        FROM books b
        LEFT JOIN book_genre bg ON b.id = bg.book_id
        LEFT JOIN genres g ON bg.genre_id = g.id
        LEFT JOIN book_photo bp ON b.id = bp.book_id
        GROUP BY b.id, b.title, b.published_year, b.description, b.created_at -- Обязательно группируем по всем колонкам книги
        ORDER BY b.id DESC
    ';

    // Выполняем запрос
    $items = $this->connection->fetchAllAssociative($sql);

    // Небольшая обработка результата для красивого JSON
    $items = $this->connection->fetchAllAssociative($sql);

    // Безопасная обработка результата
    foreach ($items as &$item) {
        // Если пришел null из БД, сразу ставим пустой массив [], иначе декодируем
        $photo = $item['photo'] ? json_decode($item['photo'], true) : [];
        $genres = $item['genres'] ? json_decode($item['genres'], true) : [];
        
        // Очищаем от [null]
        $item['photo'] = ($photo === [null]) ? [] : $photo;
        $item['genres'] = ($genres === [null]) ? [] : $genres;
    }

    return $items;
}

    public function addPhoto(int $id, string $publicUrl): void
    {
        $sql = 'INSERT INTO book_photo (book_id, root) VALUES (:book_id, :publicUrl)';
        $this->connection->executeStatement($sql, [
            'publicUrl' => $publicUrl,
            'book_id' => $id
        ]); 
    }

    public function deletePhoto(int $id, string $publicUrl): void
    {
        $sql = 'DELETE FROM book_photo WHERE book_id = :book_id AND root = :publicUrl';
        $this->connection->executeStatement($sql, [
            'publicUrl' => $publicUrl,
            'book_id' => $id
        ]);
    }

    public function uploadPhoto(int $id, string $publicUrl): void
    {
        $sql = 'UPDATE book_photo SET root = :publicUrl WHERE book_id = :book_id';
        $this->connection->executeStatement($sql, [
            'publicUrl' => $publicUrl,
            'book_id' => $id
        ]); 
    }

    // 2. Получить одну книгу (для всех)
    public function findById(int $id): ?array
    {
        $sql = '
            SELECT 
                b.id, 
                b.title, 
                JSON_AGG(DISTINCT bp.root) AS photo,
                b.published_year,
                b.description,
                -- Добавляем DISTINCT, чтобы избежать дубликатов при перемножении JOIN-ов
                JSON_AGG(DISTINCT g.name) AS genres,
                JSON_AGG(DISTINCT a.first_name || \' \' || a.last_name) AS authors
            FROM books b
            LEFT JOIN book_genre bg ON b.id = bg.book_id
            LEFT JOIN genres g ON bg.genre_id = g.id
            LEFT JOIN book_author ba ON b.id = ba.book_id
            LEFT JOIN book_photo bp ON b.id = bp.book_id
            LEFT JOIN authors a ON ba.author_id = a.id
            WHERE b.id = :id
            GROUP BY b.id, b.title, b.published_year, b.description
        ';
        
        // Получаем одну строку из БД
        $book = $this->connection->fetchAssociative($sql, ['id' => $id]);
        
        // Если книга не найдена, сразу возвращаем null
        if (!$book) {
            return null;
        }

        // Превращаем JSON-строки от PostgreSQL в настоящие массивы PHP
        $book['photo'] = json_decode($book['photo'], true);
        $book['genres'] = json_decode($book['genres'], true);
        $book['authors'] = json_decode($book['authors'], true);

        // Очищаем от [null], если у книги еще нет жанров или авторов
        if ($book['photo'] === [null]) $book['photo'] = [];
        if ($book['genres'] === [null]) $book['genres'] = [];
        if ($book['authors'] === [null]) $book['authors'] = [];

        return $book;
    }

    // 3. Добавить книгу (только Админ)
    public function create(
        string $title, 
        ?string $description, 
        ?int $year, 
        array $genreNames = [], // Принимаем массив строк: ['Фантастика', 'Драма']
        array $authors = []     // Принимаем массив массивов: [['first_name' => '...', 'last_name' => '...']]
    ): int {
        // 1. Открываем транзакцию
        $this->connection->beginTransaction();

        try {
            // Шаг 1: Создаем саму книгу и получаем её ID
            $sqlBook = '
                INSERT INTO books (title, description, published_year) 
                VALUES (:title, :description, :year) 
                RETURNING id
            ';
            
            $bookId = $this->connection->fetchOne($sqlBook, [
                'title' => $title,
                'description' => $description,
                'year' => $year
            ]);

            // Шаг 2: Привязываем (или создаем) ЖАНРЫ
            if (!empty($genreNames)) {
                $sqlFindGenre = 'SELECT id FROM genres WHERE name = :name';
                $sqlInsertGenre = 'INSERT INTO genres (name) VALUES (:name) RETURNING id';
                $sqlLinkGenre = 'INSERT INTO book_genre (book_id, genre_id) VALUES (:book_id, :genre_id)';

                foreach ($genreNames as $genreName) {
                    $name = trim($genreName);
                    if (empty($name)) continue; // Защита от пустых строк

                    // Ищем жанр в БД
                    $genreId = $this->connection->fetchOne($sqlFindGenre, ['name' => $name]);

                    // Если не нашли — создаем новый
                    if (!$genreId) {
                        $genreId = $this->connection->fetchOne($sqlInsertGenre, ['name' => $name]);
                    }

                    // Привязываем к книге
                    $this->connection->executeStatement($sqlLinkGenre, [
                        'book_id' => $bookId,
                        'genre_id' => $genreId
                    ]);
                }
            }

            // Шаг 3: Привязываем (или создаем) АВТОРОВ
            if (!empty($authors)) {
                $sqlFindAuthor = 'SELECT id FROM authors WHERE first_name = :first_name AND last_name = :last_name';
                $sqlInsertAuthor = 'INSERT INTO authors (first_name, last_name) VALUES (:first_name, :last_name) RETURNING id';
                $sqlLinkAuthor = 'INSERT INTO book_author (book_id, author_id) VALUES (:book_id, :author_id)';

                foreach ($authors as $authorData) {
                    $firstName = trim($authorData['first_name'] ?? '');
                    $lastName = trim($authorData['last_name'] ?? '');
                    
                    if (empty($firstName) && empty($lastName)) continue; // Пропускаем пустых

                    // Ищем автора в БД
                    $authorId = $this->connection->fetchOne($sqlFindAuthor, [
                        'first_name' => $firstName,
                        'last_name' => $lastName
                    ]);

                    // Если не нашли — создаем нового
                    if (!$authorId) {
                        $authorId = $this->connection->fetchOne($sqlInsertAuthor, [
                            'first_name' => $firstName,
                            'last_name' => $lastName
                        ]);
                    }

                    // Привязываем к книге
                    $this->connection->executeStatement($sqlLinkAuthor, [
                        'book_id' => $bookId,
                        'author_id' => $authorId
                    ]);
                }
            }

            // 2. Всё прошло успешно! Сохраняем.
            $this->connection->commit();

            return $bookId;

        } catch (\Exception $e) {
            // 3. Откат в случае любой ошибки
            $this->connection->rollBack();
            throw $e; 
        }
    }
}