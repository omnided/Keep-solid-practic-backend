<?php

namespace App\Repository;

use Doctrine\DBAL\Connection;

class UserRepository
{
    public function __construct(
        private Connection $connection
    ) {}

    // Проверяем, существует ли уже такой email
    public function emailExists(string $email): bool
    {
        $sql = 'SELECT 1 FROM users WHERE email = :email';
        return (bool) $this->connection->fetchOne($sql, ['email' => $email]);
    }

    public function nameExists(string $username): bool
    {
        $sql = 'SELECT 1 FROM users WHERE username = :username';
        return (bool) $this->connection->fetchOne($sql, ['username' => $username]);
    }

    public function addPhoto(int $userId, string $publicUrl): void
    {
        $sql = 'INSERT INTO user_photo (user_id, root) VALUES (:user_id, :root)';
        $this->connection->executeStatement($sql, [
            'user_id' => $userId,
            'root' => $publicUrl
        ]);
    }

    public function getUserIdentifier(int $userName): ?int
    {
        $sql = 'SELECT id FROM users WHERE username = :username';
        $result = $this->connection->fetchAssociative($sql, ['username' => $userName]);
        
        return $result ?: null; // Вернем null, если пользователь не найден
    }

    public function getUserInfo(int $userId): ?array
{
    // Используем LEFT JOIN для фото, чтобы юзер не пропадал, если у него нет аватара
    $sql = '
        SELECT u.username, u.email, up.root as photo, r.name as role
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_photo up ON u.id = up.user_id
        WHERE u.id = :user_id
    ';
    
    // fetchAssociative вернет массив ['username' => '...', 'email' => '...', ...]
    $result = $this->connection->fetchAssociative($sql, ['user_id' => $userId]);
    
    if (!$result) {
        return null; // Вот теперь это реальный 404
    }

    return $result;
}

    // Достаем ID роли клиента из таблицы roles (по умолчанию все новые юзеры — клиенты)
    public function getClientRoleId(): ?int
    {
        $sql = 'SELECT id FROM roles WHERE name = :name';
        $result = $this->connection->fetchOne($sql, ['name' => 'client']);
        
        return $result ? (int) $result : null;
    }

    // Сохраняем пользователя и возвращаем его новый ID
    public function create(string $username, string $email, string $passwordHash): int
    {
        $sql = '
            INSERT INTO users (username, email, password_hash, role_id) 
            VALUES (:username, :email, :hash, 2) 
            RETURNING id
        ';
        
        return (int) $this->connection->fetchOne($sql, [
            'username' => $username,
            'email' => $email,
            'hash' => $passwordHash
        ]);
    }
}