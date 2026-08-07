# Changelog

## 2026-07-31 - Admin Panel Feature Enhancements

### Backend Changes

#### Controllers Updated
- `backend/app/Http/Controllers/Admin/OrderController.php`
  - Added sorting: `sort_field`, `sort_direction`
  - Added date filter: `date_from`, `date_to`
  - Added payment method filter: `payment_method`
  - Added pagination support: `per_page`
  - Added `exportCsv()` method for CSV export

- `backend/app/Http/Controllers/Admin/CategoryController.php`
  - Added product count via `withCount('products')`
  - Added sorting: `sort_field`, `sort_direction`
  - Added status filter: `is_active`
  - Added `toggleStatus()` method
  - Added `exportCsv()` method

- `backend/app/Http/Controllers/Admin/BankAccountController.php`
  - Added search: `search` (bank_name, account_number, account_name)
  - Added sorting: `sort_field`, `sort_direction`
  - Added `toggleStatus()` method

- `backend/app/Http/Controllers/Admin/DashboardController.php`
  - Added today's stats: `today_orders`, `today_revenue`
  - Added yesterday's stats: `yesterday_orders`, `yesterday_revenue`
  - Added top selling products with images
  - Added trend comparison

- `backend/app/Http/Controllers/Admin/SettingController.php`
  - Added `resetDefaults()` method
  - Added default settings configuration

#### Routes Added
- `backend/routes/api.php`
  - `GET /admin/orders/export/csv`
  - `PUT /admin/categories/{category}/toggle-status`
  - `GET /admin/categories/export/csv`
  - `PUT /admin/bank-accounts/{bankAccount}/toggle-status`
  - `POST /admin/settings/reset-defaults`

#### CORS Fix
- `backend/config/cors.php`
  - Added public API paths: `settings`, `categories`, `products`, `cart`, `orders`, `bank-accounts`
  - This fixes CORS errors when frontend runs on different port

#### Services Updated
- `admin-frontend/src/services/adminService.js`
  - Added `exportOrdersCsv()`
  - Added `toggleCategoryStatus()`
  - Added `exportCategoriesCsv()`
  - Added `toggleBankAccountStatus()`
  - Added `resetSettingsDefaults()`

---

### Frontend Improvements by Page

#### 1. Users Page (`admin-frontend/src/pages/Users/index.jsx`)
| # | Feature | Description |
|---|---------|-------------|
| 1 | Toast Notifications | Replaced `alert()` with Toast component |
| 2 | Confirm Modal | Replaced `window.confirm()` with ConfirmModal |
| 3 | Last Login Column | Added last login timestamp |
| 4 | Created At Column | Added creation date |
| 5 | User Detail Modal | Detailed user view with avatar, role, activity |
| 6 | Avatar Upload | Upload user avatar |
| 7 | Bulk Actions | Bulk delete, bulk toggle status |
| 8 | Sorting | Sort by name, email, role, status, created_at |
| 9 | Items Per Page | Dropdown 10/25/50/100 |
| 10 | Export CSV | Export users data |
| 11 | Activity Logs | View user activity history |

#### 2. Products Page (`admin-frontend/src/pages/Products/index.jsx`)
| # | Feature | Description |
|---|---------|-------------|
| 1 | Toast Notifications | Replaced `alert()` with Toast component |
| 2 | Confirm Modal | Replaced `window.confirm()` with ConfirmModal |
| 3 | Sorting | Sort by name, SKU, price, stock, status |
| 4 | Items Per Page | Dropdown 10/25/50/100 |
| 5 | SKU Search | Search by product name or SKU |
| 6 | Bulk Actions | Bulk delete, bulk toggle status, bulk toggle featured |
| 7 | Export CSV | Export products data |
| 8 | Duplicate Product | Clone existing product |

#### 3. Orders Page (`admin-frontend/src/pages/Orders/index.jsx`)
| # | Feature | Description |
|---|---------|-------------|
| 1 | Toast Notifications | Replaced `alert()` with Toast component |
| 2 | Confirm Modal | Replaced `window.confirm()` with ConfirmModal for status change |
| 3 | Sorting | Sort by order_number, date, customer, total, status |
| 4 | Items Per Page | Dropdown 10/20/50/100 |
| 5 | Date Filter | Filter orders by date range (from - to) |
| 6 | Export CSV | Export orders with 13 columns |
| 7 | Copy Order Number | Clipboard copy button for order number |
| 8 | Payment Method Filter | Filter by transfer/COD/QRIS/gerai |
| 9 | Payment Badge | Visual badge for payment method |

#### 4. Categories Page (`admin-frontend/src/pages/Categories/index.jsx`)
| # | Feature | Description |
|---|---------|-------------|
| 1 | Toast Notifications | Replaced `alert()` with Toast component |
| 2 | Confirm Modal | Replaced `window.confirm()` with ConfirmModal |
| 3 | Sorting | Sort by name, slug, sort_order, products_count, is_active |
| 4 | Items Per Page | Dropdown 10/20/50/100 |
| 5 | Status Filter | Filter active/inactive categories |
| 6 | Product Count | Display product count per category |
| 7 | Export CSV | Export categories data |
| 8 | Inline Toggle Status | Click badge to toggle active/inactive |

#### 5. Bank Accounts Page (`admin-frontend/src/pages/BankAccounts/index.jsx`)
| # | Feature | Description |
|---|---------|-------------|
| 1 | Toast Notifications | Replaced `alert()` with Toast component |
| 2 | Confirm Modal | Replaced `window.confirm()` with ConfirmModal |
| 3 | Inline Toggle Status | Click badge to toggle active/inactive |
| 4 | Copy Account Number | Clipboard copy for account number |
| 5 | Search | Search by bank name, account number, account name |
| 6 | Sorting | Sort by bank_name, account_number, account_name, sort_order, is_active |

#### 6. Auth Pages

##### Login (`admin-frontend/src/pages/Auth/Login.jsx`)
| # | Feature | Description |
|---|---------|-------------|
| 1 | Remember Me | Checkbox to save email to localStorage |
| 2 | Auto-focus | Email field auto-focused on page load |

##### Forgot Password (`admin-frontend/src/pages/Auth/ForgotPassword.jsx`)
| # | Feature | Description |
|---|---------|-------------|
| 1 | Countdown Timer | 60-second cooldown after sending reset email |
| 2 | Auto-focus | Email field auto-focused on page load |

##### Reset Password (`admin-frontend/src/pages/Auth/ResetPassword.jsx`)
| # | Feature | Description |
|---|---------|-------------|
| 1 | Password Strength Indicator | Visual progress bar (Lemah/Cukup/Sedang/Kuat) |
| 2 | Password Requirements Checklist | Real-time validation checklist |
| 3 | Weak Password Block | Prevents submission if password is too weak |
| 4 | Auto-focus | Password field auto-focused on page load |

#### 7. Dashboard Page (`admin-frontend/src/pages/Dashboard/index.jsx`)
| # | Feature | Description |
|---|---------|-------------|
| 1 | Today's Stats | Cards showing today's orders & revenue with yesterday comparison |
| 2 | Trend Indicators | Arrows showing increase/decrease vs yesterday |
| 3 | Top Selling Products | Top 5 products with image, qty sold, revenue |
| 4 | Quick Actions | 4 shortcut buttons to navigate to main pages |
| 5 | Auto-refresh | Toggle auto-refresh every 60 seconds |
| 6 | Export Dashboard | Export dashboard summary to CSV |

#### 8. Settings Page (`admin-frontend/src/pages/Settings/index.jsx`)
| # | Feature | Description |
|---|---------|-------------|
| 1 | Toast Notifications | Replaced inline message with Toast component |
| 2 | Unsaved Changes Warning | Browser warning before leaving with unsaved changes |
| 3 | Reset to Defaults | Button + ConfirmModal to reset all settings |
| 4 | Live Hero Preview | Real-time preview of hero section with uploaded background |
| 5 | Settings Tabs | 5 organized tabs: Umum, Kontak, SEO, Tampilan, Pesanan |

---

### Vite Proxy Configuration

#### frontend/vite.config.js
- Added proxy rules for public API routes: `/settings`, `/categories`, `/products`, `/cart`, `/orders`, `/bank-accounts`
- This fixes CORS errors when frontend runs on port 5174 and backend on port 8000

#### frontend/.env.development
- Changed `VITE_API_URL` from `http://localhost:8000` to `/api`
- This ensures API requests use Vite proxy in development mode

---

### Summary Statistics

| Category | Count |
|----------|-------|
| Backend Controllers Updated | 5 |
| New API Endpoints | 7 |
| Frontend Pages Enhanced | 8 |
| Total New Features | 51 |
| CORS Fixes | 2 files |

### Files Modified

#### Backend
- `backend/app/Http/Controllers/Admin/OrderController.php`
- `backend/app/Http/Controllers/Admin/CategoryController.php`
- `backend/app/Http/Controllers/Admin/BankAccountController.php`
- `backend/app/Http/Controllers/Admin/DashboardController.php`
- `backend/app/Http/Controllers/Admin/SettingController.php`
- `backend/routes/api.php`
- `backend/config/cors.php`

#### Frontend
- `admin-frontend/src/pages/Users/index.jsx`
- `admin-frontend/src/pages/Products/index.jsx`
- `admin-frontend/src/pages/Orders/index.jsx`
- `admin-frontend/src/pages/Categories/index.jsx`
- `admin-frontend/src/pages/BankAccounts/index.jsx`
- `admin-frontend/src/pages/Auth/Login.jsx`
- `admin-frontend/src/pages/Auth/ForgotPassword.jsx`
- `admin-frontend/src/pages/Auth/ResetPassword.jsx`
- `admin-frontend/src/pages/Dashboard/index.jsx`
- `admin-frontend/src/pages/Settings/index.jsx`
- `admin-frontend/src/services/adminService.js`
- `admin-frontend/vite.config.js`
- `frontend/vite.config.js`
- `frontend/.env.development`

---

### Migration Notes

All changes are backward compatible. No database migrations required for UI/UX enhancements.

**To apply changes:**
1. Pull latest code
2. Run `composer install` in backend directory
3. Run `npm install` in admin-frontend directory
4. Clear cache: `php artisan optimize:clear`
5. Restart queue workers if applicable
6. Restart Vite dev server to pick up new `.env.development` and `vite.config.js` changes

**CORS Fix for Development:**
- Frontend runs on `http://localhost:5174` (Vite)
- Backend runs on `http://localhost:8000` (Laravel)
- Vite proxy forwards `/api/*` and public API routes to backend
- Backend CORS configured to allow requests from any origin for these paths