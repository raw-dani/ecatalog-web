# Panduan Install E-Catalog di cPanel

Panduan ini akan membantu Anda menginstall aplikasi E-Catalog (Laravel Backend + React Frontend) di hosting cPanel.

## Prerequisites

- Hosting dengan cPanel yang mendukung:
  - PHP 8.1 atau higher
  - MySQL/MariaDB
  - Composer
  - Node.js & npm (via Node.js Selector di cPanel)
  - SSH Access (opsional tapi direkomendasikan)
- Domain atau subdomain yang mengarah ke hosting

---

## 1. Persiapan Database

1. Login ke cPanel
2. Buka **MySQL® Database Wizard**
3. Buat database baru:
   - Nama database: `ecatalog_db` (atau nama lain)
4. Buat database user:
   - Username: `ecatalog_user`
   - Password: (buat password yang kuat)
5. Add user to database: beri permission **ALL PRIVILEGES**
6. Catat credentials ini:
   ```
   Database Name: username_ecatalog_db
   Username: username_ecatalog_user
   Password: your_password
   ```

---

## 2. Upload Files ke cPanel

### Opsi A: Menggunakan Git (Rekomendasi jika SSH tersedia)

```bash
# Via SSH, navigate ke public_html
cd ~/public_html

# Clone repository
git clone <repository-url> .

# atau clone ke folder terpisah
git clone <repository-url> ecatalog
```

### Opsi B: Menggunakan File Manager

1. Upload file backend sebagai ZIP dari komputer Anda:
   - `backend.zip` (isi folder backend)
2. Upload file frontend sebagai ZIP:
   - `frontend.zip` (isi folder frontend)
   - `admin-frontend.zip` (isi folder admin-frontend)
3. Extract semua ZIP di `public_html`
4. Struktur folder harus seperti ini:
   ```
   public_html/
   ├── backend/
   ├── frontend/
   ├── admin-frontend/
   ```

### Opsi C: Menggunakan FTP Client (FileZilla, dll)

Upload semua file project ke direktori `public_html` di server.

---

## 3. Setup Backend (Laravel)

### 3.1 Install Dependencies

Via SSH:
```bash
cd ~/public_html/backend
composer install --no-dev --optimize-autoloader
```

Via cPanel Terminal (jika SSH tidak tersedia):
```bash
cd backend
composer install --no-dev --optimize-autoloader
```

### 3.2 Konfigurasi Environment

Copy file `.env.example` menjadi `.env`:

Via File Manager:
- Copy `.env.example` → `.env`

Via SSH/Terminal:
```bash
cp .env.example .env
```

Edit file `.env` dengan settings database dan aplikasi:

```env
APP_NAME="E-Catalog"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domain-anda.com

# Database
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=username_ecatalog_db
DB_USERNAME=username_ecatalog_user
DB_PASSWORD=your_password

# Storage
FILESYSTEM_DISK=public

# Session & Cache (gunakan file untuk shared hosting)
SESSION_DRIVER=file
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
```

### 3.3 Buat Storage Link

```bash
# Via SSH/Terminal
php artisan storage:link
```

Jika error, buat folder `public/storage` secara manual:
```bash
mkdir -p public/storage
ln -s ../storage/app/public public/storage
```

### 3.4 Setup Storage Permissions

```bash
# Via SSH/Terminal
chmod -R 755 storage
chmod -R 755 bootstrap/cache
```

### 3.5 Run Migrations & Seeders

```bash
php artisan migrate --force
php artisan db:seed --force
```

### 3.6 Generate Application Key

```bash
php artisan key:generate --force
```

### 3.7 Cache Configuration (Opsional - untuk performance)

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 3.8 Setup Folder Permissions untuk Upload

```bash
chmod -R 755 storage/app/public
```

---

## 4. Build & Upload Frontend

### 4.1 Build Frontend (Local/Laptop)

Di komputer Anda:

```bash
# Frontend customer
cd frontend
npm install
npm run build

# Admin frontend
cd ../admin-frontend
npm install
npm run build
```

### 4.2 Upload Build Results

Setelah build selesai, upload folder `dist` (atau `build`) dari kedua frontend ke server:

**Struktur yang diharapkan:**
```
public_html/
├── backend/
├── frontend/
│   ├── dist/           # Upload isi folder dist/ ke public_html/frontend
│   └── ...
└── admin-frontend/
    ├── dist/           # Upload isi folder dist/ ke public_html/admin-frontend
    └── ...
```

### 4.3 Konfigurasi Base URL Frontend

Setelah upload, edit file konfigurasi di:

**Frontend (`frontend/dist/assets/`):**
- Cari file `.js` yang berisi base API URL
- Sesuaikan dengan URL backend Anda (contoh: `/api`)

**Admin Frontend (`admin-frontend/dist/assets/`):**
- Lakukan hal yang sama

Catatan: Jika build sudah menggunakan relative path, Anda mungkin tidak perlu merubah apapun.

---

## 5. Setup Backend Routes di cPanel

### Opsi A: Menggunakan Subdomain (Rekomendasi)

**Untuk Customer Frontend:**
1. cPanel → **Subdomains**
   - Subdomain: `shop` (atau kosongkan untuk main domain)
   - Document Root: `public_html/frontend/dist`
   - Create

**Untuk Admin Panel:**
1. cPanel → **Subdomains**
   - Subdomain: `admin`
   - Document Root: `public_html/admin-frontend/dist`
   - Create

**Untuk API Backend:**
1. cPanel → **Subdomains**
   - Subdomain: `api`
   - Document Root: `public_html/backend/public`
   - Create

### Opsi B: Menggunakan Folder di Domain Utama

Jika tidak ingin menggunakan subdomain:

1. Frontend → `public_html/shop` (upload dist ke sini)
2. Admin → `public_html/admin` (upload dist ke sini)
3. Backend tetap di `public_html/backend`

**Catatan:** Anda perlu mengatur `.htaccess` di masing-masing folder agar tidak bentrok.

---

## 6. Konfigurasi Backend URL

Edit file `.env` di backend untuk menambahkan allowed origins:

```env
APP_URL=https://domain-anda.com

# Jika menggunakan subdomain
# APP_URL=https://domain-anda.com
# FRONTEND_URL=https://shop.domain-anda.com
# ADMIN_URL=https://admin.domain-anda.com

# CORS Settings (jika diperlukan tambahkan di cors.php)
# Implementasi CORS bisa ditambahkan di middleware Laravel
```

### 6.1 Setup CORS (jika frontend dan backend di domain berbeda)

Buat middleware baru di Laravel atau edit `app/Http/Middleware/Cors.php`:

```php
// app/Http/Middleware/Cors.php
namespace App\Http\Middleware;

use Closure;

class Cors
{
    public function handle($request, Closure $next)
    {
        $allowedOrigins = [
            'https://domain-anda.com',
            'https://shop.domain-anda.com',
            'https://admin.domain-anda.com',
        ];

        $origin = $request->headers->get('origin');
        
        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
        }

        return $next($request);
    }
}
```

Register middleware di `app/Http/Kernel.php`:
```php
protected $middleware = [
    // ...
    \App\Http\Middleware\Cors::class,
];
```

---

## 7. Setup Supervisor untuk Queue (Opsional)

Jika ingin menggunakan queue untuk email/notification:

### Via cPanel:
1. Buka **Cron Jobs**
2. Tambahkan cron job:
   ```
   * * * * * /usr/local/bin/php /home/username/public_html/backend/artisan queue:work --sleep=3 --tries=3
   ```

---

## 8. Konfigurasi SSL (HTTPS)

1. Di cPanel, buka **SSL/TLS Status**
2. Enable SSL untuk:
   - Domain utama
   - Subdomain `shop`
   - Subdomain `admin`
   - Subdomain `api`

Pastikan URL di `.env` menggunakan `https://`:
```env
APP_URL=https://domain-anda.com
```

---

## 9. Testing

### Test Backend API:
```
https://api.domain-anda.com/api/settings
```
Harus return JSON settings

### Test Customer Frontend:
```
https://shop.domain-anda.com
```
Harus menampilkan halaman beranda

### Test Admin Panel:
```
https://admin.domain-anda.com
```
Harus menampilkan halaman login admin

---

## 10. Troubleshooting

### Error 500 Internal Server Error

1. Cek error log di cPanel:
   - **Metrics → Errors**
   - Atau `~/logs/error_log`

2. Pastikan `.env` sudah dikonfigurasi dengan benar
3. Cek permissions:
   ```bash
   chmod -R 755 storage
   chmod -R 755 bootstrap/cache
   ```

### Error 404 / Route Not Found

1. Pastikan `.htaccess` ada di folder `backend/public/`
2. Pastikan `mod_rewrite` enabled di Apache

### Assets Tidak Load (CSS/JS broken)

1. Pastikan base URL di frontend sesuai
2. Clear cache:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

### Database Connection Error

1. Cek kredensial database di `.env`
2. Pastikan user sudah diberikan ALL PRIVILEGES
3. Test koneksi database via cPanel **phpMyAdmin**

### CORS Error

1. Pastikan CORS middleware sudah diimplementasikan
2. Cek `APP_URL` di `.env`
3. Pastikan allowed origins sudah sesuai

### Image/File Upload Tidak Bekerja

1. Cek permissions folder:
   ```bash
   chmod -R 755 storage/app/public
   ```
2. Pastikan storage link sudah dibuat:
   ```bash
   php artisan storage:link
   ```
3. Di cPanel, cek **Disk Usage** untuk memastikan storage tidak penuh

---

## 11. Maintenance

### Update Aplikasi

```bash
cd ~/public_html/backend
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan view:cache
```

### Backup Database

Via cPanel:
1. **phpMyAdmin** → Select database → Export
2. Atau via command:
   ```bash
   mysqldump -u username_ecatalog_user -p username_ecatalog_db > backup.sql
   ```

### Backup Files

Download via File Manager atau FTP:
- `public_html/backend` (tanpa vendor)
- `public_html/frontend/dist`
- `public_html/admin-frontend/dist`
- Database SQL export

---

## 12. Security Checklist

- [ ] Set `APP_DEBUG=false` di production
- [ ] Set `APP_ENV=production`
- [ ] Gunakan HTTPS (SSL)
- [ ] Jangan commit file `.env` ke version control
- [ ] Set strong password untuk database user
- [ ] Limit PHP execution di folder uploads (jika ada)
- [ ] Enable cPanel **Hotlink Protection**
- [ ] Backup rutin database dan files

---

## Catatan Penting untuk Shared Hosting

1. **Composer Memory Limit**: Jika mengalami error saat `composer install`, jalankan:
   ```bash
   COMPOSER_MEMORY_LIMIT=-1 composer install --no-dev --optimize-autoloader
   ```

2. **Queue Worker**: Di shared hosting,gunakan cron job untuk queue instead of Supervisor:
   ```bash
   * * * * * /usr/local/bin/php /home/username/public_html/backend/artisan queue:work --sleep=3 --tries=3 --stop-when-empty
   ```

3. **Node.js**: Pastikan Node.js version sesuai dengan requirements package.json. Check via cPanel **Node.js Selector**.

4. **File Upload Size**: Jika perlu upload file besar, edit `php.ini` di cPanel:
   ```
   upload_max_filesize = 10M
   post_max_size = 10M
   memory_limit = 256M
   ```

---

## Support

Jika mengalami kendala, periksa:
1. Error logs di cPanel
2. Browser Console (F12) untuk error JavaScript
3. Network tab untuk API errors
4. Laravel log: `storage/logs/laravel.log`