# =========================================================================
# GRM WHATSAPP CRM — DOCKERFILE FOR PHP 8.2 & APACHE WEB APPLICATION
# =========================================================================

FROM php:8.2-apache

# Install system dependencies & PHP build libraries
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    curl \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd zip \
    && a2enmod rewrite headers deflate expires \
    && rm -rf /var/lib/apt/lists/*

# Set Apache Document Root
WORKDIR /var/www/html

# Copy project files
COPY . /var/www/html/

# Ensure runtime directories exist and have proper permissions
RUN mkdir -p /var/www/html/uploads/products /var/www/html/logs \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 777 /var/www/html/uploads /var/www/html/logs \
    && touch /var/www/html/live_messages_queue.json /var/www/html/whatsapp_account_config.json \
    && chmod 666 /var/www/html/live_messages_queue.json /var/www/html/whatsapp_account_config.json

EXPOSE 80

CMD ["apache2-foreground"]
