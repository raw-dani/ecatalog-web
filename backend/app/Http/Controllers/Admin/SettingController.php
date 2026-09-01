<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\LicenseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    private LicenseService $licenseService;

    public function __construct(LicenseService $licenseService)
    {
        $this->licenseService = $licenseService;
    }

    private function getDefaultSettings()
    {
        return [
            'store_name' => 'Toko Saya',
            'store_description' => 'Toko online terpercaya',
            'store_address' => '',
            'store_phone' => '',
            'store_whatsapp' => '6281234567890',
            'store_email' => '',
            'meta_title' => 'Toko Online',
            'meta_description' => '',
            'order_whatsapp_message' => 'Halo Admin *{store_name}*, saya ingin memesan:',
            'store_maps_embed' => '',
            'store_favicon' => '',
            'social_facebook' => '',
            'social_instagram' => '',
            'social_twitter' => '',
            'social_tiktok' => '',
            'social_youtube' => '',
            'google_search_console' => '',
            'google_analytics' => '',
            'google_merchant' => '',
            'google_tag_manager' => '',
            'show_stock' => '1',
        ];
    }

    public function index()
    {
        $settings = Setting::all()->map(function ($setting) {
            $value = $setting->value;
            if (in_array($setting->key, ['store_logo', 'store_hero_background', 'store_favicon']) && $value) {
                $value = '/storage/' . $value;
            }
            return [
                'key' => $setting->key,
                'value' => $value,
                'type' => $setting->type,
            ];
        });

        $licenseResult = $this->licenseService->verify();
        $licenseStatus = [
            'status' => ($licenseResult['status'] ?? '') === 'success' ? 'valid' : 'invalid',
            'message' => $licenseResult['message'] ?? 'Tidak dapat memeriksa license',
            'license_key' => config('license.license_key'),
            'platform' => config('license.platform'),
        ];

        if (($licenseResult['status'] ?? '') === 'success' && !empty($licenseResult['data'])) {
            $licenseStatus['data'] = $licenseResult['data'];
        }

        return response()->json([
            'settings' => $settings,
            'license' => $licenseStatus,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'type' => is_array($value) ? 'json' : 'string']
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }

    public function uploadLogo(Request $request)
    {
        $fieldName = $request->hasFile('hero_background') ? 'hero_background' : 'logo';
        $settingKey = $fieldName === 'hero_background' ? 'store_hero_background' : 'store_logo';
        $folder = $fieldName === 'hero_background' ? 'hero-backgrounds' : 'logos';

        $request->validate([
            $fieldName => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        // Delete old file if exists
        $old = Setting::where('key', $settingKey)->first();
        if ($old && $old->value) {
            Storage::disk('public')->delete($old->value);
        }

        $path = $request->file($fieldName)->store($folder, 'public');

        Setting::updateOrCreate(
            ['key' => $settingKey],
            ['value' => $path, 'type' => 'string']
        );

        return response()->json([
            'message' => $settingKey === 'store_hero_background' ? 'Hero background berhasil diupload' : 'Logo berhasil diupload',
            'url' => '/storage/' . $path,
        ]);
    }

    public function uploadFavicon(Request $request)
    {
        $request->validate([
            'favicon' => 'required|image|mimes:ico,png,jpg,gif,svg,webp|max:2048',
        ]);

        $old = Setting::where('key', 'store_favicon')->first();
        if ($old && $old->value) {
            Storage::disk('public')->delete($old->value);
        }

        $path = $request->file('favicon')->store('favicons', 'public');

        Setting::updateOrCreate(
            ['key' => 'store_favicon'],
            ['value' => $path, 'type' => 'string']
        );

        return response()->json([
            'message' => 'Favicon berhasil diupload',
            'url' => '/storage/' . $path,
        ]);
    }

    public function resetDefaults()
    {
        $defaults = $this->getDefaultSettings();
        
        foreach ($defaults as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'type' => 'string']
            );
        }

        return response()->json(['message' => 'Pengaturan berhasil direset ke default', 'settings' => $defaults]);
    }
}