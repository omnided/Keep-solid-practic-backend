<?php

namespace App\Security;

use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    public function __construct(
        private int $id,
        private string $username,
        private string $email,
        private string $passwordHash,
        private array $roles = []
    ) {}

    public function getId(): int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->username;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    public function getPassword(): string
    {
        // Symfony ожидает метод getPassword, мы отдаем ему твой хэш
        return $this->passwordHash;
    }

    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER'; // Базовая роль для всех
        return array_unique($roles);
    }

    public function eraseCredentials(): void
    {
    }
}