<?php

namespace App\Repository;

use Doctrine\DBAL\Connection;

class ReviewRepository
{
    public function __construct(
        private Connection $connection
    ) {}

    public function addReview(int $bookId, int $userId, int $rating, ?string $comment): void
    {
        $sql = 'INSERT INTO reviews (book_id, user_id, rating, comment) VALUES (:book_id, :user_id, :rating, :comment)';
        
        $this->connection->executeStatement($sql, [
            'book_id' => $bookId,
            'user_id' => $userId,
            'rating'  => $rating,
            'comment' => $comment
        ]);
    }

    public function getReviewsForBook(int $bookId): array
    {
        $sql = 'SELECT r.id, u.username, up.root, r.rating, r.comment, r.created_at, u.email AS user_email 
                FROM reviews r 
                JOIN users u ON r.user_id = u.id 
                LEFT JOIN user_photo up ON u.id = up.user_id 
                WHERE r.book_id = :book_id 
                ORDER BY r.created_at DESC';
        
        return $this->connection->fetchAllAssociative($sql, ['book_id' => $bookId]);
    }

    public function getAverageRatingForBook(int $bookId): ?float
    {
        $sql = 'SELECT AVG(rating) FROM reviews WHERE book_id = :book_id';
        $average = $this->connection->fetchOne($sql, ['book_id' => $bookId]);
        
        return $average !== null ? (float) $average : null;
    }

    public function deleteReview(int $reviewId, int $userId): bool
    {
        // Сначала проверим, что этот отзыв принадлежит этому юзеру
        $checkSql = 'SELECT 1 FROM reviews WHERE id = :review_id AND user_id = :user_id';
        $exists = $this->connection->fetchOne($checkSql, [
            'review_id' => $reviewId,
            'user_id' => $userId
        ]);

        if (!$exists) {
            return false; // Отзыв не найден или не принадлежит этому юзеру
        }

        // Удаляем отзыв
        $deleteSql = 'DELETE FROM reviews WHERE id = :review_id';
        $this->connection->executeStatement($deleteSql, ['review_id' => $reviewId]);

        return true;
        }
}   

?>
