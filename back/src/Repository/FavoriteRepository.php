<?php

namespace App\Repository;

use Doctrine\DBAL\Connection;

class FavoriteRepository
{
    public function __construct(
        private Connection $connection
    ) {}

    public function getUserFavorites(int $userId): array
    {
        // Начинаем с user_favorites, чтобы сразу отфильтровать по юзеру,
        // затем присоединяем книги и их жанры.
        $sql = '
            SELECT 
                b.id, 
                b.title, 
                bp.root AS photo,
                b.published_year,
                b.description,
                -- Снова используем DISTINCT, чтобы избежать дублей
                JSON_AGG(DISTINCT g.name) AS genres
            FROM user_favorites uf
            JOIN books b ON uf.book_id = b.id
            LEFT JOIN book_genre bg ON b.id = bg.book_id
            LEFT JOIN genres g ON bg.genre_id = g.id
            LEFT JOIN book_photo bp ON b.id = bp.book_id
            WHERE uf.user_id = :user_id
            GROUP BY b.id, b.title, b.published_year, b.description, bp.root 
            ORDER BY b.id DESC
        ';

        // Забираем все строки из базы
        $favorites = $this->connection->fetchAllAssociative($sql, [
            'user_id' => $userId
        ]);

        // Обрабатываем каждую книгу, чтобы превратить строку JSON обратно в массив PHP
        foreach ($favorites as &$book) {
            $book['genres'] = json_decode($book['genres'], true);
            
            // Если у книги нет жанров, PostgreSQL вернет [null], заменяем на пустой массив
            if ($book['genres'] === [null]) {
                $book['genres'] = [];
            }
        }

        return $favorites;
    }

    // Добавление в избранное
    public function add(int $userId, int $bookId): bool
    {
        // Сначала проверим, нет ли уже этой книги в избранном у этого юзера
        // (чтобы база не выдала ошибку дубликата первичного ключа)
        $checkSql = 'SELECT 1 FROM user_favorites WHERE user_id = :user_id AND book_id = :book_id';
        $exists = $this->connection->fetchOne($checkSql, [
            'user_id' => $userId,
            'book_id' => $bookId
        ]);

        if ($exists) {
            return false; // Уже в избранном
        }

        // Если нет, добавляем
        $sql = 'INSERT INTO user_favorites (user_id, book_id) VALUES (:user_id, :book_id)';
        $this->connection->executeStatement($sql, [
            'user_id' => $userId,
            'book_id' => $bookId
        ]);

        return true;
    }

    // Удаление из избранного
    public function remove(int $userId, int $bookId): bool
    {
        $sql = 'DELETE FROM user_favorites WHERE user_id = :user_id AND book_id = :book_id';
        // executeStatement возвращает количество затронутых строк
        $deletedRows = $this->connection->executeStatement($sql, [
            'user_id' => $userId,
            'book_id' => $bookId
        ]);

        return $deletedRows > 0; // Вернет true, если запись реально была удалена
    }
}