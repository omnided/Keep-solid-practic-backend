<?php

namespace App\Repository;

use Doctrine\DBAL\Connection;

class BookRepository
{
    public function __construct(
        private Connection $connection 
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

    $items = $this->connection->fetchAllAssociative($sql);

    $items = $this->connection->fetchAllAssociative($sql);

    foreach ($items as &$item) {
        $photo = $item['photo'] ? json_decode($item['photo'], true) : [];
        $genres = $item['genres'] ? json_decode($item['genres'], true) : [];
        
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
        
        $book = $this->connection->fetchAssociative($sql, ['id' => $id]);
        
        if (!$book) {
            return null;
        }

        $book['photo'] = json_decode($book['photo'], true);
        $book['genres'] = json_decode($book['genres'], true);
        $book['authors'] = json_decode($book['authors'], true);

        if ($book['photo'] === [null]) $book['photo'] = [];
        if ($book['genres'] === [null]) $book['genres'] = [];
        if ($book['authors'] === [null]) $book['authors'] = [];

        return $book;
    }

    public function delete(int $id): void
    {
        $sql = 'DELETE FROM books WHERE id = :id';
        $this->connection->executeStatement($sql, ['id' => $id]);
    }

    // 3. Добавить книгу (только Админ)
    public function create(
        string $title, 
        ?string $description, 
        ?int $year, 
        array $genreNames = [],
        array $authors = [] 
    ): int {
        $this->connection->beginTransaction();

        try {
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

            if (!empty($genreNames)) {
                $sqlFindGenre = 'SELECT id FROM genres WHERE name = :name';
                $sqlInsertGenre = 'INSERT INTO genres (name) VALUES (:name) RETURNING id';
                $sqlLinkGenre = 'INSERT INTO book_genre (book_id, genre_id) VALUES (:book_id, :genre_id)';

                foreach ($genreNames as $genreName) {
                    $name = trim($genreName);
                    if (empty($name)) continue; 

                    $genreId = $this->connection->fetchOne($sqlFindGenre, ['name' => $name]);

                    if (!$genreId) {
                        $genreId = $this->connection->fetchOne($sqlInsertGenre, ['name' => $name]);
                    }

                    $this->connection->executeStatement($sqlLinkGenre, [
                        'book_id' => $bookId,
                        'genre_id' => $genreId
                    ]);
                }
            }

            if (!empty($authors)) {
                $sqlFindAuthor = 'SELECT id FROM authors WHERE first_name = :first_name AND last_name = :last_name';
                $sqlInsertAuthor = 'INSERT INTO authors (first_name, last_name) VALUES (:first_name, :last_name) RETURNING id';
                $sqlLinkAuthor = 'INSERT INTO book_author (book_id, author_id) VALUES (:book_id, :author_id)';

                foreach ($authors as $authorData) {
                    $firstName = trim($authorData['first_name'] ?? '');
                    $lastName = trim($authorData['last_name'] ?? '');
                    
                    if (empty($firstName) && empty($lastName)) continue; 

                    $authorId = $this->connection->fetchOne($sqlFindAuthor, [
                        'first_name' => $firstName,
                        'last_name' => $lastName
                    ]);

                    if (!$authorId) {
                        $authorId = $this->connection->fetchOne($sqlInsertAuthor, [
                            'first_name' => $firstName,
                            'last_name' => $lastName
                        ]);
                    }

                    $this->connection->executeStatement($sqlLinkAuthor, [
                        'book_id' => $bookId,
                        'author_id' => $authorId
                    ]);
                }
            }

            $this->connection->commit();

            return $bookId;

        } catch (\Exception $e) {
            $this->connection->rollBack();
            throw $e; 
        }
    }
}