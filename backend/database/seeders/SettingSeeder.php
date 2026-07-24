<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'store_name', 'value' => 'Toko Online Kami', 'type' => 'string'],
            ['key' => 'store_description', 'value' => 'Toko online terpercaya dengan berbagai produk berkualitas', 'type' => 'string'],
            ['key' => 'store_address', 'value' => 'Jl. Contoh No. 123, Jakarta Selatan', 'type' => 'string'],
            ['key' => 'store_phone', 'value' => '081234567890', 'type' => 'string'],
            ['key' => 'store_whatsapp', 'value' => '6281234567890', 'type' => 'string'],
            ['key' => 'store_email', 'value' => 'info@tokoonline.com', 'type' => 'string'],
            ['key' => 'store_logo', 'value' => 'logo.png', 'type' => 'string'],
            ['key' => 'order_whatsapp_message', 'value' => 'Halo Admin *{store_name}*, saya ingin memesan:', 'type' => 'string'],
            ['key' => 'meta_title', 'value' => 'Toko Online Kami - Produk Berkualitas', 'type' => 'string'],
            ['key' => 'meta_description', 'value' => 'Belanja online mudah dan aman di Toko Online Kami', 'type' => 'string'],
        ];

        foreach ($settings as $setting) {
            Setting::create($setting);
        }
    }
}
