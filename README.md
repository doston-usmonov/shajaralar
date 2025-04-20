# Shajara - Avlodlar Daraxti (Family Tree Platform)

Shajara platformasi foydalanuvchilarga o'z avlod daraxtlarini yaratish, ko'rish va boshqarish imkonini beruvchi veb-ilova.

## Loyiha haqida

Foydalanuvchilar o'z avlod daraxtlarini ko'rish, o'z biografiyasi va avlodlarini kiritish imkoniga ega bo'ladigan, zamonaviy va intuitiv interfeysga ega veb platforma.

### Asosiy funksiyalar

- Foydalanuvchi profili (ro'yxatdan o'tish, kirish)
- Profil ma'lumotlarini ko'rish va tahrirlash
- Avlodlar daraxtini vizualizatsiya qilish
- Har bir shaxs uchun to'liq ma'lumotlar (ism, tug'ilgan sana, vafot etgan sana, biografiya, rasm)
- Avlodlar daraxtiga yangi a'zolar qo'shish
- Responsive dizayn (kompyuter, planshet va mobil)
- Interaktiv shajara daraxtini to'liq ekranda ko'rish
- Daraxtni qayta joylashtirib ko'rish (yangi ildiz tanlash)
- Daraxt tarmoqlarini yoyish/yig'ish

## Texnologiyalar

### Backend
- Laravel 12
- PostgreSQL
- JWT autentifikatsiya (Laravel Sanctum)
- Eloquent ORM
- RESTful API endpointlar

### Frontend
- React 18
- React Router 6
- Tailwind CSS
- D3.js (avlodlar daraxtini vizualizatsiya qilish uchun)
- Axios (API so'rovlari uchun)

## Tizim arxitekturasi

### Ma'lumotlar bazasi modeli

**Jadvallar**:
- `users` - tizim foydalanuvchilari
- `people` - oila a'zolari ma'lumotlari
- `relations` - oila a'zolari orasidagi aloqalar

**Asosiy munosabatlar**:
- 1 foydalanuvchi → ko'p oila a'zolari
- 1 oila a'zosi → ko'p aloqalar (ota-ona/farzand)

### API endpointlar

| Endpoint | Method | Tavsif |
|----------|--------|--------|
| `/api/register` | POST | Yangi foydalanuvchini ro'yxatdan o'tkazish |
| `/api/login` | POST | Tizimga kirish va JWT token olish |
| `/api/user` | GET | Joriy foydalanuvchi ma'lumotlarini olish |
| `/api/people` | GET | Barcha oila a'zolarini olish |
| `/api/people` | POST | Yangi oila a'zosini qo'shish |
| `/api/people/{id}` | GET | Bitta oila a'zosi ma'lumotlarini olish |
| `/api/people/{id}` | PUT | Oila a'zosi ma'lumotlarini yangilash |
| `/api/people/{id}` | DELETE | Oila a'zosini o'chirish |
| `/api/people/{id}/tree` | GET | Oila a'zosining to'liq daraxt strukturasini olish |
| `/api/people/{id}/children` | GET | Oila a'zosining farzandlarini olish |
| `/api/people/{id}/children` | POST | Oila a'zosiga yangi farzand qo'shish |
| `/api/relations` | GET/POST | Aloqalarni boshqarish |

## O'rnatish va ishga tushirish

### Talablar
- PHP 8.1+
- Composer 2.0+
- Node.js 16+ va npm 8+
- PostgreSQL 14+

### Backend o'rnatish

1. Backend direktoriyasiga o'ting:
   ```
   cd shajaralar/backend
   ```

2. .env faylini sozlang (ma'lumotlar bazasi sozlamalari va boshqa muhim sozlamalar):
   ```
   cp .env.example .env
   php artisan key:generate
   ```

3. .env faylida ma'lumotlar bazasi sozlamalarini kiriting:
   ```
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=shajara
   DB_USERNAME=sizning_foydalanuvchi_nomingiz
   DB_PASSWORD=sizning_parolingiz
   ```

4. Kerakli paketlarni o'rnating:
   ```
   composer install
   ```

5. Ma'lumotlar bazasi strukturasini yarating:
   ```
   php artisan migrate
   ```

6. Test ma'lumotlarini yuklash (optional):
   ```
   php artisan db:seed
   ```

7. Backendni ishga tushiring:
   ```
   php artisan serve
   ```

### Frontend o'rnatish

1. Frontend direktoriyasiga o'ting:
   ```
   cd shajaralar/frontend
   ```

2. Kerakli paketlarni o'rnating:
   ```
   npm install
   ```

3. Frontendni ishga tushiring:
   ```
   npm start
   ```

## Asosiy komponentlar haqida ma'lumot

### FamilyTreeView komponenti

Bu komponent D3.js yordamida interaktiv shajara daraxtini vizualizatsiya qiladi:

**Asosiy funksiyalar**:
- Daraxtni dinamik ravishda vizualizatsiya qilish
- Daraxt tugunlarini kengaytirish/yig'ish (+/- tugmalari orqali)
- Tugun bosilganda yangi ildizni belgilash (re-rooting)
- Ism bosilganda shaxs tafsilotlariga o'tish
- To'liq ekranga kengaytirish
- Zoom/pan qilish

**Foydalanish**:
```jsx
<FamilyTreeView data={treeData} />
```

`data` - daraxt ma'lumoti, quyidagi formatda bo'lishi kerak:
```javascript
{
  id: 1,
  full_name: 'Ism Familiya',
  birth_date: '1980-01-01',
  death_date: null,
  children: [
    {
      id: 2,
      full_name: 'Farzand Ismfamiliya',
      // ...
      children: []
    }
  ]
}
```

### Testoviy ma'lumotlar seederi

`PeopleSeeder` klass 7 avloddan iborat shajara daraxtini avtomatik yaratadi:

- 2 boshlang'ich ajdod (avlod 0)
- Har bir juftlik uchun 2-5 ta farzand
- Haqiqiy tug'ilish va vafot sanalari
- O'zbek ismlari va biografiya
- Oila aloqalari

**Ishga tushirish**:
```
php artisan db:seed --class=PeopleSeeder
```

## Testlash va debugging

### Backend API testlash
```
php artisan test
```

### Frontend testlash
```
cd frontend
npm test
```

### Ma'lumotlar bazasini tozalash va qayta to'ldirish
```
php artisan migrate:fresh --seed
```

## Deployment

### Production muhitida o'rnatish

1. Backend o'rnatish
```
cd backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

2. Frontend o'rnatish
```
cd frontend
npm install
npm run build
```

Build papkasidagi fayllarni veb-server static fayllar direktoriyasiga joylang.

## Ishlatish

1. Browser orqali frontend dasturiga kiring: http://localhost:3000
2. Yangi foydalanuvchi hisobini yarating
3. Profilga kirib, avlodlar daraxtiga yangi a'zolarni qo'shing
4. Daraxtingizni interaktiv ko'rish va boshqarish imkoniyatidan foydalaning

### Shajara daraxtini ko'rish

1. Daraxtni to'liq ekranda ko'rish uchun o'ng yuqori burchakdagi tugmani bosing
2. Daraxtni yaqinlashtirish/uzoqlashtirish uchun g'ildirakni aylantiring
3. Oila a'zosi doirasini bosib, uni daraxtning yangi ildizi qiling
4. +/- tugmalarini bosib, oila a'zosining farzandlarini yoying/yig'ing
5. Ismga bosib, shaxs tafsilotlariga o'ting

## Kontributorlar

- Dasturchilar jamoasi

## Litsenziya

Bu loyiha MIT litsenziyasi ostida tarqatiladi.

## Bog'lanish

Savollar va takliflar uchun: shajaralar@example.com
