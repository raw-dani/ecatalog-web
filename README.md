# E-Catalog Web

Aplikasi e-catalog berbasis web dengan fitur katalog produk, keranjang belanja, checkout via WhatsApp, pelacakan pesanan, dan panel admin untuk mengelola konten.

## Arsitektur

```
ecatalog-web/
├── backend/          # Laravel 10 API
├── frontend/         # React 19 (customer)
└── admin-frontend/   # React 19 (admin)
```

## Prasyarat

- **PHP** >= 8.1
- **Composer**
- **Node.js** >= 18
- **npm** atau **yarn**
- **MySQL** >= 8.0
- **Git**

## 1. Setup Backend (Laravel API)

```bash
cd backend

# Install dependencies
composer install

# Salin file environment
cp .env.example .env

# Generate app key
php artisan key:generate

# Konfigurasi database di .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=nama_database
# DB_USERNAME=root
# DB_PASSWORD=

# Jalankan migrasi dan seeder
php artisan migrate --seed

# Buat symbolic link storage
php artisan storage:link

# Jalankan server
php artisan serve
```

Backend akan berjalan di `http://localhost:8000`

## 2. Setup Customer Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## 3. Setup Admin Frontend (React)

```bash
cd admin-frontend

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

Admin frontend akan berjalan di `http://localhost:5174` (atau port lain yang tersedia)

## 4. Build untuk Produksi

```bash
# Backend
cd backend
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
cd frontend
npm run build

# Admin Frontend
cd admin-frontend
npm run build
```

Hasil build frontend ada di folder `dist/`. Untuk produksi, konfigurasi web server (Nginx/Apache) agar:
- Mengarahkan request API ke Laravel (`/api`)
- Melayani file statis dari `frontend/dist/` dan `admin-frontend/dist/`

## Akun Default

Setelah menjalankan seeder, akun admin default:

```
Email: admin@tokoonline.com
Password: password
```

Ganti kredensial ini segera setelah login pertama.

## Fitur Utama

- **Katalog Produk**: Lihat produk berdasarkan kategori
- **Keranjang Belanja**: Tambah, ubah jumlah, hapus item
- **Checkout WhatsApp**: Buat pesanan dan kirim via WhatsApp
- **Lacak Pesanan**: Cek status pesanan dengan nomor dan telepon
- **Panel Admin**: Kelola produk, kategori, pesanan, pengaturan, dan rekening bank

## Dependencies

### Backend
- Laravel 10
- Laravel Sanctum (auth)
- Tailwind CSS v4

### Frontend & Admin Frontend
- React 19
- Vite 8
- Tailwind CSS v4
- React Router v7
- Axios
- React Helmet

## Troubleshooting

**Error "Class not found" di Laravel:**
```bash
composer dump-autoload
php artisan config:clear
```

**Gambar tidak muncul:**
```bash
php artisan storage:link
```
Pastikan folder `storage/app/public` memiliki permission yang benar.

**Port sudah terpakai:**
Ubah port di `frontend/vite.config.js` dan `admin-frontend/vite.config.js` di bagian `server.port`.

## License

MIT
