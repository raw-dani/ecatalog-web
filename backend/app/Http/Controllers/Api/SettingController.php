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

        $favicon = $settings['store_favicon'] ?? null;
        if ($favicon) {
            $favicon = asset('storage/' . $favicon);
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
            'store_favicon' => $favicon,
            'social_facebook' => $settings['social_facebook'] ?? '',
            'social_instagram' => $settings['social_instagram'] ?? '',
            'social_twitter' => $settings['social_twitter'] ?? '',
            'social_tiktok' => $settings['social_tiktok'] ?? '',
            'social_youtube' => $settings['social_youtube'] ?? '',
            'help_faq' => $settings['help_faq'] ?? '',
            'help_privacy' => $settings['help_privacy'] ?? '',
            'help_terms' => $settings['help_terms'] ?? '',
            'help_returns' => $settings['help_returns'] ?? '',
            'meta_title' => $settings['meta_title'] ?? '',
            'meta_description' => $settings['meta_description'] ?? '',
            'google_search_console' => $settings['google_search_console'] ?? '',
            'google_analytics' => $settings['google_analytics'] ?? '',
            'google_merchant' => $settings['google_merchant'] ?? '',
            'google_tag_manager' => $settings['google_tag_manager'] ?? '',
        ]);
    }
}
