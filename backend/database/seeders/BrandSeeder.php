<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            ['name' => 'Apple', 'slug' => 'apple', 'description' => 'Produk Apple', 'is_active' => true, 'sort_order' => 1],
            ['name' => 'Samsung', 'slug' => 'samsung', 'description' => 'Produk Samsung', 'is_active' => true, 'sort_order' => 2],
            ['name' => 'Xiaomi', 'slug' => 'xiaomi', 'description' => 'Produk Xiaomi', 'is_active' => true, 'sort_order' => 3],
            ['name' => 'Nike', 'slug' => 'nike', 'description' => 'Produk Nike', 'is_active' => true, 'sort_order' => 4],
            ['name' => 'Adidas', 'slug' => 'adidas', 'description' => 'Produk Adidas', 'is_active' => true, 'sort_order' => 5],
        ];

        foreach ($brands as $brand) {
            Brand::firstOrCreate(['slug' => $brand['slug']], $brand);
        }
    }
}
