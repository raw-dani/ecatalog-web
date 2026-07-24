<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Setting;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');

        $logo = $settings['store_logo'] ?? null;
        if ($logo) {
            $logo = asset('storage/' . $logo);
        }

        $heroBackground = $settings['store_hero_background'] ?? null;
        if ($heroBackground) {
            $heroBackground = asset('storage/' . $heroBackground);
        }

        return response()->json([
            'store_name' => $settings['store_name'] ?? 'Toko Online',
            'store_description' => $settings['store_description'] ?? '',
            'store_address' => $settings['store_address'] ?? '',
            'store_phone' => $settings['store_phone'] ?? '',
            'store_whatsapp' => $settings['store_whatsapp'] ?? '',
            'store_email' => $settings['store_email'] ?? '',
            'store_logo' => $logo,
            'store_maps_embed' => $settings['store_maps_embed'] ?? '',
            'store_hero_background' => $heroBackground,
            'meta_title' => $settings['meta_title'] ?? '',
            'meta_description' => $settings['meta_description'] ?? '',
        ]);
    }
}
