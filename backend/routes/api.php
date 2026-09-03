<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\BankAccountController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\UserManagementController;
use App\Http\Controllers\Api\LicenseController;
use App\Http\Controllers\Api\License\LicenseCallbackController;
use App\Http\Controllers\Api\StoreSubscriberController;
use App\Http\Controllers\Api\SiteVisitController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\BankAccountController as AdminBankAccountController;
use App\Http\Controllers\Admin\BrandController as AdminBrandController;

Route::middleware(['check.license', 'cache.headers'])->group(function () {
    Route::get('/settings', [SettingController::class, 'index']);
    Route::get('/bank-accounts', [BankAccountController::class, 'index']);

    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{slug}', [CategoryController::class, 'show']);
    Route::get('/categories/{slug}/products', [CategoryController::class, 'products']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/featured', [ProductController::class, 'featured']);
    Route::get('/products/{slug}/related', [ProductController::class, 'related']);
    Route::get('/products/{slug}', [ProductController::class, 'show']);

    Route::post('/track-visit', [SiteVisitController::class, 'track']);

    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/items', [CartController::class, 'store']);
    Route::put('/cart/items/{cartItem}', [CartController::class, 'update']);
    Route::delete('/cart/items/{cartItem}', [CartController::class, 'destroy']);
    Route::delete('/cart', [CartController::class, 'clear']);

    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);

    Route::post('/store/subscribe', [StoreSubscriberController::class, 'subscribe']);
    Route::post('/store/unsubscribe', [StoreSubscriberController::class, 'unsubscribe']);
});

Route::post('/admin/login', [AdminAuthController::class, 'login']);
Route::post('/admin/forgot-password', [AdminAuthController::class, 'forgotPassword']);
Route::post('/admin/reset-password', [AdminAuthController::class, 'resetPassword']);

Route::post('/license/verify', [LicenseController::class, 'verify']);
Route::post('/license/activate', [LicenseController::class, 'activate']);
Route::get('/license/status', [LicenseController::class, 'status']);
Route::get('/license/binding', [LicenseController::class, 'bindingInfo']);
Route::post('/license/bind', [LicenseController::class, 'bind']);
Route::post('/license/callback', [LicenseCallbackController::class, 'handle']);

Route::middleware('auth:admin-api')->group(function () {
    Route::get('/admin/me', [AdminAuthController::class, 'me']);
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    Route::put('/admin/profile', [AdminAuthController::class, 'updateProfile']);
    Route::middleware('role:super_admin,admin,manager,karyawan')->group(function () {
        Route::put('/admin/change-password', [AdminAuthController::class, 'changePassword']);
    });

    // Dashboard — super_admin, admin, manager, demo
    Route::middleware('role:super_admin,admin,manager,demo')->group(function () {
        Route::get('/admin/dashboard', [DashboardController::class, 'stats']);
        Route::get('/admin/traffic', [SiteVisitController::class, 'stats']);
    });

    // Categories — super_admin, admin, manager, demo
    Route::middleware('role:super_admin,admin,manager,demo')->group(function () {
        Route::get('/admin/categories', [AdminCategoryController::class, 'index']);
        Route::get('/admin/categories/export/csv', [AdminCategoryController::class, 'exportCsv']);
        Route::post('/admin/categories', [AdminCategoryController::class, 'store']);
        Route::get('/admin/categories/{category}', [AdminCategoryController::class, 'show']);
        Route::put('/admin/categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('/admin/categories/{category}', [AdminCategoryController::class, 'destroy']);
        Route::post('/admin/categories/{category}/image', [AdminCategoryController::class, 'uploadImage']);
        Route::put('/admin/categories/{category}/toggle-status', [AdminCategoryController::class, 'toggleStatus']);
    });

    // Brands — super_admin, admin, manager, demo
    Route::middleware('role:super_admin,admin,manager,demo')->group(function () {
        Route::get('/admin/brands', [AdminBrandController::class, 'index']);
        Route::post('/admin/brands', [AdminBrandController::class, 'store']);
        Route::get('/admin/brands/{brand}', [AdminBrandController::class, 'show']);
        Route::put('/admin/brands/{brand}', [AdminBrandController::class, 'update']);
        Route::delete('/admin/brands/{brand}', [AdminBrandController::class, 'destroy']);
        Route::post('/admin/brands/{brand}/logo', [AdminBrandController::class, 'uploadLogo']);
        Route::put('/admin/brands/{brand}/toggle-status', [AdminBrandController::class, 'toggleStatus']);
    });

    // Products — super_admin, admin, manager, karyawan, demo
    Route::middleware('role:super_admin,admin,manager,karyawan,demo')->group(function () {
        Route::get('/admin/products', [AdminProductController::class, 'index']);
        Route::post('/admin/products', [AdminProductController::class, 'store']);
        Route::get('/admin/products/{product}', [AdminProductController::class, 'show']);
        Route::put('/admin/products/{product}', [AdminProductController::class, 'update']);
        Route::delete('/admin/products/{product}', [AdminProductController::class, 'destroy']);
        Route::post('/admin/products/{product}/images', [AdminProductController::class, 'uploadImages']);
        Route::delete('/admin/products/{product}/images', [AdminProductController::class, 'deleteImage']);
        Route::put('/admin/products/{product}/images/order', [AdminProductController::class, 'reorderImages']);
        Route::post('/admin/products/{product}/duplicate', [AdminProductController::class, 'duplicate']);
        Route::post('/admin/products/bulk/delete', [AdminProductController::class, 'bulkDelete']);
        Route::post('/admin/products/bulk/toggle-status', [AdminProductController::class, 'bulkToggleStatus']);
        Route::post('/admin/products/bulk/toggle-featured', [AdminProductController::class, 'bulkToggleFeatured']);
        Route::get('/admin/products/export/csv', [AdminProductController::class, 'exportCsv']);
    });

    // Orders — super_admin, admin, manager, demo
    Route::middleware('role:super_admin,admin,manager,demo')->group(function () {
        Route::get('/admin/orders', [AdminOrderController::class, 'index']);
        Route::get('/admin/orders/export/csv', [AdminOrderController::class, 'exportCsv']);
        Route::get('/admin/orders/{order}', [AdminOrderController::class, 'show']);
        Route::put('/admin/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);
    });

    // Bank Accounts — super_admin, admin, demo
    Route::middleware('role:super_admin,admin,demo')->group(function () {
        Route::get('/admin/bank-accounts', [AdminBankAccountController::class, 'index']);
        Route::post('/admin/bank-accounts', [AdminBankAccountController::class, 'store']);
        Route::get('/admin/bank-accounts/{bankAccount}', [AdminBankAccountController::class, 'show']);
        Route::put('/admin/bank-accounts/{bankAccount}', [AdminBankAccountController::class, 'update']);
        Route::delete('/admin/bank-accounts/{bankAccount}', [AdminBankAccountController::class, 'destroy']);
        Route::put('/admin/bank-accounts/{bankAccount}/toggle-status', [AdminBankAccountController::class, 'toggleStatus']);
    });

    // Settings — super_admin, admin, demo
    Route::middleware('role:super_admin,admin,demo')->group(function () {
        Route::get('/admin/settings', [AdminSettingController::class, 'index']);
        Route::put('/admin/settings', [AdminSettingController::class, 'update']);
        Route::post('/admin/settings/logo', [AdminSettingController::class, 'uploadLogo']);
        Route::post('/admin/settings/favicon', [AdminSettingController::class, 'uploadFavicon']);
        Route::post('/admin/settings/reset-defaults', [AdminSettingController::class, 'resetDefaults']);
    });

    // Store Subscribers — super_admin, admin, demo
    Route::middleware('role:super_admin,admin,demo')->group(function () {
        Route::get('/admin/store-subscribers', [StoreSubscriberController::class, 'index']);
    });

    // User Management — super_admin only
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/admin/users', [UserManagementController::class, 'index']);
        Route::post('/admin/users', [UserManagementController::class, 'store']);
        Route::get('/admin/users/{id}', [UserManagementController::class, 'show']);
        Route::put('/admin/users/{id}', [UserManagementController::class, 'update']);
        Route::delete('/admin/users/{id}', [UserManagementController::class, 'destroy']);
        Route::put('/admin/users/{id}/role', [UserManagementController::class, 'assignRole']);
        Route::post('/admin/users/{id}/avatar', [UserManagementController::class, 'uploadAvatar']);
        Route::post('/admin/users/bulk/delete', [UserManagementController::class, 'bulkDelete']);
        Route::post('/admin/users/bulk/toggle-status', [UserManagementController::class, 'bulkToggleStatus']);
        Route::get('/admin/users/activity-logs', [UserManagementController::class, 'activityLogs']);
        Route::get('/admin/users/export/csv', [UserManagementController::class, 'exportCsv']);
        Route::post('/license/deactivate', [LicenseController::class, 'deactivate']);
    });
});
