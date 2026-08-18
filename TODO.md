# Scope of Work & Estimasi Mandays (±580 jam)

## Ringkasan
- Total estimasi: **580 jam**
- Dengan asumsi **1 manday = 8 jam** ⇒ **72.5 mandays**

## A. Analisa kebutuhan & perancangan
1) Kickoff, identifikasi fitur & endpoint (backend+frontend) — **16 jam**
2) Analisa domain data (Order/OrderItem/CartItem/Product/Category/Setting/BankAccount + status) — **12 jam**
3) Desain API contract (admin vs user) — **10 jam**
4) Perancangan UX dasar admin & user flow — **8 jam**

**Sub-total A = 46 jam**

## B. Backend Laravel (API + Admin endpoints)
1) Setup project Laravel, env, routing, middleware admin.auth — **8 jam**
2) Auth Admin (login/me/logout) — **10 jam**
3) Settings (CRUD admin + API publik) — **12 jam**
4) BankAccounts (CRUD admin + listing publik) — **16 jam**
5) Categories (CRUD admin + publik list/show/products) — **24 jam**
6) Products (CRUD admin + publik list/featured/show + validasi stock/min_order/discount) — **28 jam**
7) Cart API (CRUD item + clear) — **18 jam**
8) Orders API (store order + generate order_number + load items + hapus cart) — **24 jam**
9) Admin Orders (index/show/updateStatus) — **14 jam**
10) Validasi request & konsistensi response — **12 jam**
11) Unit/integration test minimal (smoke endpoints kritikal) — **10 jam**
12) Dokumentasi endpoint singkat + checklist deploy — **6 jam**

**Sub-total B = 182 jam**

## C. Frontend Admin (React/Vite)
1) Setup routing admin, layout, auth gate — **10 jam**
2) Dashboard (fetch stats + UI) — **8 jam**
3) Categories admin (CRUD + form + validasi UI minimal) — **24 jam**
4) Products admin (CRUD + form price/stock/discount) — **32 jam**
5) Orders admin (table, detail modal, update status) — **20 jam**
6) BankAccounts admin (CRUD) — **20 jam**
7) Settings admin (edit) — **12 jam**
8) Integrasi service layer + handling loading/error — **10 jam**
9) QA UI dasar (state/modal/tabel/status update) — **8 jam**

**Sub-total C = 144 jam**

## D. Frontend User (React/Vite)
1) Setup routing user, layout, integrasi API base — **10 jam**
2) Home + featured products — **10 jam**
3) Categories (list + kategori detail + produk per kategori) — **14 jam**
4) Products list (search/filter ringan jika ada) — **14 jam**
5) ProductDetail (detail produk + add to cart) — **18 jam**
6) Cart (CRUD item + subtotal + checkout/order initiation) — **22 jam**
7) OrderTracking (fetch order by orderNumber) — **12 jam**
8) HowToOrder/Contact (konten + link) — **8 jam**
9) WhatsApp integration (create message/link + mapping payload order) — **12 jam**
10) QA dasar user flow (browsing → cart → order → tracking) — **10 jam**

**Sub-total D = 140 jam**

## E. QA menyeluruh & hardening
1) Cross-check response konsistensi backend (admin vs public) — **8 jam**
2) UAT skenario utama: Admin CRUD/update status + User cart→order→tracking — **16 jam**
3) Fix bug minor & polishing (loading/error/edge cases) — **12 jam**
4) Performa ringan (optimasi rendering tabel/caching bila ada) — **6 jam**
5) Security baseline (validasi input + hak akses admin) — **8 jam**

**Sub-total E = 50 jam**

## F. Dokumentasi & serah terima
1) Dokumentasi penggunaan (admin/user flow + env vars) — **8 jam**
2) Checklist deployment (build frontend, migration, env) — **6 jam**
3) Training singkat (jika diperlukan) — **4 jam**

**Sub-total F = 18 jam**

---

## G. User Management & Role Management (Baru)

### G1. Backend — Model & Database
1) Update `Admin` model — ubah `role` dari enum menjadi string dengan validasi, tambah `role` ke fillable — **2 jam**
2) Buat migration `alter_admins_add_role_enum` — expand enum `super_admin`, `admin`, `manager`, `karyawan` — **2 jam**
3) Buat migration `create_roles_table` — tabel roles (id, name, guard_name, created_at, updated_at) — **3 jam**
4) Buat migration `create_role_admin_pivot` — pivot table role_admin (role_id, admin_id) — **2 jam**
5) Buat `Role` model — **2 jam**
6) Update `Admin` model — tambah relationship `roles()` (many-to-many) — **2 jam**

### G2. Backend — Middleware & Auth
7) Buat `RoleMiddleware` — middleware untuk cek role berdasarkan route parameter — **4 jam**
8) Update `AdminAuthController` — tambah `me()` response dengan roles, update `login()` — **3 jam**
9) Update `auth.php` config — tambah guard `admin-role` jika diperlukan — **1 jam**
10) Tambah role-based access ke existing admin routes (Dashboard, Products, Orders, Categories, BankAccounts, Settings) — **4 jam**

### G3. Backend — API Routes & Controllers
11) Buat API routes untuk user management (`/admin/users`, `/admin/users/{id}`, `/admin/users/{id}/role`) — **2 jam**
12) Buat `UserManagementController` — index, store, show, update, destroy, assignRole — **10 jam**
13) Update `AdminSeeder` — seed 3 role (admin, manager, karyawan) + assign ke admin — **2 jam**
14) Update `DatabaseSeeder` — panggil UserManagementSeeder — **1 jam**

### G4. Frontend Admin
15) Update `adminService.js` — tambah methods: `getUsers()`, `createUser()`, `updateUser()`, `deleteUser()`, `assignRole()` — **4 jam**
16) Buat halaman User Management (`/users`) — table, create/edit modal, role selector — **16 jam**
17) Tambah route `/users` ke `App.jsx` — **1 jam**
18) Role-based UI di `AdminLayout` — sembunyikan nav item berdasarkan role — **4 jam**
19) Update `AuthContext.jsx` — simpan dan expose roles — **2 jam**

### G5. QA & Dokumentasi
20) Test user management flow (create user, assign role, login as role berbeda, akses route) — **6 jam**
21) Update `CPANEL_INSTALL.md` dengan langkah migrasi, seeder, dan role setup — **2 jam**

**Sub-total G = 72 jam**

---

## Total
- **Total Jam:** 652 jam (580 + 72)
- **Mandays (1 manday = 8 jam):** 81.5 mandays

## Deliverables
- Backend: endpoint admin/auth + CRUD module + API publik (categories/products/cart/orders) + user management API
- Admin Frontend: dashboard, categories, products, orders, bank accounts, settings, users + update status + role-based UI
- User Frontend: katalog, cart, order (WhatsApp), order tracking
- QA/UAT checklist + dokumentasi deploy singkat

---

## H. Automatic License Lock / Suspend (Baru)

### Ringkasan
Saat license di-suspend oleh License Manager, aplikasi harus langsung mengunci halaman frontend dan admin dengan overlay/tampilan khusus, bukan hanya mengembalikan error API.

### H1. Backend — Response & Middleware
1) Pastikan `CheckLicense` middleware mengembalikan respons konsisten untuk JSON dan non-JSON saat license invalid/suspend — **1 jam**
2) Tambah endpoint publik `/license/status` (jika belum) yang mengembalikan status license saat ini untuk frontend — **1 jam**
3) Update `config/cors.php` agar path `/license/status` termasuk dalam CORS yang diizinkan — **0.5 jam**

### H2. Frontend Customer (`frontend/`)
4) Buat `LicenseContext` / global axios interceptor yang mendeteksi `license_error: true` dari response API — **2 jam**
5) Buat komponen overlay `LicenseLocked` untuk menampilkan pesan lock/suspend di frontend — **2 jam**
6) Integrasikan overlay ke `App.jsx` agar muncul di semua halaman customer saat license terkunci — **1 jam**
7) Tambah polling ringan ke `/license/status` untuk mendeteksi perubahan status tanpa perlu reload — **1 jam**

### H3. Admin Frontend (`admin-frontend/`)
8) Tambah response interceptor global yang sama untuk admin API — **1 jam**
9) Buat overlay `LicenseLocked` untuk admin panel — **1.5 jam**
10) Integrasikan overlay ke `App.jsx` admin agar muncul di semua halaman admin saat license terkunci — **0.5 jam**
11) Pastikan halaman login admin tetap bisa diakses meskipun license suspend, untuk aktivasi ulang — **0.5 jam**

### H4. QA & Testing
12) Test skenario suspend license di License Manager → frontend locked, admin locked, API blocked — **2 jam**
13) Test skenario grace period / reconnect → lock otomatis hilang tanpa reload — **1 jam**
14) Update `CPANEL_INSTALL.md` atau README dengan penjelasan mekanisme lock — **0.5 jam**

**Sub-total H ≈ 14.5 jam**

