# Panduan Deploy ke cPanel

Aplikasi E-Catalog ini terdiri dari 3 bagian yang harus di-deploy secara terpisah:

1. **Backend API** (Laravel) → `https://api-ecatalog.gmteknologi.com`
2. **Frontend Customer** (React) → `https://ecatalog.gmteknologi.com`
3. **Admin Panel** (React) → `https://admin-ecatalog.gmteknologi.com`

---

## 1. Persiapan di cPanel

### 1.1 Buat Subdomain

Buka **cPanel → Domains → Subdomains** dan buat 3 subdomain:

| Subdomain | Document Root |
|-----------|---------------|
| `api-ecatalog` | `public_html/api-ecatalog/public` |
| `ecatalog` | `public_html/ecatalog` |
| `admin-ecatalog` | `public_html/admin-ecatalog` |

### 1.2 Buat Database MySQL

Buka **cPanel → MySQL Databases**:

1. Buat database baru: `ecatalog_db`
2. Buat user baru: `ecatalog_user` (atau sesuaikan)
3. Set password untuk user
4. Tambahkan user ke database dengan semua privileges

Catat detail koneksi:
- Database: `cpaneluser_ecatalog_db`
- Username: `cpaneluser_ecatalog_user`
- Password: `********`
- Host: `localhost`

### 1.3 Upload File via File Manager atau FTP

#### Upload Backend API

1. Upload seluruh isi folder `backend/` ke `public_html/api-ecatalog/`
2. Pastikan file `.env` ada di root backend (`public_html/api-ecatalog/.env`)
3. Pastikan folder `storage/` dapat ditulis (chmod 755 atau 775)
4. Pastikan folder `bootstrap/cache/` dapat ditulis
5. **Penting:** Document root subdomain `api-ecatalog` harus mengarah ke `public_html/api-ecatalog/public/`, bukan `public_html/api-ecatalog/`. Jika tidak, akses URL akan menghasilkan error 404.

#### Upload Frontend Customer

1. Build frontend terlebih dahulu:
   ```bash
   cd frontend
   npm run build
   ```
2. Upload seluruh isi folder `frontend/dist/` ke `public_html/ecatalog/`

#### Upload Admin Panel

1. Build admin-frontend terlebih dahulu:
   ```bash
   cd admin-frontend
   npm run build
   ```
2. Upload seluruh isi folder `admin-frontend/dist/` ke `public_html/admin-ecatalog/`

---

## 2. Konfigurasi Environment Backend

Edit file `.env` di `public_html/api-ecatalog/.env`:

```env
APP_NAME="E-Catalog"
APP_ENV=production
APP_KEY=base64:GENERATE_DI_SERVER_DENGAN_PHP_ARTISAN_KEY:GENERATE
APP_DEBUG=false
APP_URL=https://api-ecatalog.gmteknologi.com

APP_FRONTEND_URL=https://ecatalog.gmteknologi.com
APP_ADMIN_FRONTEND_URL=https://admin-ecatalog.gmteknologi.com
VITE_API_URL=https://api-ecatalog.gmteknologi.com/api
ASSET_URL=https://api-ecatalog.gmteknologi.com/storage

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=cpaneluser_ecatalog_db
DB_USERNAME=cpaneluser_ecatalog_user
DB_PASSWORD=your_database_password

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_DOMAIN=.gmteknologi.com

SANCTUM_STATEFUL_DOMAINS=ecatalog.gmteknologi.com,admin-ecatalog.gmteknologi.com

MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@gmteknologi.com
MAIL_FROM_NAME="E-Catalog"

LICENSE_DOMAIN=gmteknologi.com
```

### Generate APP_KEY

Setelah mengedit `.env`, jalankan di server:

```bash
cd public_html/api-ecatalog
php artisan key:generate
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 3. Konfigurasi Vite untuk Produksi

### Konfigurasi Environment untuk Produksi

Buat file `.env.production` di masing-masing folder frontend:

**Frontend (`frontend/.env.production`):**
```
VITE_API_URL=https://api-ecatalog.gmteknologi.com/api
```

**Admin Frontend (`admin-frontend/.env.production`):**
```
VITE_API_URL=https://api-ecatalog.gmteknologi.com/api
```

> **Penting:** Sertakan `/api` di akhir URL. Laravel routes API menggunakan prefix `/api`, jadi request frontend harus ke `/api/categories`, bukan `/categories`.

File `.env.production` ini berisi URL API yang digunakan saat produksi. Vite secara otomatis memuat file ini saat `npm run build` dijalankan.

Untuk development, buat file `.env.development`:

**Frontend (`frontend/.env.development`):**
```
VITE_API_URL=http://localhost:8000/api
```

**Admin Frontend (`admin-frontend/.env.development`):**
```
VITE_API_URL=http://localhost:8000/api
```

Build untuk produksi:

```bash
cd frontend
npm run build
```

Hasil build akan ada di `frontend/dist/`. Upload ke `public_html/ecatalog/`.

---

## 4. Setup Database

### 4.1 Jalankan Migrasi dan Seeder

SSH ke server (atau gunakan cPanel Terminal jika tersedia):

```bash
cd public_html/api-ecatalog
php artisan migrate --force
php artisan db:seed --force
```

### 4.2 Buat Storage Link

Agar gambar dan file upload bisa diakses via URL:

```bash
cd public_html/api-ecatalog
php artisan storage:link
```

### 4.3 Verifikasi

Buka `https://api-ecatalog.gmteknologi.com/api/settings` di browser untuk memastikan API berjalan.

---

## 5. Konfigurasi SSL (HTTPS)

### 5.1 Untuk Semua Subdomain

Di cPanel, buka **SSL/TLS** atau **Let's Encrypt** (jika tersedia):

1. Aktifkan SSL untuk `api-ecatalog.gmteknologi.com`
2. Aktifkan SSL untuk `ecatalog.gmteknologi.com`
3. Aktifkan SSL untuk `admin-ecatalog.gmteknologi.com`

### 5.2 Force HTTPS di Laravel

Di `.env` backend, pastikan:

```env
APP_URL=https://api-ecatalog.gmteknologi.com
```

Dan tambahkan di `app/Providers/AppServiceProvider.php`:

```php
public function boot(): void
{
    if (config('app.env') === 'production') {
        \Illuminate\Support\Facades\URL::forceScheme('https');
    }
}
```

Jangan lupa jalankan:

```bash
cd public_html/api-ecatalog
php artisan config:cache
```

---

## 6. Konfigurasi CORS

Pastikan CORS diizinkan untuk domain frontend dan admin. Edit `config/cors.php`:

```php
<?php

return [
    'paths' => ['api/*', 'admin/*', 'sanctum/csrf-cookie', 'settings', 'categories', 'products', 'cart', 'orders', 'bank-accounts'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://ecatalog.gmteknologi.com',
        'https://admin-ecatalog.gmteknologi.com',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
```

> **Penting:** Setelah mengubah `config/cors.php`, jalankan `php artisan config:clear` di server agar perubahan diterapkan.

---

## 7. Struktur File di cPanel

```
public_html/
├── api-ecatalog/          ← Backend Laravel API (document root: public/)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/            ← Document root subdomain (index.php + .htaccess berada di sini)
│   │   ├── index.php
│   │   └── .htaccess
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env
│   └── composer.json
│
├── ecatalog/              ← Frontend Customer (React)
│   ├── index.html
│   ├── .htaccess
│   ├── assets/
│   │   ├── index-XXXXX.js
│   │   └── index-XXXXX.css
│   └── ...
│
└── admin-ecatalog/        ← Admin Panel (React)
    ├── index.html
    ├── .htaccess
    ├── assets/
    │   ├── index-XXXXX.js
    │   └── index-XXXXX.css
    └── ...
```

---

## 8. Konfigurasi .htaccess

### 8.1 Backend (`public_html/api-ecatalog/public/.htaccess`)

Pastikan file `.htaccess` ada dan berisi:

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

### 8.2 Frontend Customer (`public_html/ecatalog/.htaccess`)

File ini sudah disertakan otomatis di `frontend/dist/.htaccess` setelah build. Jika tidak ada, buat manual:

```apache
<IfModule LiteSpeed>
  CacheEnable public /
  CacheExpire 86400
  CacheMaxExpire 2592000
  CacheIgnoreCacheControl On
  CacheIgnoreNoLastMod On
  CacheStoreNoStore On
  CacheStorePrivate On
  CacheVaryOn User-Agent
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On

  ExpiresByType text/html "access plus 1 hour"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType application/x-javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType application/font-woff "access plus 1 year"

  <FilesMatch "\.(html|htm)$">
    ExpiresByType text/html "access plus 1 hour"
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>

  <FilesMatch "\.(json|xml)$">
    ExpiresByType application/json "access plus 1 hour"
    ExpiresByType application/xml "access plus 1 hour"
    Header set Cache-Control "public, max-age=3600"
  </FilesMatch>

  <IfModule mod_headers.c>
    Header set Vary "Accept-Encoding"
    Header append Vary "User-Agent"
  </IfModule>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css text/javascript application/javascript application/json application/xml application/xhtml+xml application/rss+xml application/atom+xml image/svg+xml
  <IfModule mod_headers.c>
    Header set X-Content-Type-Options nosniff
    Header set X-Frame-Options SAMEORIGIN
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
  </IfModule>
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # SPA fallback: serve index.html for all non-file/non-folder requests
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.html [L]

  RewriteRule ^(.*)\.(gzip|br)$ - [L]
  RewriteCond %{HTTP:Accept-encoding} br
  RewriteRule ^(.*)$ $1.br [QSA,L]
  RewriteCond %{HTTP:Accept-encoding} gzip
  RewriteRule ^(.*)$ $1.gz [QSA,L]
</IfModule>
```

### 8.3 Admin Panel (`public_html/admin-ecatalog/.htaccess`)

Sama seperti frontend customer:

```apache
<IfModule LiteSpeed>
  CacheEnable public /
  CacheExpire 86400
  CacheMaxExpire 2592000
  CacheIgnoreCacheControl On
  CacheIgnoreNoLastMod On
  CacheStoreNoStore On
  CacheStorePrivate On
  CacheVaryOn User-Agent
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On

  ExpiresByType text/html "access plus 1 hour"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType application/x-javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType application/font-woff "access plus 1 year"

  <FilesMatch "\.(html|htm)$">
    ExpiresByType text/html "access plus 1 hour"
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </FilesMatch>

  <FilesMatch "\.(json|xml)$">
    ExpiresByType application/json "access plus 1 hour"
    ExpiresByType application/xml "access plus 1 hour"
    Header set Cache-Control "public, max-age=3600"
  </FilesMatch>

  <IfModule mod_headers.c>
    Header set Vary "Accept-Encoding"
    Header append Vary "User-Agent"
  </IfModule>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css text/javascript application/javascript application/json application/xml application/xhtml+xml application/rss+xml application/atom+xml image/svg+xml
  <IfModule mod_headers.c>
    Header set X-Content-Type-Options nosniff
    Header set X-Frame-Options SAMEORIGIN
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
  </IfModule>
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # SPA fallback: serve index.html for all non-file/non-folder requests
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ index.html [L]

  RewriteRule ^(.*)\.(gzip|br)$ - [L]
  RewriteCond %{HTTP:Accept-encoding} br
  RewriteRule ^(.*)$ $1.br [QSA,L]
  RewriteCond %{HTTP:Accept-encoding} gzip
  RewriteRule ^(.*)$ $1.gz [QSA,L]
</IfModule>
```

---

## 9. Symlink Storage untuk Gambar

Karena frontend dan admin di-deploy di subdomain terpisah, mereka tidak bisa mengakses symlink `storage` dari backend secara default. Buat symlink di setiap frontend:

### Via SSH di cPanel:

```bash
# Untuk frontend customer (ecatalog.gmteknologi.com)
ln -s /home/USERNAME/public_html/api-ecatalog/storage/app/public /home/USERNAME/public_html/ecatalog/storage

# Untuk admin panel (admin-ecatalog.gmteknologi.com)
ln -s /home/USERNAME/public_html/api-ecatalog/storage/app/public /home/USERNAME/public_html/admin-ecatalog/storage
```

Ganti `USERNAME` dengan username cPanel Anda. Pastikan path sesuai dengan lokasi sebenarnya di server.

Pastikan folder `storage/app/public` memiliki permission yang benar (755 atau 775).

> **Catatan:** Jika symlink tidak bisa dibuat di shared hosting, alternatifnya adalah mengakses gambar via URL API penuh (`https://api-ecatalog.gmteknologi.com/storage/...`). Backend sudah dikonfigurasi untuk mengembalikan URL asset lengkap melalui `ASSET_URL`.

---

## 10. Verifikasi Deploy

### 10.1 Cek Backend API

Buka di browser:
- `https://api-ecatalog.gmteknologi.com/api/settings` → Harusnya mengembalikan data pengaturan toko
- `https://api-ecatalog.gmteknologi.com/api/products/featured` → Harusnya mengembalikan produk unggulan
- `https://api-ecatalog.gmteknologi.com/api/categories` → Harusnya mengembalikan daftar kategori

### 10.2 Cek Frontend Customer

Buka di browser:
- `https://ecatalog.gmteknologi.com` → Halaman beranda harus tampil
- `https://ecatalog.gmteknologi.com/produk` → Halaman produk harus tampil
- Klik produk, tambah ke keranjang, checkout → Pastikan API terhubung

### 10.3 Cek Admin Panel

Buka di browser:
- `https://admin-ecatalog.gmteknologi.com` → Halaman login admin harus tampil
- Login dengan kredensial admin → Dashboard harus tampil

---

## 11. Troubleshooting

### Error 500 di Backend

```bash
cd public_html/api-ecatalog
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear
tail -f storage/logs/laravel.log
```

### Error CORS (Cross-Origin Resource Sharing)

Jika browser melaporkan error CORS, pastikan:
1. `config/cors.php` sudah mencakup domain frontend di `allowed_origins`
2. Jalankan `php artisan config:clear` di server setelah mengubah CORS config
3. Pastikan `HandleCors` middleware ada di `app/Http/Kernel.php` (global middleware stack)

### Error 404 di Frontend/Admin (SPA Route)

Pastikan file `.htaccess` ada di folder frontend dan admin dengan SPA rewrite rule. Jika tidak ada, buat manual sesuai bagian 8.

### Error 404 di API (Frontend tidak bisa akses backend)

Ini terjadi karena frontend membuat request ke URL tanpa prefix `/api`.

**Solusi:**
1. Pastikan file `.env.production` ada di folder `frontend/` dan `admin-frontend/` dengan isi:
   ```
   VITE_API_URL=https://api-ecatalog.gmteknologi.com/api
   ```
2. Rebuild frontend:
   ```bash
   cd frontend
   npm run build
   ```
3. Upload ulang isi folder `dist/` ke `public_html/ecatalog/`

### Error 404 di Backend API

Ini terjadi karena document root subdomain tidak mengarah ke folder `public/` Laravel.

**Solusi:**
1. Di cPanel → Subdomains, edit subdomain `api-ecatalog`
2. Ubah document root menjadi `public_html/api-ecatalog/public`
3. Save

Atau jika tidak bisa mengubah document root, pindahkan isi folder `public/` ke root subdomain dan sesuaikan path di `index.php`:
- `__DIR__.'/../storage/...'` → `__DIR__.'/storage/...'`
- `__DIR__.'/../vendor/...'` → `__DIR__.'/vendor/...'`
- `__DIR__.'/../bootstrap/...'` → `__DIR__.'/bootstrap/...'`

### Gambar Tidak Muncul (404 pada /storage/...)

Ini terjadi karena symlink storage. Pastikan symlink sudah dibuat sesuai bagian 9, atau akses gambar via URL API penuh.

Via SSH di cPanel:

```bash
# Untuk frontend customer (ecatalog.gmteknologi.com)
ln -s /home/USERNAME/public_html/api-ecatalog/storage/app/public /home/USERNAME/public_html/ecatalog/storage

# Untuk admin panel (admin-ecatalog.gmteknologi.com)
ln -s /home/USERNAME/public_html/api-ecatalog/storage/app/public /home/USERNAME/public_html/admin-ecatalog/storage
```

Ganti `USERNAME` dengan username cPanel Anda. Pastikan path ke backend storage sesuai dengan lokasi sebenarnya di server Anda.

Pastikan folder `storage/app/public` memiliki permission yang benar (755 atau 775).

### Database Connection Error

Pastikan `.env` sudah benar dan database user memiliki akses ke database.

---

## 12. Update Aplikasi di Production

### Update Backend

```bash
cd public_html/api-ecatalog
git pull origin main
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Update Frontend Customer

```bash
cd frontend
npm install
npm run build
# Upload ulang isi folder dist/ ke public_html/ecatalog/
```

### Update Admin Panel

```bash
cd admin-frontend
npm install
npm run build
# Upload ulang isi folder dist/ ke public_html/admin-ecatalog/
```

---

## 13. Keamanan Produksi

1. **Nonaktifkan debug mode** — Pastikan `APP_DEBUG=false` di `.env`
2. **Gunakan HTTPS** — Semua subdomain harus menggunakan SSL
3. **Regenerate APP_KEY** — Jangan gunakan APP_KEY yang sama untuk development dan production
4. **Batasi akses file .env** — Pastikan `.env` tidak dapat diakses dari web
5. **Regular backup** — Backup database dan file secara berkala
6. **Update dependencies** — Rutin update composer dan npm packages
