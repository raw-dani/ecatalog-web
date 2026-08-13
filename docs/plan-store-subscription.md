# Fitur Ikuti Toko (Store Subscription)

## Ringkasan
Fitur ini memungkinkan customer mengikuti toko dengan mendaftarkan email mereka. Setiap kali admin upload produk baru, sistem akan mengirim notifikasi email ke semua subscriber yang masih aktif.

---

## Arsitektur

### 1. Database
**Table: `store_subscribers`**
- `id` - primary key
- `email` - varchar, unique, indexed
- `store_id` - foreign key ke stores (atau NULL untuk global setting)
- `token` - varchar, unique (untuk unsubscribe)
- `is_active` - boolean (default true)
- `subscribed_at` - timestamp
- `unsubscribed_at` - nullable timestamp
- `created_at` / `updated_at`

### 2. Backend API

**POST /api/store/subscribe**
- Request: `{ email: string }`
- Validasi: email format, cek duplikat
- Response: `{ success: boolean, message: string }`

**POST /api/store/unsubscribe**
- Request: `{ email: string, token: string }`
- Validasi: token match
- Response: `{ success: boolean, message: string }`

**GET /api/store/subscribers** (admin only)
- Response: list subscribers dengan filter active/inactive

### 3. Email Notification

**Trigger:** Setelah produk baru berhasil dibuat (ProductController@store)

**Mail Class:** `NewProductNotificationMail`
- Subject: "Produk Baru di [Nama Toko]"
- Content:
  - Nama toko
  - Nama produk baru
  - Harga
  - Gambar produk
  - Deskripsi singkat
  - Link ke halaman produk
  - Link unsubscribe

**Queue:** Gunakan Laravel Queue untuk avoid blocking

### 4. Frontend

**Home.jsx - Tombol "Ikuti Toko"**
- Saat klik, tampilkan modal/form input email
- Validasi email client-side
- Submit ke API subscribe
- Tampilkan pesan sukses/error

**Unsubscribe Flow:**
- Link di email: `https://domain.com/unsubscribe?email=xxx&token=xxx`
- Halaman unsubscribe sederhana
- Atau via API POST dengan email + token

**Tombol State:**
- Default: "+ Ikuti Toko"
- Setelah subscribe: "✓ Mengikuti" (dengan option unsubscribe)

### 5. Admin Features (Optional - Future)
- Menu di admin untuk melihat list subscribers
- Export CSV subscribers
- Bulk email (bisa dikembangkan jadi newsletter)

---

## Implementasi Step-by-step

### Phase 1: Backend Foundation
1. Create migration `create_store_subscribers_table`
2. Create model `StoreSubscriber`
3. Create controller `StoreSubscriberController`
4. Add routes in `routes/api.php`
5. Create mail class `NewProductNotificationMail`

### Phase 2: Email Integration
1. Modify `ProductController@store` to dispatch email after product created
2. Configure mail driver (SMTP/Mailgun/etc)
3. Test email delivery

### Phase 3: Frontend Integration
1. Update Home.jsx subscribe button with modal
2. Add unsubscribe page/route
3. Add loading/error states

### Phase 4: Admin Panel (Optional)
1. Add subscriber management page in admin
2. Add view in admin dashboard

---

## Security & Best Practices
- Token-based unsubscribe (bukan plain email)
- Rate limiting pada subscribe endpoint
- Double opt-in (kirim konfirmasi email sebelum aktif) - optional
- Sanitize email input
- Use queue for email sending
- Track unsubscribe untuk compliance

---

## Dependencies
- Laravel Mail (sudah ada)
- Laravel Queue (sudah ada)
- No extra packages needed
