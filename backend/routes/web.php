<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LicenseController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/verify-license', [LicenseController::class, 'status']);
Route::post('/activate-license', [LicenseController::class, 'activate']);
