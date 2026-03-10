<?php

namespace App\Command;

use Doctrine\DBAL\Connection;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:change-role',
    description: 'Изменяет роль пользователя по его email',
)]
class ChangeUserRoleCommand extends Command
{
    public function __construct(
        private Connection $connection
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::REQUIRED, 'Email пользователя')
            ->addArgument('role', InputArgument::REQUIRED, 'Новая роль (например: admin, client)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $email = $input->getArgument('email');
        $roleName = strtolower($input->getArgument('role'));

        $roleId = $this->connection->fetchOne(
            'SELECT id FROM roles WHERE name = :name',
            ['name' => $roleName]
        );

        if (!$roleId) {
            $io->error(sprintf('Роль "%s" не найдена в базе данных.', $roleName));
            return Command::FAILURE;
        }

        $userId = $this->connection->fetchOne(
            'SELECT id FROM users WHERE email = :email',
            ['email' => $email]
        );

        if (!$userId) {
            $io->error(sprintf('Пользователь с email "%s" не найден.', $email));
            return Command::FAILURE;
        }

        $this->connection->executeStatement(
            'UPDATE users SET role_id = :role_id WHERE id = :id',
            [
                'role_id' => $roleId,
                'id' => $userId
            ]
        );
        $io->success(sprintf('Роль пользователя %s успешно изменена на %s!', $email, $roleName));

        return Command::SUCCESS;
    }
}