<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20231027000000 extends AbstractMigration // Имя класса оставь тем, которое сгенерировал Symfony!
{
    public function getDescription(): string
    {
        return 'Создание таблиц для фотографий книг и пользователей';
    }

    public function up(Schema $schema): void
    {
        // 1. Таблица для фото книг
        $this->addSql('CREATE TABLE book_photo (
            id BIGSERIAL PRIMARY KEY, 
            book_id BIGINT NOT NULL, 
            root VARCHAR(255) NOT NULL, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
            -- Каскадное удаление: удалили книгу -> удалились все её фотки
            CONSTRAINT fk_book_photo_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
        )');

        // 2. Таблица для фото пользователей (аватарки)
        $this->addSql('CREATE TABLE user_photo (
            id BIGSERIAL PRIMARY KEY, 
            user_id BIGINT NOT NULL, 
            root VARCHAR(255) NOT NULL, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
            -- Каскадное удаление: удалили юзера -> удалились его аватарки
            CONSTRAINT fk_user_photo_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )');
    }

    public function down(Schema $schema): void
    {
        // Откат миграции: удаляем таблицы в обратном порядке
        $this->addSql('DROP TABLE user_photo');
        $this->addSql('DROP TABLE book_photo');
    }
}
