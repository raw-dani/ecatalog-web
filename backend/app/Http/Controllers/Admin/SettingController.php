<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->map(function ($setting) {
            $value = $setting->value;
            if (in_array($setting->key, ['store_logo', 'store_hero_background']) && $value) {
                $value = asset('storage/' . $value);
            }
            return [
                'key' => $setting->key,
                'value' => $value,
                'type' => $setting->type,
            ];
        });

        return response()->json($settings);
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
            'url' => asset('storage/' . $path),
        ]);
    }
}
