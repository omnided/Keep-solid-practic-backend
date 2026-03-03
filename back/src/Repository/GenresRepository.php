<?php

namespace App\Repository;

use Doctrine\DBAL\Connection;

class GenresRepository
{
    public function __construct(
        private Connection $connection // Подключаем DBAL
    ) {}

    // 1. Получить все книги (для всех)
    public function findAll(): array
    {        $sql = '
        SELECT 
            id, 
            name
        FROM genres 
        ';
        $items = $this->connection->fetchAllAssociative($sql);
        return $items;
    }
}

?>