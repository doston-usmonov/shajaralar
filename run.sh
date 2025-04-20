#!/bin/bash

# Shajara platformasi uchun ishga tushirish skripti

echo "🧾 Shajara platformasini ishga tushirish..."

# Ranglar
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ "$1" == "backend" ]; then
    echo -e "${BLUE}Backend serverni ishga tushirish...${NC}"
    cd backend
    php artisan serve --port=8000
elif [ "$1" == "frontend" ]; then
    echo -e "${BLUE}Frontend serverni ishga tushirish...${NC}"
    cd frontend
    npm start
elif [ "$1" == "setup" ]; then
    echo -e "${BLUE}Proyektni sozlash...${NC}"
    
    # Backend sozlash
    echo -e "${GREEN}Backend sozlamalari...${NC}"
    cd backend
    
    echo "Composer paketlarini o'rnatish..."
    composer install
    
    echo ".env faylini yaratish..."
    if [ ! -f .env ]; then
        cp .env.example .env
        php artisan key:generate
        
        # PostgreSQL ma'lumotlar bazasi sozlamalari
        echo "Ma'lumotlar bazasi sozlamalarini kiriting:"
        read -p "PostgreSQL host (default: localhost): " db_host
        db_host=${db_host:-localhost}
        
        read -p "PostgreSQL port (default: 5432): " db_port
        db_port=${db_port:-5432}
        
        read -p "PostgreSQL database nomi (default: shajara): " db_name
        db_name=${db_name:-shajara}
        
        read -p "PostgreSQL foydalanuvchi nomi: " db_user
        
        read -sp "PostgreSQL paroli: " db_password
        echo
        
        # .env faylini yangilash
        sed -i "s/DB_CONNECTION=mysql/DB_CONNECTION=pgsql/g" .env
        sed -i "s/DB_HOST=127.0.0.1/DB_HOST=$db_host/g" .env
        sed -i "s/DB_PORT=3306/DB_PORT=$db_port/g" .env
        sed -i "s/DB_DATABASE=laravel/DB_DATABASE=$db_name/g" .env
        sed -i "s/DB_USERNAME=root/DB_USERNAME=$db_user/g" .env
        sed -i "s/DB_PASSWORD=/DB_PASSWORD=$db_password/g" .env
    fi
    
    echo "Migratsiyalarni ishga tushirish..."
    php artisan migrate
    
    # Frontend sozlash
    echo -e "${GREEN}Frontend sozlamalari...${NC}"
    cd ../frontend
    
    echo "NPM paketlarini o'rnatish..."
    npm install
    
    echo -e "${GREEN}Sozlash tugadi! Quyidagi buyruqlar bilan ishga tushirishingiz mumkin:${NC}"
    echo "./run.sh backend  # Backend serverni ishga tushirish"
    echo "./run.sh frontend # Frontend serverni ishga tushirish"
    
else
    echo -e "${RED}Xato: buyruq ko'rsatilmagan${NC}"
    echo "Foydalanish:"
    echo "./run.sh backend  # Backend serverni ishga tushirish"
    echo "./run.sh frontend # Frontend serverni ishga tushirish"
    echo "./run.sh setup    # Proyektni sozlash"
fi
