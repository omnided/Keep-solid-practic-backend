<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20231025000000 extends AbstractMigration // Имя класса оставь свое, сгенерированное Symfony
{
    public function getDescription(): string
    {
        return 'Создание структуры БД библиотеки и заполнение стартовыми данными';
    }

    public function up(Schema $schema): void
    {
        // ==========================================
        // 1. СОЗДАНИЕ ТАБЛИЦ (от независимых к зависимым)
        // ==========================================
        
        $this->addSql('CREATE TABLE roles (id SERIAL PRIMARY KEY, name VARCHAR(50) UNIQUE NOT NULL)');
        
        $this->addSql('CREATE TABLE users (id BIGSERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, email VARCHAR(180) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, role_id INT NOT NULL, CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT)');
        
        $this->addSql('CREATE TABLE books (id BIGSERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, published_year INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
        
        $this->addSql('CREATE TABLE genres (id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL)');
        
        $this->addSql('CREATE TABLE authors (id BIGSERIAL PRIMARY KEY, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL)');

        $this->addSql('CREATE TABLE user_favorites (user_id BIGINT NOT NULL, book_id BIGINT NOT NULL, added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, book_id), CONSTRAINT fk_fav_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE, CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE)');
        
        $this->addSql('CREATE TABLE reviews (id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL, book_id BIGINT NOT NULL, rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5), comment TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE, CONSTRAINT fk_review_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE)');

        $this->addSql('CREATE TABLE book_genre (book_id BIGINT NOT NULL, genre_id INT NOT NULL, PRIMARY KEY (book_id, genre_id), CONSTRAINT fk_bg_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE, CONSTRAINT fk_bg_genre FOREIGN KEY (genre_id) REFERENCES genres (id) ON DELETE CASCADE)');

        $this->addSql('CREATE TABLE book_author (book_id BIGINT NOT NULL, author_id BIGINT NOT NULL, PRIMARY KEY (book_id, author_id), CONSTRAINT fk_ba_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE, CONSTRAINT fk_ba_author FOREIGN KEY (author_id) REFERENCES authors (id) ON DELETE CASCADE)');

        // ==========================================
        // 2. ЗАПОЛНЕНИЕ ДАННЫМИ (минимум по 3 сущности)
        // ==========================================

        // Добавляем роли
        $this->addSql("INSERT INTO roles (name) VALUES ('admin'), ('client')");

        // Добавляем 3 пользователей (пароли захешированы для слова 'password')
        $passHash = password_hash('123', PASSWORD_BCRYPT);

        // Добавляем 3 пользователей с этим хэшем
        $this->addSql("INSERT INTO users (username, email, password_hash, role_id) VALUES 
            ('admin1', 'admin@lib.com', '{$passHash}', 1),
            ('client1', 'client1@lib.com', '{$passHash}', 2),
            ('client2', 'client2@lib.com', '{$passHash}', 2)
        ");

        // Добавляем 3 книги
        $this->addSql("INSERT INTO books (title, description, published_year) VALUES 
            ('1984', 'Культовая антиутопия Джорджа Оруэлла', 1949),
            ('Гарри Поттер и философский камень', 'Начало великой истории о мальчике-волшебнике', 1997),
            ('Чистая архитектура', 'Руководство для разработчиков от Дяди Боба', 2017)
        ");

        // Добавляем 3 жанра
        $this->addSql("INSERT INTO genres (name) VALUES ('Антиутопия'), ('Фэнтези'), ('Обучающая ИТ-литература')");

        // Добавляем 3 авторов
        $this->addSql("INSERT INTO authors (first_name, last_name) VALUES ('Джордж', 'Оруэлл'), ('Джоан', 'Роулинг'), ('Роберт', 'Мартин')");

        // Связываем книги с авторами (book_id, author_id)
        $this->addSql("INSERT INTO book_author (book_id, author_id) VALUES (1, 1), (2, 2), (3, 3)");

        // Связываем книги с жанрами (book_id, genre_id)
        $this->addSql("INSERT INTO book_genre (book_id, genre_id) VALUES (1, 1), (2, 2), (3, 3)");

        // Добавляем 3 отзыва от разных пользователей
        $this->addSql("INSERT INTO reviews (user_id, book_id, rating, comment) VALUES 
            (2, 1, 5, 'Шедевр, заставляет задуматься о многом.'),
            (3, 2, 4, 'Отличная сказка, но фильм мне понравился больше.'),
            (1, 3, 5, 'Обязательно к прочтению всем бэкенд-разработчикам!')
        ");

        // Добавляем 3 записи в избранное
        $this->addSql("INSERT INTO user_favorites (user_id, book_id) VALUES (2, 1), (2, 2), (3, 3)");
    }

    public function down(Schema $schema): void
    {
        // При откате миграции удаляем таблицы строго в обратном порядке (сначала зависимые)
        $this->addSql('DROP TABLE book_author');
        $this->addSql('DROP TABLE book_genre');
        $this->addSql('DROP TABLE reviews');
        $this->addSql('DROP TABLE user_favorites');
        $this->addSql('DROP TABLE authors');
        $this->addSql('DROP TABLE genres');
        $this->addSql('DROP TABLE books');
        $this->addSql('DROP TABLE users');
        $this->addSql('DROP TABLE roles');
    }
}
