<?php

namespace App\Repository;

use Doctrine\DBAL\Connection;

class AuthorRepository
{
    public function __construct(
        private Connection $connection // Подключаем DBAL
    ) {}

    // 1. Получить все книги (для всех)
    public function findAll(): array
    {        $sql = '
        SELECT 
            id, 
            first_name, 
            last_name,
        FROM authors 
        ';
        $items = $this->connection->fetchAllAssociative($sql);
        return $items;
    }
}

?>
        