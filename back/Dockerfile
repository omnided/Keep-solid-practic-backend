FROM php:8.2-fpm

# Устанавливаем системные зависимости и драйверы для PostgreSQL
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

# Копируем Composer из официального образа
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Указываем рабочую папку внутри контейнера
WORKDIR /var/www/html

# Даем права (полезно для фреймворков)
RUN chown -R www-data:www-data /var/www/html