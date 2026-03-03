<?php

namespace App\Security;

use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;
use Doctrine\DBAL\Connection;

class DatabaseUserProvider implements UserProviderInterface
{
    public function __construct(
        private Connection $connection
    ) {}

    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        // Ищем строго по email, так как мы настроили user_id_claim: email
        $sql = '
            SELECT u.id, u.username, u.email, u.password_hash, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.email = :email
        ';

        $userData = $this->connection->fetchAssociative($sql, [
            'email' => $identifier
        ]);

        if (!$userData) {
            throw new UserNotFoundException('User not found.');
        }

        $roles = [];
        if ($userData['role_name']) {
            $roles[] = 'ROLE_' . strtoupper($userData['role_name']);
        }

        // ПРОВЕРЬ ПОРЯДОК: id, username, email, passwordHash, roles
        return new User(
            (int) $userData['id'],
            (string) $userData['username'],
            (string) $userData['email'],
            (string) $userData['password_hash'],
            $roles
        );
    }

    public function refreshUser(UserInterface $user): UserInterface
    {
        return $this->loadUserByIdentifier($user->getUserIdentifier());
    }

    public function supportsClass(string $class): bool
    {
        return User::class === $class;
    }
}