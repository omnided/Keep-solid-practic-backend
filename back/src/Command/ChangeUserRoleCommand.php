<?php

namespace App\Command;

use Doctrine\DBAL\Connection;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

// Этот атрибут регистрирует команду и задает её имя в консоли
#[AsCommand(
    name: 'app:change-role',
    description: 'Изменяет роль пользователя по его email',
)]
class ChangeUserRoleCommand extends Command
{
    public function __construct(
        private Connection $connection // Подключаем наш любимый DBAL
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        // Задаем аргументы, которые команда будет ждать от пользователя
        $this
            ->addArgument('email', InputArgument::REQUIRED, 'Email пользователя')
            ->addArgument('role', InputArgument::REQUIRED, 'Новая роль (например: admin, client)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        // Удобная обертка для красивого вывода в консоль
        $io = new SymfonyStyle($input, $output);

        $email = $input->getArgument('email');
        $roleName = strtolower($input->getArgument('role')); // Приводим к нижнему регистру для надежности

        // 1. Ищем ID новой роли в таблице roles
        $roleId = $this->connection->fetchOne(
            'SELECT id FROM roles WHERE name = :name',
            ['name' => $roleName]
        );

        if (!$roleId) {
            $io->error(sprintf('Роль "%s" не найдена в базе данных.', $roleName));
            return Command::FAILURE; // Возвращаем код ошибки
        }

        // 2. Проверяем, существует ли пользователь с таким email
        $userId = $this->connection->fetchOne(
            'SELECT id FROM users WHERE email = :email',
            ['email' => $email]
        );

        if (!$userId) {
            $io->error(sprintf('Пользователь с email "%s" не найден.', $email));
            return Command::FAILURE;
        }

        // 3. Обновляем role_id у пользователя
        $this->connection->executeStatement(
            'UPDATE users SET role_id = :role_id WHERE id = :id',
            [
                'role_id' => $roleId,
                'id' => $userId
            ]
        );

        // Выводим красивое зеленое сообщение об успехе
        $io->success(sprintf('Роль пользователя %s успешно изменена на %s!', $email, $roleName));

        return Command::SUCCESS; // Возвращаем код успешного завершения
    }
}